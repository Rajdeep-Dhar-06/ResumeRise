import { ChatGoogle } from '@langchain/google';
import { RedisCache } from "@langchain/community/caches/ioredis";
import { redisClient } from "./redis.js";

const cache = new RedisCache(redisClient);

export const model = new ChatGoogle({
    model: "gemini-2.0-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.2,
    cache: cache,
    maxRetries: 3
});

export function getModel() {
    return model;
}

export const creativeModel = new ChatGoogle({
    model: "gemini-2.0-flash",
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.6,
    cache: cache,
    maxRetries: 3
});

/**
 * Configures and returns a low-temperature Google Chat model with structured output.
 * Suitable for analytical, deterministic tasks like requirement auditing and scoring.
 * 
 * @function getStructuredModel
 */
export function getStructuredModel(schema) {
    return model.withStructuredOutput(schema);
}

/**
 * Configures and returns a higher-temperature (more creative) Google Chat model
 * with structured output.
 * Suitable for narrative/generative tasks like question generation and study planning.
 * 
 * @function getCreativeStructuredModel
 */
export function getCreativeStructuredModel(schema) {
    return creativeModel.withStructuredOutput(schema);
}
