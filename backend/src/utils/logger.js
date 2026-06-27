import { performance } from 'perf_hooks';

/**
 * Utility to time asynchronous execution calls (AI/Puppeteer requests).
 * Outputs formatted, colorful metrics when DEBUG_AI_TIMER is true.
 * 
 * @param {string} label - Identifier for the call
 * @param {Function} fn - Async operation to execute
 * @returns {Promise<any>} Response from the execution
 */
export async function timeAsyncCall(label, fn) {
  if (process.env.DEBUG_AI_TIMER !== 'true') {
    return fn();
  }

  const start = performance.now();
  try {
    const result = await fn();
    const duration = ((performance.now() - start) / 1000).toFixed(2);
    // Cyan [AI TIMER] | Green SUCCESS | Magenta label | Yellow duration
    console.log(`\x1b[36m[AI TIMER]\x1b[0m \x1b[32mSUCCESS\x1b[0m | \x1b[35m${label}\x1b[0m completed in \x1b[33m${duration}s\x1b[0m`);
    return result;
  } catch (error) {
    const duration = ((performance.now() - start) / 1000).toFixed(2);
    // Cyan [AI TIMER] | Red FAILED | Magenta label | Yellow duration
    console.log(`\x1b[36m[AI TIMER]\x1b[0m \x1b[31mFAILED\x1b[0m  | \x1b[35m${label}\x1b[0m after \x1b[33m${duration}s\x1b[0m | Error: ${error.message}`);
    throw error;
  }
}
