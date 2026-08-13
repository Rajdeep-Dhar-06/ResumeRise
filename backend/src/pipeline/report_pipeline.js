import { ingestDocuments } from '../services/step1_ingest.js';
import { auditRequirements } from '../services/step2_audit.js';
import { assembleReport } from '../services/step3_assemble.js';
import { saveReport } from '../services/step4_persist.js';
import { acquireLock, releaseLock } from '../utils/lock.js';
import crypto from 'crypto';
import { ConflictError } from '../utils/error_handler.js';

/**
 * Executes the end-to-end interview report generation pipeline using modular step functions.
 * 
 * @param {Object} inputContext - Initial payload containing userId, resumeBuffer, jobDescriptionUrl, etc.
 * @returns {Promise<Object>} - Resolved object containing `{ savedReport }`
 */
export async function runInterviewReportPipeline(initialState) {
  const lockKey = `lock:pipeline:${initialState.userId}`;
  const lockValue = crypto.randomUUID();

  const acquired = await acquireLock(lockKey, lockValue, 60);
  if (!acquired) {
    throw new ConflictError('Report generation is already in progress.');
  }

  try {
    let pipelineState = initialState;
    pipelineState = await ingestDocuments(pipelineState);
    pipelineState = await auditRequirements(pipelineState);
    pipelineState = await assembleReport(pipelineState);
    pipelineState = await saveReport(pipelineState);

    return pipelineState;
  } finally {
    await releaseLock(lockKey, lockValue);
  }
}