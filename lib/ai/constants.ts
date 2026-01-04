/**
 * AI Operation Constants
 *
 * Shared constants that can be used by both client and server code
 */

export type AIOperation = 'enhancement' | 'upscaling' | 'paintSuggestions' | 'aiCleanup' | 'recolor';

export interface UsageStats {
  totalCreditsUsed: number;
  currentMonth: {
    credits: number;
    requestCount: number;
    enhancement: number;
    upscaling: number;
    paintSuggestions: number;
    aiCleanup: number;
    recolor: number;
  };
  quotaLimit: number;
  remainingCredits: number;
  percentageUsed: number;
  resetDate: Date;
}

/**
 * Get cost estimates for different operations
 * 1 credit = $0.001
 */
export const OPERATION_COSTS = {
  enhancement: 10,         // 1.0 cent = 10 credits - 2x upscale with detail enhancement
  upscaling: 10,           // 1.0 cent = 10 credits - 4x upscale
  paintSuggestions: 8,     // 0.8 cents = 8 credits
  aiCleanup: 25,          // 2.5 cents = 25 credits - AI-powered cleanup with prompts
  recolor: 20,            // 2.0 cents = 20 credits - InstructPix2Pix
} as const;

/**
 * Convert credits to dollars
 */
export function creditsToDollars(credits: number): string {
  return `$${(credits / 1000).toFixed(2)}`;
}

/**
 * Convert dollars to credits
 */
export function dollarsToCredits(dollars: number): number {
  return Math.round(dollars * 1000);
}
