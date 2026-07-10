const PRIORITY_WEIGHT = {
    REQUIRED: 1.0,
    PREFERRED: 0.65,
    NICE_TO_HAVE: 0.35,
};

const COMPLEXITY_MULTIPLIER = {
    PRODUCTION: 1.0,
    ADVANCED: 0.98,
    INTERMEDIATE: 0.90,
    BASIC: 0.80,
    TRIVIAL: 0.65,
    'N/A': 1.0,
};

const MIN_JD_WEIGHT = 8.0; 

export function computeMatchScore(matchedSkills, matchedRequirements) {
    const allTerms = [...matchedSkills, ...matchedRequirements];

    if (allTerms.length === 0) return 0;

    let weightedScore = 0;
    let totalWeight = 0;

    for (const term of allTerms) {
        const priorityWeight = PRIORITY_WEIGHT[term.priority] ?? 1.0;

        let termScore = 0.0;
        if (term.matchStatus === 'MATCHED') {
            const complexityMult = COMPLEXITY_MULTIPLIER[term.complexityLevel] ?? 1.0;
            termScore = 1.0 * complexityMult;
        } else if (term.matchStatus === 'WEAK_MATCH') {
            termScore = term.matchStrength ?? 0.50;
        }

        weightedScore += termScore * priorityWeight;
        totalWeight += priorityWeight;
    }

    if (totalWeight < MIN_JD_WEIGHT) {
        const padding = MIN_JD_WEIGHT - totalWeight;
        weightedScore += padding; 
        totalWeight += padding;
    }

    let score = Math.round((weightedScore / totalWeight) * 100);

    const missingRequiredCount = allTerms.filter(
        t => t.matchStatus === 'MISSING' && t.priority === 'REQUIRED'
    ).length;

    if (missingRequiredCount >= 3) score = Math.min(score, 70);
    else if (missingRequiredCount >= 1) score = Math.min(score, 80);

    return Math.max(0, Math.min(100, score));
}