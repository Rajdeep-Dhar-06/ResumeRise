from pydantic import Field
from schemas.base import BaseSchema
from schemas.report import MatchTier

class RequirementEvaluation(BaseSchema):
    requirement_name: str = Field(
        description="The exact name of the requirement being evaluated."
    )
    match_tier: MatchTier = Field(
        description="The strictly audited tier classification. Must strictly follow the system rules (e.g. no extrapolation, penalize trivial projects)."
    )
    reasoning: str = Field(
        description="A highly detailed, brutally honest 2-3 sentence technical justification. Explain exactly why this specific tier was chosen, pointing out any lacking scale, missing nuance, or strong architectural overlap."
    )
    evidence: str = Field(
        description="A robust extraction of direct quotes or bullet points from the candidate's profile that act as undeniable proof. If missing, explicitly state 'No evidence found in profile'."
    )
