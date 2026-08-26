import pytest

# ==============================================================================
# TEST: REQUIREMENT EVALUATION BATCH
# ==============================================================================

@pytest.mark.asyncio
async def test_evaluate_requirements_batch():
    """Verify the LLM can evaluate a resume against a batch of job requirements."""
    from services.evaluator import evaluate_requirements_batch
    from schemas.report import JobRequirement, PriorityLevel, MatchTier
    from schemas.evaluation import RequirementEvaluation

    # 1. Setup candidate transcript
    sample_resume = (
        "Backend Software Engineer.\n"
        "Experience: 4 years building APIs in Python and FastAPI.\n"
        "Databases: Expert in PostgreSQL and Redis.\n"
        "DevOps: Basic knowledge of Docker, never used Kubernetes in production."
    )

    # 2. Setup batch of requirements
    req_match = JobRequirement(
        requirement_name="Python Frameworks",
        canonical_name="Python / FastAPI",
        priority=PriorityLevel.REQUIRED,
        source_context="Must have strong experience building backend APIs using Python frameworks."
    )
    
    req_miss = JobRequirement(
        requirement_name="Kubernetes",
        canonical_name="Kubernetes",
        priority=PriorityLevel.PREFERRED,
        source_context="Looking for candidates with production Kubernetes administration experience."
    )
    
    # 3. Evaluate batch
    eval_results = await evaluate_requirements_batch([req_match, req_miss], sample_resume, "Technical")
    
    assert isinstance(eval_results, list)
    assert len(eval_results) == 2
    
    eval_match = eval_results[0]
    eval_miss = eval_results[1]
    
    assert isinstance(eval_match, RequirementEvaluation)
    assert eval_match.requirement_name == req_match.requirement_name
    assert eval_match.match_tier in [MatchTier.EXPERT_MATCH, MatchTier.STRONG_MATCH]
    assert len(eval_match.reasoning) > 10
    
    assert isinstance(eval_miss, RequirementEvaluation)
    assert eval_miss.match_tier in [MatchTier.WEAK_MATCH, MatchTier.NO_MATCH]
