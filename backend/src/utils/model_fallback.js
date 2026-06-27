const MODEL_CHAIN = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
];

const RETRYABLE_STATUS_CODES = new Set([429, 500, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set(['UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'DEADLINE_EXCEEDED', 'INTERNAL']);

function isRetryable(error) {
    if (!error || typeof error !== 'object') return false;
    if (typeof error.status === 'number' && RETRYABLE_STATUS_CODES.has(error.status)) return true;
    if (typeof error.code === 'string' && RETRYABLE_ERROR_CODES.has(error.code)) return true;
    const msg = (error.message || '').toLowerCase();
    return ['503', 'overloaded', 'unavailable', 'rate limit', 'quota'].some(s => msg.includes(s));
}

export async function generateResponse(ai, { contents, generationConfig, preferredModel }) {
    const chain = preferredModel
        ? [preferredModel, ...MODEL_CHAIN.filter(m => m !== preferredModel)]
        : MODEL_CHAIN;

    const errors = [];
    for (const model of chain) {
        try {
            const response = await ai.models.generateContent({ model, contents, config: generationConfig });
            return response;
        } catch (error) {
            if (!isRetryable(error)) throw error;
            errors.push({ model, error: error.message || String(error) });
        }
    }
    throw new Error(`All models failed:\n${errors.map(e => `  ${e.model}: ${e.error}`).join('\n')}`);
}