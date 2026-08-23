"""
Augmentation Module

This module is responsible for generating personalized interview questions and a structured study plan.
It uses Langchain's Expression Language (LCEL) and Pydantic structured outputs to ensure the LLM 
generates precisely formatted questions and daily study tasks without hallucinating schemas.
"""
from config import llm, creative_llm
from schemas.evaluation import RequirementEvaluation
from schemas.report import MatchTier
from schemas.final_report import (
    InterviewQuestion,
    TechQuestionsResult,
    NonTechQuestionsResult,
    LearningResource,
    DailyPlan,
    StudyPlanResult,
)
from prompts.prompts import (
    TECH_QUESTIONS_PROMPT,
    NON_TECH_QUESTIONS_PROMPT,
    STUDY_PLAN_PROMPT,
)

async def generate_tech_questions(
    evaluations: list[RequirementEvaluation],
    role: str = "Software Engineer"
) -> list[InterviewQuestion]:
    """
    Generates exactly 5 scenario-based technical engineering interview questions.
    
    This function filters the candidate's evaluations to explicitly feed their missing, weak, 
    and matched skills into the prompt. The LLM then generates targeted technical questions.

    Args:
        evaluations (list[RequirementEvaluation]): The candidate's technical skill evaluations.
        role (str): The target job role.

    Returns:
        list[InterviewQuestion]: A list of exactly 5 generated technical questions.
    """
    missing = [e.requirement_name for e in evaluations if e.match_tier == MatchTier.NO_MATCH]
    weak = [e.requirement_name for e in evaluations if e.match_tier == MatchTier.WEAK_MATCH]
    matched = [
        e.requirement_name for e in evaluations 
        if e.match_tier in (MatchTier.EXPERT_MATCH, MatchTier.STRONG_MATCH, MatchTier.BASIC_MATCH)
    ]

    chain = TECH_QUESTIONS_PROMPT | creative_llm.with_structured_output(TechQuestionsResult)
    result: TechQuestionsResult = await chain.ainvoke({  # type: ignore
        "role": role,
        "missing_skills": ", ".join(missing) if missing else "None",
        "weak_skills": ", ".join(weak) if weak else "None",
        "matched_skills": ", ".join(matched) if matched else "General Engineering Fundamentals",
    })

    return result.questions if result and result.questions else []


async def generate_non_tech_questions(
    evaluations: list[RequirementEvaluation],
    candidate_text: str,
    role: str = "Software Engineer"
) -> list[InterviewQuestion]:
    """
    Generates exactly 5 non-technical / behavioral interview questions grounded in candidate experience.
    """
    missing = [e.requirement_name for e in evaluations if e.match_tier == MatchTier.NO_MATCH]
    weak = [e.requirement_name for e in evaluations if e.match_tier == MatchTier.WEAK_MATCH]
    matched = [
        e.requirement_name for e in evaluations 
        if e.match_tier in (MatchTier.EXPERT_MATCH, MatchTier.STRONG_MATCH, MatchTier.BASIC_MATCH)
    ]

    chain = NON_TECH_QUESTIONS_PROMPT | creative_llm.with_structured_output(NonTechQuestionsResult)
    result: NonTechQuestionsResult = await chain.ainvoke({  # type: ignore
        "role": role,
        "missing_quals": ", ".join(missing) if missing else "None",
        "weak_quals": ", ".join(weak) if weak else "None",
        "matched_quals": ", ".join(matched) if matched else "Standard Qualifications",
        "candidate_text": candidate_text[:2000] if candidate_text else "No profile provided.",
    })

    return result.questions if result and result.questions else []


async def generate_study_plan(
    critical_gaps: list[RequirementEvaluation],
    learning_resources: list[LearningResource],
    days_limit: int = 7
) -> list[DailyPlan]:
    """
    Generates a dynamic N-day study preparation roadmap.
    """
    gaps_text = "\n".join([f"- {g.requirement_name}: {g.reasoning}" for g in critical_gaps])
    refs_text = "\n".join([f"- {r.title}: {r.url}" for r in learning_resources])

    chain = STUDY_PLAN_PROMPT | llm.with_structured_output(StudyPlanResult)
    result: StudyPlanResult = await chain.ainvoke({  # type: ignore
        "days_limit": days_limit,
        "critical_gaps": gaps_text if gaps_text else "No critical gaps identified. Focus on advanced mastery.",
        "search_results": refs_text if refs_text else "No search references provided.",
    })

    return result.daily_prep_plan if result and result.daily_prep_plan else []
