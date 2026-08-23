import pytest
from schemas.evaluation import RequirementEvaluation
from schemas.report import MatchTier
from schemas.final_report import LearningResource, InterviewQuestion, DailyPlan
from services.scorer import calculate_final_score

# ==============================================================================
# TEST 1: SCORING ALGORITHM & 70/30 WEIGHTED MATH
# ==============================================================================

def test_scorer_all_expert():
    """Verify 100% expert score results in a final score of 100."""
    tech = [RequirementEvaluation(requirement_name='Python', match_tier=MatchTier.EXPERT_MATCH, reasoning='.', evidence='.')]
    non_tech = [RequirementEvaluation(requirement_name='Degree', match_tier=MatchTier.EXPERT_MATCH, reasoning='.', evidence='.')]
    assert calculate_final_score(tech, non_tech) == 100


def test_scorer_70_30_weighted_math():
    """Verify (tech_avg * 0.70) + (non_tech_avg * 0.30) rounding."""
    # Tech avg: (100 + 50) / 2 = 75
    tech = [
        RequirementEvaluation(requirement_name='Python', match_tier=MatchTier.EXPERT_MATCH, reasoning='.', evidence='.'),
        RequirementEvaluation(requirement_name='Docker', match_tier=MatchTier.BASIC_MATCH, reasoning='.', evidence='.'),
    ]
    # Non-tech avg: 0
    non_tech = [
        RequirementEvaluation(requirement_name='Years', match_tier=MatchTier.NO_MATCH, reasoning='.', evidence='.'),
    ]
    # (75 * 0.70) + (0 * 0.30) = 52.5 -> 53
    assert calculate_final_score(tech, non_tech) == 53


def test_scorer_edge_cases():
    """Verify empty lists and single-category scenarios."""
    assert calculate_final_score([], []) == 0

    # Only tech evaluations
    tech_only = [RequirementEvaluation(requirement_name='Go', match_tier=MatchTier.STRONG_MATCH, reasoning='.', evidence='.')]
    assert calculate_final_score(tech_only, []) == 80

    # Only non-tech evaluations
    non_tech_only = [RequirementEvaluation(requirement_name='Leadership', match_tier=MatchTier.BASIC_MATCH, reasoning='.', evidence='.')]
    assert calculate_final_score([], non_tech_only) == 50


# ==============================================================================
# TEST 2: TAVILY SEARCH WRAPPER
# ==============================================================================

@pytest.mark.asyncio
async def test_tavily_search_wrapper():
    """Verify Tavily search returns structured LearningResource objects."""
    from services.search import get_learning_resources

    gaps = [
        RequirementEvaluation(requirement_name='Apache Kafka', match_tier=MatchTier.NO_MATCH, reasoning='Missing', evidence='None')
    ]
    resources = await get_learning_resources(gaps, role_name='Backend Engineer')
    assert isinstance(resources, list)
    if resources:
        assert isinstance(resources[0], LearningResource)
        assert resources[0].requirement_name == 'Apache Kafka'
        assert len(resources[0].url) > 0


# ==============================================================================
# TEST 3: AUGMENTATION MICRO-CHAINS (LLM INTEGRATION)
# ==============================================================================

@pytest.mark.asyncio
async def test_tech_questions_generation():
    """Verify 5 technical questions are generated from evaluations."""
    from services.augmentation import generate_tech_questions

    evals = [
        RequirementEvaluation(requirement_name='Python', match_tier=MatchTier.EXPERT_MATCH, reasoning='4 yrs', evidence='FastAPI'),
        RequirementEvaluation(requirement_name='Kafka', match_tier=MatchTier.NO_MATCH, reasoning='No exp', evidence='None'),
    ]
    questions = await generate_tech_questions(evals, role='Senior Backend Engineer')
    assert len(questions) == 5
    assert isinstance(questions[0], InterviewQuestion)
    assert len(questions[0].question) > 10
    assert len(questions[0].ideal_answer) > 10


@pytest.mark.asyncio
async def test_study_plan_generation():
    """Verify N-day study plan generates exactly the requested number of days."""
    from services.augmentation import generate_study_plan

    gaps = [RequirementEvaluation(requirement_name='Kubernetes', match_tier=MatchTier.NO_MATCH, reasoning='None', evidence='None')]
    resources = [LearningResource(requirement_name='Kubernetes', title='K8s Docs', url='https://kubernetes.io', description='Official docs')]
    
    plan = await generate_study_plan(gaps, resources, days_limit=3)
    assert len(plan) == 3
    assert isinstance(plan[0], DailyPlan)
    assert plan[0].day_number == 1
    assert len(plan[0].daily_tasks) > 0
