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
        description="The atomic, precise name of the requirement/skill (e.g. 'React', 'Kubernetes', 'B2B Sales'). Do not group them.",
    )
    canonical_name: str = Field(
        default="",
        description="The standardized, universally recognized technology or topic name used for high-accuracy vector embeddings and semantic search (e.g. 'React' for ReactJS).",
    )
    priority: PriorityLevel = Field(
        default=PriorityLevel.REQUIRED,
        description="Categorize strictness based on phrasing: REQUIRED ('Must have', 'Required', 'At least'), PREFERRED ('Preferred', 'Bonus points'), NICE_TO_HAVE ('Familiarity with').",
    )
    source_context: str = Field(
        default="",
        description="A detailed, robust sentence extracting exactly how the JD expects this skill to be applied. e.g., 'Architect and maintain high-throughput microservices using Go.'",
    )

class JobDescription(BaseSchema):
    company_name: str = Field(
        default="Target Company",
        description="The full, official name of the hiring organization.",
    )
    role: str = Field(
        default="Target Role",
        description="The exact Job Title or Role from the posting header.",
    )
    technical_requirements: List[JobRequirement] = Field(
        default_factory=list, description="A comprehensive, atomic list of hard technical requirements (languages, frameworks, cloud providers, CI/CD tools, databases)."
    )
    non_technical_requirements: List[JobRequirement] = Field(
        default_factory=list,
        description="A comprehensive list of measurable non-technical criteria: degrees (BS/MS in CS), precise years of experience, domain expertise, leadership scope, etc.",
    )
