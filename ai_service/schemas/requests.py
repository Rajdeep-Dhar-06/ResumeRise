from pydantic import Field
from schemas.base import BaseSchema

class AnalyzeRequest(BaseSchema):
    candidate_profile: str = Field(
        ...,
        min_length=20,
        description="The candidate's raw career transcript, resume text, or portfolio summary."
    )
    jd_url: str = Field(
        ...,
        description="The URL of the target job posting to scrape and analyze."
    )
    days_limit: int = Field(
        default=7,
        ge=1,
        le=30,
        description="The number of days for the generated study roadmap (between 1 and 30)."
    )
