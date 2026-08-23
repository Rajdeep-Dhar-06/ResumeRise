import pytest
from langchain_community.vectorstores import FAISS

# ==============================================================================
# TEST 1: VECTOR STORE CREATION
# ==============================================================================

def test_create_vector_store():
    """Verify that a resume string is properly chunked and embedded into FAISS."""
    from services.vector_store import create_vector_store
    
    sample_resume = (
        "Experienced Backend Developer. " * 20 + 
        "Proficient in Python, Django, and PostgreSQL. " * 20 +
        "Deployed applications using Docker and Kubernetes on AWS." * 20
    )
    
    vector_store = create_vector_store(sample_resume)
    
    # Verify it returns a FAISS instance
    assert isinstance(vector_store, FAISS)
    
    # Verify we can perform a similarity search
    results = vector_store.similarity_search("Python and Django", k=2)
    assert len(results) > 0
    assert "Python" in results[0].page_content


# ==============================================================================
# TEST 2: REQUIREMENT EVALUATION
# ==============================================================================

@pytest.mark.asyncio
async def test_evaluate_single_requirement():
    """Verify the LLM can evaluate a resume against a single job requirement."""
    from services.vector_store import create_vector_store
    from services.evaluator import evaluate_requirement
    from schemas.report import JobRequirement, PriorityLevel, MatchTier
    from schemas.evaluation import RequirementEvaluation

    # 1. Setup mock resume vector store
    sample_resume = (
        "Backend Software Engineer.\n"
        "Experience: 4 years building APIs in Python and FastAPI.\n"
        "Databases: Expert in PostgreSQL and Redis.\n"
        "DevOps: Basic knowledge of Docker, never used Kubernetes in production."
    )
    vstore = create_vector_store(sample_resume)

    # 2. Setup a clear, matching requirement
    req_match = JobRequirement(
        requirement_name="Python Frameworks",
        canonical_name="Python / FastAPI",
        priority=PriorityLevel.REQUIRED,
        source_context="Must have strong experience building backend APIs using Python frameworks."
    )
    
    eval_match = await evaluate_requirement(req_match, vstore)
    
    assert isinstance(eval_match, RequirementEvaluation)
    assert eval_match.requirement_name == req_match.requirement_name
    assert eval_match.match_tier in [MatchTier.EXPERT_MATCH, MatchTier.STRONG_MATCH]
    assert len(eval_match.reasoning) > 10
    assert "FastAPI" in eval_match.evidence or "Python" in eval_match.evidence

    # 3. Setup a clear, missing requirement
    req_miss = JobRequirement(
        requirement_name="Kubernetes",
        canonical_name="Kubernetes",
        priority=PriorityLevel.PREFERRED,
        source_context="Looking for candidates with production Kubernetes administration experience."
    )
    
    eval_miss = await evaluate_requirement(req_miss, vstore)
    assert eval_miss.match_tier in [MatchTier.WEAK_MATCH, MatchTier.NO_MATCH]
    assert "never used" in eval_miss.evidence.lower() or "production" in eval_miss.reasoning.lower()
