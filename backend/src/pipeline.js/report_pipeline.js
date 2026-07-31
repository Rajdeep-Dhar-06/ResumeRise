import { ingestDocumentsStep } from '../services/step1_ingest.js';
import { auditRequirementsStep } from '../services/step2_audit.js';
import { assembleReportComponentsStep } from '../services/step3_assemble.js';
import { persistReportStep } from '../services/step4_persist.js';
import { acquireLock, releaseLock } from '../utils/lock.js';
import crypto from 'crypto';

/**
 * Executes the end-to-end interview report generation pipeline using modular step functions.
 * 
 * @param {Object} inputContext - Initial payload containing userId, resumeBuffer, jobDescriptionUrl, etc.
 * @returns {Promise<Object>} - Resolved object containing `{ savedReport }`
 */
export async function runInterviewReportPipeline(inputContext) {
  const lockKey = `lock:pipeline:${inputContext.userId}`;
  const lockValue = crypto.randomUUID();

  const acquired = await acquireLock(lockKey, lockValue, 300);
  if (!acquired) {
    throw new Error('Report generation is already in progress for your account. Please wait or try again if it fails.');
  }

  try {
    const ingestData = await ingestDocumentsStep(inputContext);
    const auditData = await auditRequirementsStep(ingestData);
    const assembledData = await assembleReportComponentsStep(auditData);
    const result = await persistReportStep(assembledData);

    return result;
  } finally {
    await releaseLock(lockKey, lockValue);
  }
}