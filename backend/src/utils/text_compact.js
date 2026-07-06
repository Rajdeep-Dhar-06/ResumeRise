import { convert } from 'html-to-text';

const ZERO_WIDTH_AND_CONTROL = /[\u200B-\u200D\uFEFF\u0000-\u001F\u007F]/g;
const DECORATIVE_DIVIDERS = /^[\s]*[─═━▬•·\-_=]{3,}[\s]*$/gm;
const REPEATED_BLANK_LINES = /\n{3,}/g;

const GENERIC_NOISE = [
    /cookie(s)? (policy|consent|preferences)/i,
    /all rights reserved/i,
    /privacy policy/i,
    /terms (of service|and conditions)/i,
    /follow us on (linkedin|twitter|instagram|facebook)/i,
    /share this (job|page|article)/i,
];

function removeDuplicateConsecutiveLines(text) {
    const out = [];
    let prev = null;
    for (const line of text.split('\n')) {
        const norm = line.trim().toLowerCase();
        if (norm && norm === prev) continue;
        out.push(line);
        prev = norm;
    }
    return out.join('\n');
}

export function compactText(text, { extraNoise = [], maxLines = null } = {}) {
    if (!text) return '';

    // If the input is HTML, convert it to clean structured text first
    let cleanText = text;
    if (/<[a-z][\s\S]*>/i.test(text)) {
        cleanText = convert(text, {
            wordwrap: false,
            selectors: [
                { selector: 'nav', format: 'skip' },
                { selector: 'footer', format: 'skip' },
                { selector: 'header', format: 'skip' },
                { selector: 'script', format: 'skip' },
                { selector: 'style', format: 'skip' },
                { selector: 'a', options: { ignoreHref: true } }
            ]
        });
    }

    let out = cleanText
        .replace(ZERO_WIDTH_AND_CONTROL, '')
        .replace(DECORATIVE_DIVIDERS, '');

    const allPatterns = [...GENERIC_NOISE, ...extraNoise];
    out = out.split('\n')
        .filter(line => {
            const trimmed = line.trim();
            if (!trimmed) return true; // keep blank lines for spacing logic
            const isNoise = allPatterns.some(pattern => pattern.test(trimmed));
            return !isNoise;
        })
        .join('\n');

    out = removeDuplicateConsecutiveLines(out)
        .replace(REPEATED_BLANK_LINES, '\n\n')
        .trim();

    return maxLines ? out.split('\n').slice(0, maxLines).join('\n') : out;
}