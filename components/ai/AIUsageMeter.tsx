'use client';

import { useEffect, useState } from 'react';
import { UsageStats, creditsToDollars } from '@/lib/ai/constants';
import { Sparkles, TrendingUp } from 'lucide-react';

interface AIUsageMeterProps {
  userId: string;
}

/**
 * Display user's AI quota usage
 * Shows progress bar and breakdown by operation
 */
export function AIUsageMeter({ userId }: AIUsageMeterProps) {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageStats();
  }, [userId]);

  const loadUsageStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai/usage?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-2 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const percentageUsed = Math.min(100, stats.percentageUsed);
  const isNearLimit = percentageUsed >= 80;

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI Usage This Month</span>
        </div>
        {isNearLimit && (
          <span className="text-xs text-orange-500 font-medium">
            Near Limit
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">
            {creditsToDollars(stats.currentMonth.credits)} / {creditsToDollars(stats.quotaLimit)}
          </span>
          <span className={isNearLimit ? 'text-orange-500 font-medium' : 'text-muted-foreground'}>
            {percentageUsed.toFixed(1)}%
          </span>
        </div>

        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              isNearLimit ? 'bg-orange-500' : 'bg-primary'
            }`}
            style={{ width: `${percentageUsed}%` }}
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <TrendingUp className="h-3 w-3" />
          <span>Usage Breakdown</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paint Suggestions:</span>
            <span className="font-medium">{stats.currentMonth.paintSuggestions}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Image Enhancement:</span>
            <span className="font-medium">{stats.currentMonth.enhancement}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Upscaling:</span>
            <span className="font-medium">{stats.currentMonth.upscaling}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Requests:</span>
            <span className="font-medium">{stats.currentMonth.requestCount}</span>
          </div>
        </div>
      </div>

      {/* Reset date */}
      <div className="text-xs text-muted-foreground text-center pt-2">
        Resets on {stats.resetDate.toLocaleDateString()}
      </div>
    </div>
  );
}
