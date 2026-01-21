/**
 * Generates a unique product code.
 * Format: P-{YYMMDD}-{RANDOM}
 * Example: P-240119-X9Z2
 */
export const generateProductCode = (): string => {
    const now = new Date();
    const datePart = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `P-${datePart}-${randomPart}`;
};
