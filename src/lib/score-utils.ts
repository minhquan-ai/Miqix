/**
 * Utility functions for score formatting and conversion
 */

/**
 * Format a score to display with maximum 1-2 decimal places
 * @param score - The score value (can be 0-10 or 0-100)
 * @param maxScore - The maximum score (default: 10)
 * @returns Formatted score string (e.g., "7.3", "8.25", "10")
 */
export function formatScore(score: number | null | undefined, maxScore: number = 10): string {
    if (score === null || score === undefined || isNaN(score)) return "—";

    // Ensure score is within valid range
    const validScore = Math.max(0, Math.min(score, maxScore));

    // Round to 2 decimal places
    const rounded = Math.round(validScore * 100) / 100;

    // Format with up to 2 decimal places, removing trailing zeros
    return rounded.toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Convert a score from 100-point scale to 10-point scale
 * @param score - Score on 100-point scale
 * @returns Score on 10-point scale
 */
export function convertTo10PointScale(score: number): number {
    return score / 10;
}

/**
 * Convert a score from 10-point scale to 100-point scale
 * @param score - Score on 10-point scale
 * @returns Score on 100-point scale
 */
export function convertTo100PointScale(score: number): number {
    return score * 10;
}

/**
 * Calculate average score and format it
 * @param scores - Array of scores
 * @param maxScore - Maximum possible score (default: 10)
 * @returns Formatted average score
 */
export function formatAverageScore(scores: (number | null | undefined)[], maxScore: number = 10): string {
    const validScores = scores.filter((s): s is number => s !== null && s !== undefined && !isNaN(s));

    if (validScores.length === 0) return "—";

    const sum = validScores.reduce((acc, score) => acc + score, 0);
    const average = sum / validScores.length;

    return formatScore(average, maxScore);
}

/**
 * Get score color class based on value
 * @param score - Score value (0-10)
 * @returns Tailwind color class
 */
export function getScoreColor(score: number | null | undefined): string {
    if (score === null || score === undefined || isNaN(score)) return "text-gray-400";

    if (score >= 8) return "text-emerald-600";
    if (score >= 6.5) return "text-blue-600";
    if (score >= 5) return "text-amber-600";
    return "text-red-600";
}
