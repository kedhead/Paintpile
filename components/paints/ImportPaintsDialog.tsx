'use client';

import { useState } from 'react';
import { PaintSetSelectionDialog } from './PaintSetSelectionDialog';
import { AIImportDialog } from './AIImportDialog';
import { Button } from '@/components/ui/Button';
import { Package, Sparkles, ChevronDown } from 'lucide-react';

interface ImportPaintsDialogProps {
  userId: string;
  onImportComplete: () => void;
}

type ImportMode = 'none' | 'paintset' | 'ai';

/**
 * Unified paint import component that offers:
 * 1. Curated paint set selection (primary, most reliable)
 * 2. AI import fallback (for unknown/custom sets)
 */
export function ImportPaintsDialog({ userId, onImportComplete }: ImportPaintsDialogProps) {
  const [mode, setMode] = useState<ImportMode>('none');
  const [showDropdown, setShowDropdown] = useState(false);

  const handlePaintSetMode = () => {
    setMode('paintset');
    setShowDropdown(false);
  };

  const handleAIMode = () => {
    setMode('ai');
    setShowDropdown(false);
  };

  const handleImportComplete = () => {
    setMode('none');
    onImportComplete();
  };

  return (
    <div className="relative">
      {/* Main Button with Dropdown */}
      <div className="flex gap-1">
        <Button
          variant="default"
          onClick={handlePaintSetMode}
          className="gap-2 rounded-r-none"
        >
          <Package className="w-4 h-4" />
          Import Paint Set
        </Button>
        <Button
          variant="default"
          onClick={() => setShowDropdown(!showDropdown)}
          className="px-2 rounded-l-none border-l border-primary-foreground/20"
          title="More import options"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Menu */}
          <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden min-w-[240px]">
            <button
              onClick={handlePaintSetMode}
              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3"
            >
              <Package className="w-4 h-4 text-primary" />
              <div>
                <div className="text-sm font-medium">Import Paint Set</div>
                <div className="text-xs text-muted-foreground">
                  Select from curated sets
                </div>
              </div>
            </button>

            <button
              onClick={handleAIMode}
              className="w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-3 border-t border-border"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <div>
                <div className="text-sm font-medium">AI Import</div>
                <div className="text-xs text-muted-foreground">
                  Describe your paints
                </div>
              </div>
            </button>
          </div>
        </>
      )}

      {/* Render the selected mode dialog */}
      {mode === 'paintset' && (
        <PaintSetSelectionDialog
          userId={userId}
          onImportComplete={handleImportComplete}
          onFallbackToAI={handleAIMode}
        />
      )}

      {mode === 'ai' && (
        <AIImportDialog userId={userId} onImportComplete={handleImportComplete} />
      )}
    </div>
  );
}
