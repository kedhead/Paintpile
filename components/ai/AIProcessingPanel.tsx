'use client';

import { useState } from 'react';
import { Photo, ColorSuggestion } from '@/types/photo';
import { AIProcessingButton } from './AIProcessingButton';
import { PaintSuggestionsPanel } from './PaintSuggestionsPanel';
import { Button } from '@/components/ui/Button';
import { Sparkles, Wand2, Sparkle, ArrowUpCircle, Download, ExternalLink, Lock, Palette } from 'lucide-react';
import { OPERATION_COSTS } from '@/lib/ai/constants';
import { useRouter } from 'next/navigation';
import { DonationButton } from '@/components/DonationButton';

interface AIProcessingPanelProps {
  photo: Photo;
  projectId: string;
  userId: string;
  onUpdate?: () => void;
  isPro?: boolean;
}

/**
 * Main AI processing panel integrated into photo lightbox
 * Shows AI action buttons and results
 */
export function AIProcessingPanel({
  photo,
  projectId,
  userId,
  onUpdate,
  // isPro prop is deprecated
}: AIProcessingPanelProps) {
  const router = useRouter();
  const [paintSuggestions, setPaintSuggestions] = useState<ColorSuggestion[] | null>(null);
  const [suggestionsConfidence, setSuggestionsConfidence] = useState(0);
  const [backgroundRemovedUrl, setBackgroundRemovedUrl] = useState<string | null>(
    photo.aiProcessing?.backgroundRemoval?.url || null
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [paintVision, setPaintVision] = useState('');
  const [aiCleanedUrl, setAiCleanedUrl] = useState<string | null>(null);
  const [recolorUrl, setRecolorUrl] = useState<string | null>(null);

  // Check if user has Pro access - DEPRECATED: All users have access with limits
  // if (!isPro) { ... }

  // Handle paint suggestions
  const handleSuggestPaints = async () => {
    const response = await fetch('/api/ai/suggest-paints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId: photo.photoId,
        projectId,
        userId,
        imageUrl: photo.url,
        context: paintVision || undefined,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate paint suggestions');
    }

    setPaintSuggestions(result.data.suggestions);
    setSuggestionsConfidence(result.data.confidence);
    setShowSuggestions(true);

    // Call onUpdate to refresh photo data
    onUpdate?.();
  };

  // Handle AI recolor
  const handleRecolor = async () => {
    if (!paintVision) {
      alert('Please enter a Paint Vision description first (e.g., "blue armor, gold trim")');
      return;
    }

    const response = await fetch('/api/ai/recolor-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId: photo.photoId,
        projectId,
        userId,
        imageUrl: photo.url,
        prompt: paintVision,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate visualization');
    }

    setRecolorUrl(result.data.processedUrl);

    // Call onUpdate to refresh photo data
    onUpdate?.();
  };

  // Handle image enhancement
  const handleEnhanceImage = async () => {
    const response = await fetch('/api/ai/enhance-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId: photo.photoId,
        projectId,
        userId,
        sourceUrl: photo.url,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to enhance image');
    }

    setBackgroundRemovedUrl(result.data.processedUrl);

    // Call onUpdate to refresh photo data
    onUpdate?.();
  };

  // Handle AI cleanup
  const handleAICleanup = async () => {
    const response = await fetch('/api/ai/ai-cleanup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId: photo.photoId,
        projectId,
        userId,
        sourceUrl: photo.url,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to perform AI cleanup');
    }

    setAiCleanedUrl(result.data.processedUrl);

    // Call onUpdate to refresh photo data
    onUpdate?.();
  };

  return (
    <div className="bg-card rounded-xl border border-border p-4 mt-4 space-y-4">

      // ... inside component ...
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">AI Tools</h3>
        </div>
        <DonationButton />
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Paint vision input */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">
            Paint Vision (optional)
          </label>
          <textarea
            value={paintVision}
            onChange={(e) => setPaintVision(e.target.value)}
            placeholder="e.g., 'I want dark blue armor with gold trim' or 'zombie skin tones' or 'weathered rusty metal'"
            className="w-full min-h-[60px] px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            maxLength={200}
          />
          <p className="text-xs text-muted-foreground">
            Describe how you want to paint this miniature
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <AIProcessingButton
            label="Suggest Paints"
            icon={<Sparkles className="h-4 w-4" />}
            estimatedCost={OPERATION_COSTS.paintSuggestions}
            onClick={handleSuggestPaints}
            className="w-full"
          />

          <AIProcessingButton
            label="Visualize Scheme"
            icon={<Palette className="h-4 w-4" />}
            estimatedCost={OPERATION_COSTS.recolor}
            onClick={handleRecolor}
            className="w-full"
            disabled={!paintVision}
          />
        </div>

        <AIProcessingButton
          label="Enhance & Cleanup"
          icon={<Wand2 className="h-4 w-4" />}
          estimatedCost={OPERATION_COSTS.enhancement}
          onClick={handleEnhanceImage}
        />

        <AIProcessingButton
          label="Remove Background"
          icon={<Sparkle className="h-4 w-4" />}
          estimatedCost={OPERATION_COSTS.aiCleanup}
          onClick={handleAICleanup}
        />

        <AIProcessingButton
          label="Upscale 2x"
          icon={<ArrowUpCircle className="h-4 w-4" />}
          estimatedCost={OPERATION_COSTS.upscaling}
          onClick={async () => {
            // TODO: Implement upscaling
            throw new Error('Upscaling coming soon!');
          }}
          disabled
        />
      </div>

      {/* Results section */}
      {(paintSuggestions || backgroundRemovedUrl || aiCleanedUrl || recolorUrl) && (
        <div className="pt-4 border-t border-border space-y-4">
          <h4 className="font-medium text-foreground text-sm">Results</h4>

          {/* Paint suggestions */}
          {paintSuggestions && showSuggestions && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Paint Suggestions ({paintSuggestions.length})
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  {showSuggestions ? 'Hide' : 'Show'}
                </Button>
              </div>

              {showSuggestions && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <PaintSuggestionsPanel
                    suggestions={paintSuggestions}
                    confidence={suggestionsConfidence}
                  />
                </div>
              )}
            </div>
          )}

          {/* Recolor Result */}
          {recolorUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Visualized Scheme
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a href={recolorUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a href={recolorUrl} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="relative aspect-square w-full max-w-xs mx-auto bg-muted/30 rounded-lg overflow-hidden border border-primary/20">
                <img
                  src={recolorUrl}
                  alt="Visualized scheme"
                  className="w-full h-full object-contain"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">
                  AI Generated
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center italic">
                "{paintVision}"
              </p>
            </div>
          )}

          {/* Enhanced image */}
          {backgroundRemovedUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wand2 className="h-4 w-4" />
                  Enhanced Image
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a href={backgroundRemovedUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a href={backgroundRemovedUrl} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="relative aspect-square w-full max-w-xs mx-auto bg-muted/30 rounded-lg overflow-hidden">
                <img
                  src={backgroundRemovedUrl}
                  alt="Enhanced image"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Background Removed image */}
          {aiCleanedUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkle className="h-4 w-4" />
                  Background Removed
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a href={aiCleanedUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                  >
                    <a href={aiCleanedUrl} download>
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="relative aspect-square w-full max-w-xs mx-auto bg-muted/30 rounded-lg overflow-hidden">
                <img
                  src={aiCleanedUrl}
                  alt="Background removed"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
