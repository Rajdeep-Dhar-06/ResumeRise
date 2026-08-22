from enum import Enum
from typing import List
from pydantic import Field
from schemas.base import BaseSchema

class PriorityLevel(str, Enum):
    REQUIRED = "REQUIRED"
    PREFERRED = "PREFERRED"
    NICE_TO_HAVE = "NICE_TO_HAVE"

class MatchTier(str, Enum):
    EXPERT_MATCH = "EXPERT_MATCH"  # 100 pts
    STRONG_MATCH = "STRONG_MATCH"  # 80 pts
    BASIC_MATCH = "BASIC_MATCH"  # 50 pts
    WEAK_MATCH = "WEAK_MATCH"  # 20 pts
    NO_MATCH = "NO_MATCH"  # 0 pts

class GapSeverity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class JobRequirement(BaseSchema):
    requirement_name: str = Field(
        default="",
        description="The name of the requirement/skill, exactly as it appears or is implied in the JD",
    )
    canonical_name: str = Field(
        default="",
        description="The standardized, clean technology or topic name used for vector embeddings and search (e.g. React for ReactJS)",
    )
    priority: PriorityLevel = Field(
        default=PriorityLevel.REQUIRED,
        description="REQUIRED = mandatory/must-have, PREFERRED = optional/nice-to-have",
    )
    source_context: str = Field(
        default="",
        description="A short sentence explaining how this requirement/skill is applied in the job description responsibilities or qualifications",
    )

class JobDescription(BaseSchema):
    company_name: str = Field(
        default="Target Company",
        description="The name of the hiring company or organization, exactly as it appears or is implied in the JD",
    )
    role: str = Field(
        default="Target Role",
        description="The official job title/role name, exactly as it appears or is implied in the JD",
    )
    technical_requirements: List[JobRequirement] = Field(
        default_factory=list, description="Required technical skills, languages, tools, frameworks"
    )
    non_technical_requirements: List[JobRequirement] = Field(
        default_factory=list,
        description="Explicit qualifications, years of experience, responsibilities",
    )
