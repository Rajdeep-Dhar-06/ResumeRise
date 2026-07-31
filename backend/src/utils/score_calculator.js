const PRIORITY_WEIGHT = {
    REQUIRED: 1.0,
    PREFERRED: 0.60,
    NICE_TO_HAVE: 0.30,
};

const COMPLEXITY_MULTIPLIER = {
    PRODUCTION: 1.0,
    ADVANCED: 0.95,
    INTERMEDIATE: 0.90,
    BASIC: 0.80,
    TRIVIAL: 0.65,
    'N/A': 1.0,
};


/**
 * Computes a weighted overall match score (0-100) between a candidate's resume and job description requirements.
 * Applies priority weights, complexity multipliers, and critical required requirement match caps.
 * 
 * @function computeMatchScore
 * @param {Array<object>} evaluatedTechnicalRequirements - Array of evaluated tech terms with status, strength, complexity and priority.
 * @param {Array<object>} evaluatedNonTechnicalRequirements - Array of evaluated non-tech terms with status, strength, complexity and priority.
 * @returns {number} An integer percentage match score bounded between 0 and 100.
 */
export function computeMatchScore(evaluatedTechnicalRequirements, evaluatedNonTechnicalRequirements) {
    const allTerms = [...evaluatedTechnicalRequirements, ...evaluatedNonTechnicalRequirements];

    if (allTerms.length === 0) return 0;

    let weightedScore = 0;
    let totalWeight = 0;

    // 1. Calculate Priority Weight and Match Score for each term
    for (const term of allTerms) {
        const priorityWeight = PRIORITY_WEIGHT[term.priority] ?? 1.0;

        let termScore = 0.0;
        if (term.matchStatus === 'MATCHED') {
            const complexityMult = COMPLEXITY_MULTIPLIER[term.complexityLevel] ?? 1.0;
            termScore = 1.0 * complexityMult;
        } else if (term.matchStatus === 'WEAK_MATCH') {
            termScore = Math.min(50, term.matchStrength ?? 50) / 100.0;
        }

        weightedScore += termScore * priorityWeight;
        totalWeight += priorityWeight;
    }

    let score = Math.round((weightedScore / totalWeight) * 100);

    // 3. Impose critical match caps for missing REQUIRED terms
    const missingRequiredCount = allTerms.filter(
        t => t.matchStatus === 'MISSING' && t.priority === 'REQUIRED'
    ).length;

    if (missingRequiredCount >= 3) score = Math.min(score, 70);
    else if (missingRequiredCount >= 1) score = Math.min(score, 80);

    return Math.max(0, Math.min(100, score));
}