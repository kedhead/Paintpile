'use client';

import { useState } from 'react';
import { Photo, ColorSuggestion } from '@/types/photo';
import { AIProcessingButton } from './AIProcessingButton';
import { PaintSuggestionsPanel } from './PaintSuggestionsPanel';
import { Button } from '@/components/ui/Button';
import { Sparkles, Wand2, Sparkle, ArrowUpCircle, Download, ExternalLink, Lock } from 'lucide-react';
import { OPERATION_COSTS } from '@/lib/ai/constants';
import { useRouter } from 'next/navigation';

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
  isPro = false,
}: AIProcessingPanelProps) {
  const router = useRouter();
  const [paintSuggestions, setPaintSuggestions] = useState<ColorSuggestion[] | null>(null);
  const [suggestionsConfidence, setSuggestionsConfidence] = useState(0);
  const [backgroundRemovedUrl, setBackgroundRemovedUrl] = useState<string | null>(
    photo.aiProcessing?.backgroundRemoval?.url || null
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [paintVision, setPaintVision] = useState('');
  const [cleanupPrompt, setCleanupPrompt] = useState('professional product photo on clean white background with studio lighting, sharp focus');
  const [aiCleanedUrl, setAiCleanedUrl] = useState<string | null>(null);

  // Check if user has Pro access
  if (!isPro) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 mt-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">
              AI Features - Pro Only
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Unlock AI-powered paint suggestions, image enhancement, and upscaling
            </p>
            <Button
              size="sm"
              onClick={() => router.push('/settings/subscription')}
            >
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
        prompt: cleanupPrompt,
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
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">AI Tools</h3>
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

        <AIProcessingButton
          label="Suggest Paints"
          icon={<Sparkles className="h-4 w-4" />}
          estimatedCost={OPERATION_COSTS.paintSuggestions}
          onClick={handleSuggestPaints}
        />

        <AIProcessingButton
          label="Enhance & Cleanup"
          icon={<Wand2 className="h-4 w-4" />}
          estimatedCost={OPERATION_COSTS.enhancement}
          onClick={handleEnhanceImage}
        />

        {/* AI Cleanup with prompt */}
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground block">
            AI Cleanup Prompt
          </label>
          <textarea
            value={cleanupPrompt}
            onChange={(e) => setCleanupPrompt(e.target.value)}
            placeholder="e.g., 'professional product photo on white background' or 'clean display photo with great lighting'"
            className="w-full min-h-[60px] px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground">
            Describe how you want the final image to look
          </p>
        </div>

        <AIProcessingButton
          label="AI Cleanup (Gemini-style)"
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
      {(paintSuggestions || backgroundRemovedUrl || aiCleanedUrl) && (
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

          {/* AI Cleaned image */}
          {aiCleanedUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkle className="h-4 w-4" />
                  AI Cleaned
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
                  alt="AI cleaned"
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
