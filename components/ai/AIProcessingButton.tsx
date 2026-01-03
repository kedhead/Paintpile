'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { creditsToDollars } from '@/lib/ai/usage-tracker';

interface AIProcessingButtonProps {
  label: string;
  icon: React.ReactNode;
  estimatedCost: number; // in credits
  onClick: () => Promise<void>;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
}

/**
 * Button for triggering AI operations
 * Shows loading state, cost estimate, and handles errors
 */
export function AIProcessingButton({
  label,
  icon,
  estimatedCost,
  onClick,
  disabled = false,
  variant = 'outline',
}: AIProcessingButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    setIsProcessing(true);

    try {
      await onClick();
    } catch (err: any) {
      console.error('AI processing error:', err);
      setError(err.message || 'Operation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const costDisplay = creditsToDollars(estimatedCost);

  return (
    <div className="space-y-1">
      <Button
        variant={variant}
        size="sm"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            icon
          )}
          {label}
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          {costDisplay}
        </span>
      </Button>

      {error && (
        <p className="text-xs text-destructive px-2">
          {error}
        </p>
      )}
    </div>
  );
}
