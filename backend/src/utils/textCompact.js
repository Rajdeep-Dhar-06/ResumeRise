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
    let out = text
        .replace(ZERO_WIDTH_AND_CONTROL, '')
        .replace(DECORATIVE_DIVIDERS, '');

    for (const pattern of [...GENERIC_NOISE, ...extraNoise]) {
        out = out.replace(new RegExp(pattern.source, 'gi'), '');
    }

    out = removeDuplicateConsecutiveLines(out)
        .replace(REPEATED_BLANK_LINES, '\n\n')
        .trim();

    return maxLines ? out.split('\n').slice(0, maxLines).join('\n') : out;
}