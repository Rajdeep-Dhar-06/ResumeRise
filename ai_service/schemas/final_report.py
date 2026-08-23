from typing import List, Optional
from pydantic import Field
from schemas.base import BaseSchema
from schemas.evaluation import RequirementEvaluation

class InterviewQuestion(BaseSchema):
    question: str = Field(description="The technical or behavioral interview question.")
    interviewer_intent: str = Field(description="A detailed 2-3 sentence explanation of why this question is being asked, what technical depth or behavioral trait is being evaluated, and what red flags to watch out for.")
    ideal_answer: str = Field(description="A comprehensive, multi-paragraph model answer. It should provide a deep, highly technical explanation (if technical), mention specific engineering patterns (like 'expand and contract', 'circuit breaker'), tradeoffs, and concrete examples. For behavioral, it should outline a detailed STAR response structure.")

class TechQuestionsResult(BaseSchema):
    questions: List[InterviewQuestion] = Field(description="List of exactly 5 technical engineering interview questions.")

class NonTechQuestionsResult(BaseSchema):
    questions: List[InterviewQuestion] = Field(description="List of exactly 5 non-technical / behavioral interview questions.")

class LearningResource(BaseSchema):
    requirement_name: str = Field(description="The exact name of the missing/weak requirement this resource addresses.")
    title: str = Field(description="The full, descriptive title of the tutorial, official documentation, or video course.")
    url: str = Field(description="Direct, verified URL to the learning resource.")
    description: str = Field(description="A highly detailed 2-3 sentence summary explaining exactly what the candidate will learn from this resource and how it bridges their specific technical gap.")

class DailyPlan(BaseSchema):
    day_number: int = Field(description="The sequential day number in the preparation calendar (e.g. 1 to N).")
    daily_focus: str = Field(description="A very specific, focused architectural or technical topic for the day (e.g., 'Mastering Distributed Caching with Redis').")
    daily_tasks: List[str] = Field(description="List of highly detailed, actionable, and verifiable engineering tasks (e.g., 'Build a Go microservice that implements a circuit breaker pattern using Redis'). Do not just say 'Learn Redis'.")

class StudyPlanResult(BaseSchema):
    daily_prep_plan: List[DailyPlan] = Field(description="Daily preparation plan objects distributed over the requested days.")

class PreparationGap(BaseSchema):
    requirement_name: str = Field(description="The name of the missing/weak requirement.")
    gap_severity: str = Field(description="Severity of the gap: HIGH for NO_MATCH, MEDIUM for WEAK_MATCH.")

class FinalReport(BaseSchema):
    company_name: str = Field(default="Target Company", description="Hiring company name.")
    role: str = Field(default="Target Role", description="Job title / role name.")
    match_score: int = Field(description="Overall weighted match score from 0 to 100.")
    technical_evaluations: List[RequirementEvaluation] = Field(default_factory=list, description="Evaluations of all technical requirements.")
    non_technical_evaluations: List[RequirementEvaluation] = Field(default_factory=list, description="Evaluations of all non-technical requirements.")
    technical_questions: List[InterviewQuestion] = Field(default_factory=list, description="5 technical interview questions.")
    non_technical_questions: List[InterviewQuestion] = Field(default_factory=list, description="5 non-technical interview questions.")
    learning_resources: List[LearningResource] = Field(default_factory=list, description="Learning resources for critical required gaps.")
    preparation_plan: List[DailyPlan] = Field(default_factory=list, description="Day-by-day study roadmap.")
    preparation_gaps: List[PreparationGap] = Field(default_factory=list, description="List of identified skill gaps.")
