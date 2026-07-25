import crypto from 'crypto';
import { redisClient } from '../config/redis.js';
import logger from './logger.js';

/**
 * Generates a SHA-256 cache key for an input payload.
 */
export function generateCacheKey(toolName, inputPayload) {
  const payloadString = typeof inputPayload === 'string'
    ? inputPayload
    : JSON.stringify(inputPayload);
  const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
  return `cache:llm:${toolName}:${hash}`;
}

/**
 * Wraps an LLM invocation with deterministic input-hashed Redis caching.
 */
export async function withLlmCache(toolName, inputPayload, fetchLlmResponseFn, ttlSeconds = 86400) {
  const cacheKey = generateCacheKey(toolName, inputPayload);

  try {
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.debug({ toolName }, '[LLM Cache] Hit');
      return JSON.parse(cachedData);
    }
  } catch (err) {
    logger.warn({ toolName, err: err.message }, '[LLM Cache] Redis read error');
  }

  const result = await fetchLlmResponseFn();

  try {
    await redisClient.set(cacheKey, JSON.stringify(result), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn({ toolName, err: err.message }, '[LLM Cache] Redis write error');
  }

  return result;
}
