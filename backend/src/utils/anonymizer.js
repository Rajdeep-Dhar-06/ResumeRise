import nlp from 'compromise';
import logger from './logger.js';

/**
 * Anonymize the candidate's resume content by removing names, emails,
 * phone numbers, physical locations, and organization (school/company) names.
 *
 * @param {string} text - Raw extracted resume text
 * @returns {string} - Cleaned anonymized text
 */
export function anonymizeResume(text) {
  if (!text) return '';

  try {
    const doc = nlp(text);

    doc.emails().replaceWith('[REDACTED_EMAIL]');
    doc.phoneNumbers().replaceWith('[REDACTED_PHONE]');
    doc.people().replaceWith('[REDACTED_NAME]');
    doc.places().replaceWith('[REDACTED_LOCATION]');
    doc.organizations().replaceWith('[REDACTED_ORGANIZATION]');

    return doc.text();
  } catch (error) {
    logger.error({ err: error }, 'Text anonymization failed');
    return text;
  }
}
