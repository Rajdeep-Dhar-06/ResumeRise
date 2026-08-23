"""
Core Orchestrator for the ResumeRise AI Pipeline.

This module defines the Directed Acyclic Graph (DAG) for processing a candidate's profile against a job description.
It heavily utilizes `asyncio` to run independent LLM tasks (like evaluating technical vs non-technical skills) 
in parallel, drastically reducing the total API response time.
"""
import asyncio
from schemas.evaluation import RequirementEvaluation
from schemas.report import JobDescription, MatchTier, GapSeverity
from schemas.final_report import FinalReport, PreparationGap
from services.parser import anonymize_text
from services.scraper import get_job_description
from services.evaluator import evaluate_requirements_batch
from services.scorer import calculate_final_score
from services.search import get_learning_resources
from services.augmentation import (
    generate_tech_questions,
    generate_non_tech_questions,
    generate_study_plan,
)

async def analyze_candidate(
    candidate_text: str,
    jd_url: str,
    days_limit: int = 7
) -> FinalReport:
    """
    Executes the end-to-end AI analysis pipeline.

    Args:
        candidate_text (str): The concatenated string of the user's PDF resume and optional career transcript.
        jd_url (str): The URL of the job posting to analyze against.
        days_limit (int, optional): The number of days to spread the study plan across. Defaults to 7.

    Returns:
        FinalReport: A strictly typed Pydantic object representing the entire interview strategy.
    """
    clean_text = anonymize_text(candidate_text)

    # Stage 1: Ingestion (Web scrape & JD extraction)
    # We first need to know what the job actually requires before evaluating the candidate.
    jd = await get_job_description(jd_url)

    # Stage 2: Concurrent Batch Evaluation for Tech and Non-Tech
    # We use `asyncio.gather` to execute these two heavy LLM calls simultaneously.
    # By evaluating technical and non-technical skills in parallel, we save significant time.
    tech_evals_batch, non_tech_evals_batch = await asyncio.gather(
        evaluate_requirements_batch(jd.technical_requirements, clean_text, "Technical"),
        evaluate_requirements_batch(jd.non_technical_requirements, clean_text, "Non-Technical"),
        return_exceptions=True
    )
    
    tech_evals = tech_evals_batch if not isinstance(tech_evals_batch, BaseException) else []
    non_tech_evals = non_tech_evals_batch if not isinstance(non_tech_evals_batch, BaseException) else []
    all_evaluations = tech_evals + non_tech_evals

    # Stage 3: Score & Identify Gaps
    score = calculate_final_score(tech_evals, non_tech_evals)

    # Filter out skills where the candidate scored WEAK_MATCH or NO_MATCH
    critical_gaps = [
        e for e in all_evaluations
        if e.match_tier in (MatchTier.WEAK_MATCH, MatchTier.NO_MATCH)
    ]

    preparation_gaps = [
        PreparationGap(
            requirement_name=gap.requirement_name,
            gap_severity=GapSeverity.HIGH if gap.match_tier == MatchTier.NO_MATCH else GapSeverity.MEDIUM
        )
        for gap in critical_gaps
    ]

    # Stage 4: Parallel Augmentation (Search, Questions, and Study Plan)
    # 4A. Run Tavily Search and Question Generations in parallel
    # These three tasks are independent of each other, so we fan them out concurrently.
    resources, tech_questions, non_tech_questions = await asyncio.gather(
        get_learning_resources(critical_gaps, jd.role),
        generate_tech_questions(tech_evals, jd.role),
        generate_non_tech_questions(non_tech_evals, clean_text, jd.role)
    )

    # 4B. Generate study plan integrating the retrieved search resources
    # This task MUST wait for `get_learning_resources` to finish, so it runs sequentially after the gather block.
    plan = await generate_study_plan(critical_gaps, resources, days_limit=days_limit)

    # Stage 5: Compile Final Report
    # Pydantic will automatically validate that all these fields match the FinalReport schema.
    return FinalReport(
        company_name=jd.company_name,
        role=jd.role,
        match_score=score,
        technical_evaluations=tech_evals,
        non_technical_evaluations=non_tech_evals,
        technical_questions=tech_questions,
        non_technical_questions=non_tech_questions,
        learning_resources=resources,
        preparation_plan=plan,
        preparation_gaps=preparation_gaps
    )
