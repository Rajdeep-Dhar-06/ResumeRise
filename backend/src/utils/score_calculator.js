const PRIORITY_WEIGHT = {
    REQUIRED: 1.00,  // Mandatory skills drive weight
    PREFERRED: 0.50, // Optional / nice-to-have skills
};

const COMPLEXITY_MULTIPLIER = {
    PRODUCTION: 1.00,   // Real work experience / scale
    INTERMEDIATE: 0.90, // Multi-feature deployed project
    BASIC: 0.70,        // Skills-list mention or tutorial clone
    'N/A': 1.00,        // Non-project requirements (e.g. degree)
};

/**
 * Computes a weighted overall match score (0-100) between candidate resume evidence and job requirements.
 * 
 * @param {Array<object>} evaluatedTechnicalRequirements - Evaluated tech requirements
 * @param {Array<object>} evaluatedNonTechnicalRequirements - Evaluated non-tech requirements
 * @returns {number} Integer score between 0 and 100
 */
export function computeMatchScore(evaluatedTechnicalRequirements = [], evaluatedNonTechnicalRequirements = []) {
    const allTerms = [...evaluatedTechnicalRequirements, ...evaluatedNonTechnicalRequirements];
    if (allTerms.length === 0) return 0;

    let weightedScoreSum = 0;
    let totalWeightSum = 0;

    for (const term of allTerms) {
        const weight = PRIORITY_WEIGHT[term.priority] ?? 1.0;
        let score = 0.0;

        if (term.matchStatus === 'MATCHED') {
            score = COMPLEXITY_MULTIPLIER[term.complexityLevel] ?? 1.0;
        } else if (term.matchStatus === 'WEAK_MATCH') {
            score = 0.40;
        }

        weightedScoreSum += score * weight;
        totalWeightSum += weight;
    }

    const finalScore = Math.round((weightedScoreSum / totalWeightSum) * 100);
    return Math.max(0, Math.min(100, finalScore));
}