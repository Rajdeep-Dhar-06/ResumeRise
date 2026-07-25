import { ChatGoogle } from '@langchain/google';

export const model = new ChatGoogle({
    model: "gemini-3.1-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.2
});

export const creativeModel = new ChatGoogle({
    model: "gemini-3.1-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.6
});

/**
 * Configures and returns a low-temperature Google Chat model with structured output
 * and automated fallbacks to alternate model versions.
 * Suitable for analytical, deterministic tasks like requirement auditing and scoring.
 * 
 * @function getStructuredModel
 */
export function getStructuredModel(schema) {
    return model.withStructuredOutput(schema).withFallbacks([
        new ChatGoogle({ model: "gemini-2.5-flash", apiKey: process.env.GEMINI_API_KEY, temperature: 0.2 }).withStructuredOutput(schema),
        new ChatGoogle({ model: "gemini-2.5-flash-lite", apiKey: process.env.GEMINI_API_KEY, temperature: 0.2 }).withStructuredOutput(schema),
    ]);
}

/**
 * Configures and returns a higher-temperature (more creative) Google Chat model
 * with structured output and automated fallbacks to alternate model versions.
 * Suitable for narrative/generative tasks like question generation and study planning.
 * 
 * @function getCreativeStructuredModel
 */
export function getCreativeStructuredModel(schema) {
    return creativeModel.withStructuredOutput(schema).withFallbacks([
        new ChatGoogle({ model: "gemini-2.5-flash", apiKey: process.env.GEMINI_API_KEY, temperature: 0.6 }).withStructuredOutput(schema),
        new ChatGoogle({ model: "gemini-2.5-flash-lite", apiKey: process.env.GEMINI_API_KEY, temperature: 0.6 }).withStructuredOutput(schema),
    ]);
}
