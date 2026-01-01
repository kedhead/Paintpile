'use client';

import { Paint } from '@/types/paint';
import { X } from 'lucide-react';

interface PaintChipProps {
  paint: Paint;
  onRemove?: () => void;
  size?: 'sm' | 'md' | 'lg';
  showRemove?: boolean;
}

export function PaintChip({ paint, onRemove, size = 'md', showRemove = true }: PaintChipProps) {
  const sizeClasses = {
    sm: 'h-6 px-2 text-xs',
    md: 'h-8 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  const dotSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 bg-white border border-gray-300 rounded-full ${sizeClasses[size]} group hover:border-primary-400 transition`}
    >
      <div
        className={`rounded-full border border-gray-300 ${dotSizeClasses[size]} flex-shrink-0`}
        style={{ backgroundColor: paint.hexColor }}
        title={`${paint.brand} - ${paint.name}`}
      />
      <span className="font-medium text-gray-900 truncate max-w-[120px]">
        {paint.name}
      </span>
      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 text-gray-400 hover:text-gray-600 transition opacity-0 group-hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

interface PaintChipListProps {
  paints: Paint[];
  onRemove?: (paintId: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function PaintChipList({ paints, onRemove, size = 'md' }: PaintChipListProps) {
  if (paints.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {paints.map((paint) => (
        <PaintChip
          key={paint.paintId}
          paint={paint}
          onRemove={onRemove ? () => onRemove(paint.paintId) : undefined}
          size={size}
          showRemove={!!onRemove}
        />
      ))}
    </div>
  );
}
