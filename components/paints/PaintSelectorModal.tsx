'use client';

import { useState } from 'react';
import { Paint } from '@/types/paint';
import { PaintSelector } from './PaintSelector';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

interface PaintSelectorModalProps {
  selectedPaintIds?: string[];
  onSelectionChange: (selectedPaintIds: string[]) => void;
  onClose: () => void;
  multiSelect?: boolean;
  userId?: string; // Pass through to PaintSelector for custom paints
}

export function PaintSelectorModal({
  selectedPaintIds = [],
  onSelectionChange,
  onClose,
  multiSelect = false,
  userId,
}: PaintSelectorModalProps) {
  const [selectedPaints, setSelectedPaints] = useState<Paint[]>([]);

  function handleConfirm() {
    const paintIds = selectedPaints.map((p) => p.paintId);
    onSelectionChange(paintIds);
  }

  function handleCancel() {
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Select Paint{multiSelect ? 's' : ''}
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <PaintSelector
            selectedPaints={selectedPaints}
            onPaintsChange={setSelectedPaints}
            maxSelection={multiSelect ? undefined : 1}
            userId={userId}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={selectedPaints.length === 0}
            className="flex-1"
          >
            {multiSelect
              ? `Add ${selectedPaints.length} Paint${selectedPaints.length !== 1 ? 's' : ''}`
              : 'Select Paint'}
          </Button>
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
