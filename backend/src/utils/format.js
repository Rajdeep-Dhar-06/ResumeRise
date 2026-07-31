/**
 * Format evaluation terms for LLM prompt embedding.
 * @param {Array} terms - List of evaluated terms
 * @param {string} [defaultFallback=' None'] - Value to return when empty/null
 * @returns {string} - Formatted multiline string
 */
export function formatTerms(terms, defaultFallback = ' None') {
  if (!terms || terms.length === 0) return defaultFallback;
  return terms.map(t =>
    `• "${t.requirementName}", Priority: ${t.priority}, Complexity: ${t.complexityLevel}, Evidence: "${t.resumeEvidence}", Verdict: "${t.depthAssessment}"`
  ).join('\n');
}
