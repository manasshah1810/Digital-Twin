/**
 * Utility to compress and clean LLM outputs for high-density dashboards.
 */

const REDUNDANT_PHRASES = [
    /based on (the )?analysis/gi,
    /the results suggest( that)?/gi,
    /it appears that/gi,
    /consequently,/gi,
    /this results in/gi,
    /the change occurred because/gi,
    /in order to/gi,
    /as a result of/gi,
    /specifically,/gi,
    /furthermore,/gi,
    /moreover,/gi,
    /please note that/gi,
    /it is important to( recognize that)?/gi,
];

export interface CompressionOptions {
    maxChars?: number;
    forceBullets?: boolean;
    stripRedundant?: boolean;
}

/**
 * Strips filler words and common LLM conversational markers.
 */
function stripRedundancy(text: string): string {
    let cleaned = text;
    REDUNDANT_PHRASES.forEach(regex => {
        cleaned = cleaned.replace(regex, '');
    });
    // Remove leading/trailing punctuation and whitespace that might remain
    return cleaned.replace(/^[\s,.]+/, '').replace(/[\s,.]+$/, '').trim();
}

/**
 * Compresses a string to fit UI constraints.
 */
export function compressText(text: string, options: CompressionOptions = {}): string {
    const { maxChars = 200, stripRedundant = true } = options;

    let processed = text.trim();

    if (stripRedundant) {
        processed = stripRedundancy(processed);
    }

    // Capitalize first letter if it was stripped
    if (processed.length > 0) {
        processed = processed.charAt(0).toUpperCase() + processed.slice(1);
    }

    if (processed.length > maxChars) {
        processed = processed.substring(0, maxChars - 3) + '...';
    }

    return processed;
}

/**
 * Compresses an array of strings (e.g., bullet points).
 */
export function compressBullets(bullets: string[], options: CompressionOptions = {}): string[] {
    const { maxChars = 80, forceBullets = true } = options;

    return bullets
        .map(b => {
            let processed = compressText(b, { ...options, maxChars });
            if (forceBullets && processed.length > 0 && !processed.startsWith('•') && !processed.startsWith('-')) {
                processed = `• ${processed}`;
            }
            return processed;
        })
        .filter(b => b.length > 2); // Remove empty or tiny artifacts
}
