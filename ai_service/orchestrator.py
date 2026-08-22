import asyncio
from schemas.evaluation import RequirementEvaluation
from schemas.report import JobDescription, MatchTier
from schemas.final_report import FinalReport
from services.parser import anonymize_text
from services.vector_store import create_vector_store
from services.scraper import get_job_description
from services.evaluator import evaluate_requirement
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
    Core end-to-end async DAG pipeline:
    1. Parallel Ingestion: Anonymize candidate text, build vector store, and scrape/extract JD.
    2. Parallel Evaluation: Evaluate all technical and non-technical requirements concurrently.
    3. Parallel Augmentation: Compute score, query Tavily, generate interview questions, and build study plan.
    4. Compile: Returns strongly-typed FinalReport.
    """
    clean_text = anonymize_text(candidate_text)

    # Stage 1: Parallel Ingestion (Vector store creation + Web scrape & JD extraction)
    vector_store, jd = await asyncio.gather(
        asyncio.to_thread(create_vector_store, clean_text),
        get_job_description(jd_url)
    )

    # Stage 2: Parallel Requirement Evaluation via FAISS + Gemini
    tech_tasks = [evaluate_requirement(req, vector_store) for req in jd.technical_requirements]
    non_tech_tasks = [evaluate_requirement(req, vector_store) for req in jd.non_technical_requirements]
    
    all_evaluations: list[RequirementEvaluation] = await asyncio.gather(*tech_tasks, *non_tech_tasks)

    num_tech = len(jd.technical_requirements)
    tech_evals = list(all_evaluations[:num_tech])
    non_tech_evals = list(all_evaluations[num_tech:])

    # Stage 3: Score & Identify Gaps
    score = calculate_final_score(tech_evals, non_tech_evals)

    critical_gaps = [
        e for e in all_evaluations
        if e.match_tier in (MatchTier.WEAK_MATCH, MatchTier.NO_MATCH)
    ]

    # Stage 4: Parallel Augmentation (Search, Questions, and Study Plan)
    # 4A. Run Tavily Search and Question Generations in parallel
    resources, tech_questions, non_tech_questions = await asyncio.gather(
        get_learning_resources(critical_gaps, jd.role),
        generate_tech_questions(tech_evals, jd.role),
        generate_non_tech_questions(non_tech_evals, clean_text, jd.role)
    )

    # 4B. Generate study plan integrating the retrieved search resources
    plan = await generate_study_plan(critical_gaps, resources, days_limit=days_limit)

    # Stage 5: Compile Final Report
    return FinalReport(
        company_name=jd.company_name,
        role=jd.role,
        match_score=score,
        technical_evaluations=tech_evals,
        non_technical_evaluations=non_tech_evals,
        technical_questions=tech_questions,
        non_technical_questions=non_tech_questions,
        learning_resources=resources,
        preparation_plan=plan
    )
