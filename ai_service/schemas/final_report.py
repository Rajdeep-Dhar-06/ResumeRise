from typing import List, Optional
from pydantic import Field
from schemas.base import BaseSchema
from schemas.evaluation import RequirementEvaluation

class InterviewQuestion(BaseSchema):
    question: str = Field(description="The technical or behavioral interview question.")
    interviewer_intent: str = Field(description="One sentence explaining what specific skill, gap, or situation this question probes.")
    ideal_answer: str = Field(description="A concise model answer covering key engineering principles and best practices.")

class TechQuestionsResult(BaseSchema):
    questions: List[InterviewQuestion] = Field(description="List of exactly 5 technical engineering interview questions.")

class NonTechQuestionsResult(BaseSchema):
    questions: List[InterviewQuestion] = Field(description="List of exactly 5 non-technical / behavioral interview questions.")

class LearningResource(BaseSchema):
    requirement_name: str = Field(description="The name of the missing/weak requirement this resource addresses.")
    title: str = Field(description="The title of the tutorial, course, or documentation.")
    url: str = Field(description="Direct URL to the learning resource.")
    description: str = Field(description="Brief summary of what the resource teaches.")

class DailyPlan(BaseSchema):
    day_number: int = Field(description="The sequential day number in the preparation calendar (e.g. 1 to N).")
    daily_focus: str = Field(description="The core topic or skill focus for this day.")
    daily_tasks: List[str] = Field(description="List of actionable, verifiable study/practice tasks.")

class StudyPlanResult(BaseSchema):
    daily_prep_plan: List[DailyPlan] = Field(description="Daily preparation plan objects distributed over the requested days.")

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
