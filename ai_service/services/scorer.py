"""
Scoring logic for candidate evaluations.

This module determines the final 0-100 match score by weighing technical and non-technical skills.
"""
import math
from schemas.evaluation import RequirementEvaluation
from schemas.report import MatchTier

TIER_POINTS: dict[MatchTier, int] = {
    MatchTier.EXPERT_MATCH: 100,
    MatchTier.STRONG_MATCH: 80,
    MatchTier.BASIC_MATCH: 50,
    MatchTier.WEAK_MATCH: 20,
    MatchTier.NO_MATCH: 0,
}

def _round_half_up(value: float) -> int:
    """Standard arithmetic rounding where .5 always rounds up to the nearest integer."""
    return math.floor(value + 0.5)

def calculate_final_score(
    technical_evaluations: list[RequirementEvaluation],
    non_technical_evaluations: list[RequirementEvaluation]
) -> int:
    """
    Calculates a weighted average score from the candidate's evaluations.
    
    The algorithm applies a 70/30 split because technical skills are typically 
    the primary hiring signal for software roles, while non-technical skills act as multipliers.

    Args:
        technical_evaluations (list[RequirementEvaluation]): Technical results.
        non_technical_evaluations (list[RequirementEvaluation]): Non-technical results.

    Returns:
        int: The final calculated score (0-100).
    """
    has_tech = len(technical_evaluations) > 0
    has_non_tech = len(non_technical_evaluations) > 0

    if not has_tech and not has_non_tech:
        return 0

    tech_avg = (
        sum(TIER_POINTS.get(e.match_tier, 0) for e in technical_evaluations) / len(technical_evaluations)
        if has_tech else 0.0
    )

    non_tech_avg = (
        sum(TIER_POINTS.get(e.match_tier, 0) for e in non_technical_evaluations) / len(non_technical_evaluations)
        if has_non_tech else 0.0
    )

    if has_tech and has_non_tech:
        return _round_half_up((tech_avg * 0.70) + (non_tech_avg * 0.30))
    elif has_tech:
        return _round_half_up(tech_avg)
    else:
        return _round_half_up(non_tech_avg)
