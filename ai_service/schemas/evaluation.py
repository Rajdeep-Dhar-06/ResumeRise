from pydantic import Field
from schemas.base import BaseSchema
from schemas.report import MatchTier

class RequirementEvaluation(BaseSchema):
    requirement_name: str = Field(
        description="The exact name of the requirement being evaluated."
    )
    match_tier: MatchTier = Field(
        description="The classification of how well the candidate meets this requirement based on the provided text."
    )
    reasoning: str = Field(
        description="A concise explanation of why this match tier was selected based ONLY on the candidate's resume excerpts."
    )
    evidence: str = Field(
        description="Direct quotes or specific summaries from the resume chunks that prove the candidate's experience (or lack thereof). If none, state 'No evidence found'."
    )
