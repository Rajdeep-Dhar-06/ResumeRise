import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app
from schemas.final_report import FinalReport

client = TestClient(app)

# ==============================================================================
# TEST 1: FASTAPI HEALTH & ROOT ENDPOINTS
# ==============================================================================

def test_health_check_endpoint():
    """Verify GET /health returns 200 and healthy status."""
    response = client.get('/health')
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'


def test_root_endpoint():
    """Verify GET / returns service information and docs link."""
    response = client.get('/')
    assert response.status_code == 200
    data = response.json()
    assert 'ResumeRise' in data['message']


def test_analyze_validation_error():
    """Verify POST /api/analyze validates short or invalid input."""
    # Too short candidate profile
    response = client.post('/api/analyze', json={
        'candidateProfile': 'too short',
        'jdUrl': 'https://example.com/job',
        'daysLimit': 5
    })
    assert response.status_code == 422


# ==============================================================================
# TEST 2: FULL ORCHESTRATOR PIPELINE (UNIT/INTEGRATION)
# ==============================================================================

@pytest.mark.asyncio
async def test_analyze_candidate_pipeline():
    """
    Verify the complete orchestrator pipeline runs from end-to-end,
    generating a FinalReport with all required sections.
    """
    from orchestrator import analyze_candidate
    from unittest.mock import patch
    from schemas.report import JobDescription, JobRequirement, PriorityLevel

    candidate_profile = (
        'Senior Backend Software Engineer with 5 years of professional experience.\n'
        'Core Expertise: Production Python microservices, FastAPI, and PostgreSQL database optimization.\n'
        'Infrastructure: Docker containerization, AWS deployments, and Redis caching.\n'
        'Gaps: No production experience with Apache Kafka or Kubernetes cluster administration.'
    )

    # Mock get_job_description to make unit test fast and avoid external HTTP calls
    mock_jd = JobDescription(
        company_name='Stripe',
        role='Senior Infrastructure Engineer',
        technical_requirements=[
            JobRequirement(
                requirement_name='Python',
                canonical_name='Python',
                priority=PriorityLevel.REQUIRED,
                source_context='5+ years building backend systems with Python.'
            ),
            JobRequirement(
                requirement_name='PostgreSQL',
                canonical_name='PostgreSQL',
                priority=PriorityLevel.REQUIRED,
                source_context='Deep experience in relational database design and indexing.'
            ),
            JobRequirement(
                requirement_name='Kafka',
                canonical_name='Apache Kafka',
                priority=PriorityLevel.REQUIRED,
                source_context='Experience designing event streams with Kafka.'
            )
        ],
        non_technical_requirements=[
            JobRequirement(
                requirement_name='BS in CS',
                canonical_name='BS in Computer Science',
                priority=PriorityLevel.PREFERRED,
                source_context='Degree in Computer Science or equivalent practical experience.'
            )
        ]
    )

    with patch('orchestrator.get_job_description', return_value=mock_jd):
        report = await analyze_candidate(
            candidate_text=candidate_profile,
            jd_url='https://stripe.com/jobs/123',
            days_limit=3
        )

        assert isinstance(report, FinalReport)
        assert report.company_name == 'Stripe'
        assert report.role == 'Senior Infrastructure Engineer'
        assert 0 <= report.match_score <= 100
        
        # Verify technical and non-technical evaluations
        assert len(report.technical_evaluations) == 3
        assert len(report.non_technical_evaluations) == 1
        
        # Verify 5 technical and 5 non-technical questions
        assert len(report.technical_questions) == 5
        assert len(report.non_technical_questions) == 5
        
        # Verify preparation plan matches days_limit
        assert len(report.preparation_plan) == 3
        assert report.preparation_plan[0].day_number == 1
