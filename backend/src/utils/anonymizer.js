import nlp from 'compromise';

/**
 * Anonymize the candidate's resume content by removing names, emails,
 * phone numbers, physical locations, and organization (school/company) names.
 *
 * @param {string} text - Raw extracted resume text
 * @returns {string} - Cleaned anonymized text
 */
export function anonymizeResume(text) {
  if (!text) return '';

  // 1. Regex pass to strip emails
  let cleaned = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');

  // 2. Regex pass to strip phone numbers (matches common formats: +1, (555), dashes, spaces)
  cleaned = cleaned.replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '[REDACTED_PHONE]');

  // 3. NLP pass using compromise to replace people, places, and organizations
  try {
    let doc = nlp(cleaned);
    
    // Replace names
    doc.people().replaceWith('[REDACTED_NAME]');
    
    // Replace places (addresses, cities, states, countries)
    doc.places().replaceWith('[REDACTED_PLACE]');
    
    // Replace organizations (schools, universities, companies, institutes)
    doc.organizations().replaceWith('[REDACTED_ORGANIZATION]');
    
    cleaned = doc.text();
  } catch (error) {
    console.error('[Anonymizer] Compromise failed, falling back to regex redaction only:', error);
  }

  return cleaned;
}
