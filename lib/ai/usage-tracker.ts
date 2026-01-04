/**
 * AI Usage Tracker
 *
 * Manages AI API usage quotas and costs to prevent abuse and control expenses.
 * Tracks usage per user, per month, per operation type.
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getUserProfile } from '@/lib/firestore/users';
import { OPERATION_COSTS, creditsToDollars, dollarsToCredits, UsageStats } from './constants';
import type { AIOperation } from './constants';

// Re-export from constants for backwards compatibility
export { OPERATION_COSTS, creditsToDollars, dollarsToCredits };
export type { AIOperation, UsageStats } from './constants';

export interface MonthlyUsage {
  credits: number;
  requestCount: number;
  enhancement: number;
  upscaling: number;
  paintSuggestions: number;
  aiCleanup: number;
}

/**
 * Check if user has sufficient quota for an operation
 * @param userId - User ID
 * @param estimatedCredits - Estimated cost in credits (1 credit = $0.001)
 * @returns true if user has quota, false otherwise
 */
export async function checkQuota(
  userId: string,
  estimatedCredits: number
): Promise<{ allowed: boolean; reason?: string; stats?: UsageStats }> {
  try {
    // Get user to check subscription status
    const user = await getUserProfile(userId);

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Check if user has Pro subscription (or AI enabled flag for testing)
    const hasPro = user.subscription?.tier === 'pro' && user.subscription?.status === 'active';
    const hasAIEnabled = user.features?.aiEnabled === true;

    if (!hasPro && !hasAIEnabled) {
      return {
        allowed: false,
        reason: 'AI features require Pro subscription. Upgrade to continue.',
      };
    }

    // Get or create usage document
    const usageDoc = await getOrCreateUsageDoc(userId);
    const currentMonthKey = getCurrentMonthKey();
    const monthlyUsage = usageDoc.monthlyUsage?.[currentMonthKey] || getDefaultMonthlyUsage();

    // Get quota limit (default from env or user-specific override)
    const quotaLimit = usageDoc.quotaLimit || getDefaultQuotaLimit();

    // Calculate remaining credits
    const remainingCredits = quotaLimit - monthlyUsage.credits;

    // Check if user has enough quota
    if (monthlyUsage.credits + estimatedCredits > quotaLimit) {
      const stats: UsageStats = {
        totalCreditsUsed: usageDoc.totalCreditsUsed || 0,
        currentMonth: monthlyUsage,
        quotaLimit,
        remainingCredits: Math.max(0, remainingCredits),
        percentageUsed: (monthlyUsage.credits / quotaLimit) * 100,
        resetDate: getNextResetDate(user),
      };

      return {
        allowed: false,
        reason: `Monthly quota exceeded. You've used ${monthlyUsage.credits} of ${quotaLimit} credits. Resets on ${stats.resetDate.toLocaleDateString()}.`,
        stats,
      };
    }

    // Quota check passed
    const stats: UsageStats = {
      totalCreditsUsed: usageDoc.totalCreditsUsed || 0,
      currentMonth: monthlyUsage,
      quotaLimit,
      remainingCredits: remainingCredits - estimatedCredits,
      percentageUsed: ((monthlyUsage.credits + estimatedCredits) / quotaLimit) * 100,
      resetDate: getNextResetDate(user),
    };

    return { allowed: true, stats };
  } catch (error) {
    console.error('Error checking quota:', error);
    return { allowed: false, reason: 'Failed to check quota. Please try again.' };
  }
}

/**
 * Track AI usage after successful operation
 * @param userId - User ID
 * @param operation - Type of AI operation
 * @param creditsUsed - Actual credits consumed
 */
export async function trackUsage(
  userId: string,
  operation: AIOperation,
  creditsUsed: number
): Promise<void> {
  try {
    const db = getAdminFirestore();
    const usageRef = db.collection('aiUsage').doc(userId);
    const currentMonthKey = getCurrentMonthKey();

    // Update usage stats
    await usageRef.update({
      totalCreditsUsed: FieldValue.increment(creditsUsed),
      [`monthlyUsage.${currentMonthKey}.credits`]: FieldValue.increment(creditsUsed),
      [`monthlyUsage.${currentMonthKey}.requestCount`]: FieldValue.increment(1),
      [`monthlyUsage.${currentMonthKey}.${operation}`]: FieldValue.increment(1),
      lastUpdated: FieldValue.serverTimestamp(),
    });

    console.log(`[Usage Tracker] User ${userId}: ${operation} = ${creditsUsed} credits`);
  } catch (error) {
    console.error('Error tracking usage:', error);
    // Don't throw - usage tracking failure shouldn't block the operation
  }
}

/**
 * Get usage statistics for a user
 * @param userId - User ID
 * @returns Usage statistics
 */
export async function getUserUsage(userId: string): Promise<UsageStats | null> {
  try {
    const user = await getUserProfile(userId);
    if (!user) return null;

    const usageDoc = await getOrCreateUsageDoc(userId);
    const currentMonthKey = getCurrentMonthKey();
    const monthlyUsage = usageDoc.monthlyUsage?.[currentMonthKey] || getDefaultMonthlyUsage();
    const quotaLimit = usageDoc.quotaLimit || getDefaultQuotaLimit();
    const remainingCredits = quotaLimit - monthlyUsage.credits;

    return {
      totalCreditsUsed: usageDoc.totalCreditsUsed || 0,
      currentMonth: monthlyUsage,
      quotaLimit,
      remainingCredits: Math.max(0, remainingCredits),
      percentageUsed: (monthlyUsage.credits / quotaLimit) * 100,
      resetDate: getNextResetDate(user),
    };
  } catch (error) {
    console.error('Error getting user usage:', error);
    return null;
  }
}

/**
 * Get or create AI usage document for user
 */
async function getOrCreateUsageDoc(userId: string): Promise<any> {
  const db = getAdminFirestore();
  const usageRef = db.collection('aiUsage').doc(userId);
  const usageSnap = await usageRef.get();

  if (!usageSnap.exists) {
    // Create new usage document
    const newUsage = {
      userId,
      totalCreditsUsed: 0,
      quotaLimit: getDefaultQuotaLimit(),
      monthlyUsage: {},
      createdAt: FieldValue.serverTimestamp(),
      lastUpdated: FieldValue.serverTimestamp(),
    };

    await usageRef.set(newUsage);
    return newUsage;
  }

  return usageSnap.data();
}

/**
 * Get current month key in format YYYY-MM
 */
function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get default monthly usage object
 */
function getDefaultMonthlyUsage(): MonthlyUsage {
  return {
    credits: 0,
    requestCount: 0,
    enhancement: 0,
    upscaling: 0,
    paintSuggestions: 0,
    aiCleanup: 0,
  };
}

/**
 * Get default quota limit from environment variable
 */
function getDefaultQuotaLimit(): number {
  const envLimit = process.env.AI_QUOTA_LIMIT_CENTS;
  return envLimit ? parseInt(envLimit, 10) : 20000; // Default: 20,000 credits = $20
}

/**
 * Get next quota reset date
 * For Pro users, aligns with subscription billing cycle
 * For others, first day of next month
 */
function getNextResetDate(user: any): Date {
  if (user.subscription?.currentPeriodEnd) {
    return user.subscription.currentPeriodEnd.toDate();
  }

  // Default: first day of next month
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

/**
 * Reset quota for testing/admin purposes
 * @param userId - User ID
 */
export async function resetQuota(userId: string): Promise<void> {
  const db = getAdminFirestore();
  const usageRef = db.collection('aiUsage').doc(userId);
  const currentMonthKey = getCurrentMonthKey();

  await usageRef.update({
    [`monthlyUsage.${currentMonthKey}`]: getDefaultMonthlyUsage(),
    lastUpdated: FieldValue.serverTimestamp(),
  });

  console.log(`[Usage Tracker] Reset quota for user ${userId}`);
}
