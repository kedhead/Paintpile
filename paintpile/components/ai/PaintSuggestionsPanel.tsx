'use client';

import { ColorSuggestion } from '@/types/photo';
import { PaintChip } from '@/components/paints/PaintChip';
import { Button } from '@/components/ui/Button';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PaintSuggestionsPanelProps {
  suggestions: ColorSuggestion[];
  confidence: number;
  onAddToAnnotation?: (suggestion: ColorSuggestion) => void;
}

/**
 * Display AI-generated paint suggestions with matched paints from database
 */
export function PaintSuggestionsPanel({
  suggestions,
  confidence,
  onAddToAnnotation,
}: PaintSuggestionsPanelProps) {
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<number>>(new Set([0]));

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedSuggestions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSuggestions(newExpanded);
  };

  // Group suggestions by location
  const groupedSuggestions = suggestions.reduce((acc, suggestion, index) => {
    const location = suggestion.location || 'general';
    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push({ suggestion, index });
    return acc;
  }, {} as Record<string, Array<{ suggestion: ColorSuggestion; index: number }>>);

  const locationLabels: Record<string, string> = {
    base: 'Base Coat',
    highlight: 'Highlights',
    shadow: 'Shadows',
    general: 'Other Colors',
  };

  const locationOrder = ['base', 'shadow', 'highlight', 'general'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">AI Paint Suggestions</h3>
        </div>
        <div className="text-xs text-muted-foreground">
          {Math.round(confidence * 100)}% confidence
        </div>
      </div>

      {/* Grouped suggestions by location */}
      <div className="space-y-4">
        {locationOrder.map(location => {
          const group = groupedSuggestions[location];
          if (!group || group.length === 0) return null;

          return (
            <div key={location} className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">
                {locationLabels[location]}
              </h4>

              <div className="space-y-3">
                {group.map(({ suggestion, index }) => {
                  const isExpanded = expandedSuggestions.has(index);

                  return (
                    <div
                      key={index}
                      className="bg-muted/30 rounded-lg border border-border p-3"
                    >
                      {/* Color header */}
                      <button
                        onClick={() => toggleExpanded(index)}
                        className="w-full flex items-center gap-3 text-left"
                      >
                        {/* Color swatch */}
                        <div
                          className="w-8 h-8 rounded border-2 border-border flex-shrink-0"
                          style={{ backgroundColor: suggestion.hexColor }}
                        />

                        {/* Color description */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {suggestion.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.matchedPaints.length} paint{suggestion.matchedPaints.length !== 1 ? 's' : ''} matched
                          </p>
                        </div>

                        {/* Expand icon */}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                      </button>

                      {/* Matched paints (expandable) */}
                      {isExpanded && suggestion.matchedPaints.length > 0 && (
                        <div className="mt-3 space-y-2 pl-11">
                          {suggestion.matchedPaints.map((paint, paintIndex) => (
                            <div
                              key={paint.paintId}
                              className="flex items-center gap-2"
                            >
                              <PaintChip paint={paint} size="sm" />
                              {paintIndex === 0 && (
                                <span className="text-xs text-primary font-medium">
                                  Best match
                                </span>
                              )}
                            </div>
                          ))}

                          {onAddToAnnotation && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onAddToAnnotation(suggestion)}
                              className="mt-2 text-xs"
                            >
                              Add to Annotation
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {suggestions.length === 0 && (
        <div className="text-center py-6 text-muted-foreground text-sm">
          No color suggestions available
        </div>
      )}
    </div>
  );
}
