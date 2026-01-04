/**
 * AI Operation Constants
 *
 * Shared constants that can be used by both client and server code
 */

export type AIOperation = 'backgroundRemoval' | 'upscaling' | 'paintSuggestions' | 'enhancement';

export interface UsageStats {
  totalCreditsUsed: number;
  currentMonth: {
    credits: number;
    requestCount: number;
    backgroundRemoval: number;
    upscaling: number;
    paintSuggestions: number;
    enhancement: number;
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
  backgroundRemoval: 2,    // 0.2 cents = 2 credits
  upscaling: 10,           // 1.0 cent = 10 credits
  paintSuggestions: 8,     // 0.8 cents = 8 credits
  enhancement: 5,          // 0.5 cents = 5 credits
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
