import pytest

# ==============================================================================
# TEST 1: CAMELCASE BASE MODEL & SCHEMAS
# ==============================================================================

def test_camel_case_base_model():
    """Verify that models inheriting from BaseSchema serialize snake_case to camelCase."""
    from schemas.base import BaseSchema
    from pydantic import Field

    class SampleModel(BaseSchema):
        user_id: str
        job_description_url: str
        match_score: int = Field(default=85)

    instance = SampleModel(
        user_id='usr_123',
        job_description_url='https://example.com/job'
    )
    
    # Internal Python access in snake_case
    assert instance.user_id == 'usr_123'
    assert instance.job_description_url == 'https://example.com/job'
    
    # Serialization output in camelCase for JavaScript / React
    dumped = instance.model_dump(by_alias=True)
    assert 'userId' in dumped
    assert 'jobDescriptionUrl' in dumped
    assert 'matchScore' in dumped
    assert dumped['userId'] == 'usr_123'
    assert dumped['matchScore'] == 85


def test_job_description_schemas():
    """Verify JobRequirement and JobDescription models with 1:1 field parity."""
    from schemas.report import JobDescription, JobRequirement, PriorityLevel

    req = JobRequirement(
        requirement_name='React.js',
        canonical_name='React',
        priority=PriorityLevel.REQUIRED,
        source_context='Building frontend user interfaces with modern React'
    )
    assert req.requirement_name == 'React.js'
    assert req.canonical_name == 'React'
    assert req.priority == PriorityLevel.REQUIRED

    jd = JobDescription(
        company_name='Netflix',
        role='Senior Backend Engineer',
        technical_requirements=[req],
        non_technical_requirements=[]
    )
    assert jd.company_name == 'Netflix'
    assert jd.role == 'Senior Backend Engineer'
    assert len(jd.technical_requirements) == 1

    # Verify camelCase serialization for Node.js / React
    serialized = jd.model_dump(by_alias=True)
    assert 'companyName' in serialized
    assert 'technicalRequirements' in serialized
    assert serialized['technicalRequirements'][0]['canonicalName'] == 'React'
    assert serialized['technicalRequirements'][0]['requirementName'] == 'React.js'


# ==============================================================================
# TEST 2: TEXT ANONYMIZATION & VECTOR STORE INGESTION
# ==============================================================================

def test_text_anonymization():
    """Verify PII email masking using scrubadub."""
    from services.parser import anonymize_text

    sample_text = 'Contact John Doe at candidate.dev@google.com for more info about Python backend engineering.'
    anonymized = anonymize_text(sample_text)
    assert 'candidate.dev@google.com' not in anonymized
    assert any(tag in anonymized for tag in ['[REDACTED_EMAIL]', '[EMAIL_REDACTED]', '[EMAIL]', '{{EMAIL}}', 'EMAIL'])
    assert 'Python backend engineering' in anonymized


def test_empty_text_raises_error():
    """Verify parser raises ValueError when text is too short or empty."""
    from services.parser import anonymize_text

    with pytest.raises(ValueError):
        anonymize_text('   ')

    with pytest.raises(ValueError):
        anonymize_text('too short')


def test_vector_store_creation():
    """Verify create_vector_store creates an in-memory FAISS store from plain text."""
    from services.vector_store import create_vector_store

    profile = (
        'Backend Software Engineer with 4 years of experience. '
        'Built microservices with Python, FastAPI, and PostgreSQL. '
        'Managed Kubernetes clusters and Kafka event streaming in production.'
    )
    vector_store = create_vector_store(profile)
    assert vector_store is not None
    
    # Run similarity search
    results = vector_store.similarity_search('PostgreSQL database', k=1)
    assert len(results) > 0
    assert 'PostgreSQL' in results[0].page_content


# ==============================================================================
# TEST 3: PROMPT GENERATION & STRUCTURED GEMINI EXTRACTION
# ==============================================================================

def test_scrape_prompt_generation():
    """Verify the job description prompt generates the required system instructions."""
    from prompts.prompts import get_scrape_job_description_prompt

    raw_sample = (
        'Stripe is looking for a Backend Engineer. Required: Go, Docker. Nice to have: Kubernetes.'
    )
    prompt = get_scrape_job_description_prompt(raw_sample)

    assert 'companyName' in prompt or 'company_name' in prompt
    assert 'technicalRequirements' in prompt or 'technical_requirements' in prompt
    assert raw_sample in prompt


@pytest.mark.asyncio
async def test_job_description_llm_extraction():
    """Verify Gemini extracts structured requirements with canonical names and priorities."""
    from services.scraper import extract_job_description

    sample_jd_text = (
        'LinkedIn > Jobs > Search Results ... Apply Now ...\n'
        'Acme Robotics is hiring a Senior Backend Engineer in San Francisco, CA.\n\n'
        'About the Role:\n'
        'You will build real-time distributed telemetry systems for autonomous robots.\n\n'
        'Minimum Qualifications:\n'
        '- Proficiency in Java or Go for high-throughput microservices.\n'
        '- Strong experience with PostgreSQL database design and indexing.\n'
        '- Bachelor degree in Computer Science or related engineering field.\n\n'
        'Nice to Have:\n'
        '- Exposure to Docker and Kubernetes container orchestration.\n'
        '- Experience with Apache Kafka for event streaming.\n\n'
        'Benefits: Unlimited PTO, 401k match, health insurance. EEO Employer.'
    )

    extraction = await extract_job_description(sample_jd_text)

    # 1. Verify Company & Role Disambiguation (not "LinkedIn")
    assert extraction.company_name.lower() == 'acme robotics'
    assert 'backend' in extraction.role.lower()

    # 2. Verify Technical Requirements & Canonical Names
    assert len(extraction.technical_requirements) >= 3
    tech_canonical = [
        r.canonical_name.lower() or r.requirement_name.lower()
        for r in extraction.technical_requirements
    ]

    assert any('java' in name or 'go' in name for name in tech_canonical)
    assert any('postgresql' in name or 'postgres' in name for name in tech_canonical)
    assert any(
        'docker' in name or 'kubernetes' in name or 'kafka' in name for name in tech_canonical
    )

    # 3. Verify Priorities
    for req in extraction.technical_requirements:
        assert req.priority in ['REQUIRED', 'PREFERRED', 'NICE_TO_HAVE']
        assert len(req.source_context) > 0

    # 4. Verify Non-Technical Requirements
    non_tech_names = [r.requirement_name.lower() for r in extraction.non_technical_requirements]
    assert any(
        'degree' in name or 'bachelor' in name or 'computer science' in name
        for name in non_tech_names
    )
