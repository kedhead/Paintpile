'use client';

import { useEffect, useState } from 'react';
import { PaintRecipe } from '@/types/paint-recipe';
import { Paint } from '@/types/paint';
import { getPaintsByIds } from '@/lib/firestore/paints';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PaintChip } from '@/components/paints/PaintChip';

interface RecipeCardProps {
  recipe: PaintRecipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const [paints, setPaints] = useState<Paint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPaints() {
      try {
        const paintIds = recipe.paints.map(p => p.paintId);
        const paintData = await getPaintsByIds(paintIds);
        setPaints(paintData);
      } catch (err) {
        console.error('Error loading paints:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPaints();
  }, [recipe]);

  // Group paints by role
  const groupedPaints = recipe.paints.reduce((acc, entry) => {
    if (!acc[entry.role]) {
      acc[entry.role] = [];
    }
    acc[entry.role].push(entry);
    return acc;
  }, {} as Record<string, typeof recipe.paints>);

  // Role order for display
  const roleOrder = ['base', 'midtone', 'highlight', 'shadow', 'glaze', 'wash'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{recipe.name}</CardTitle>
        {recipe.description && (
          <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-gray-500">Loading paints...</div>
        ) : (
          <div className="space-y-3">
            {roleOrder.map(role => {
              const entries = groupedPaints[role];
              if (!entries || entries.length === 0) return null;

              return (
                <div key={role}>
                  <div className="text-xs font-semibold text-gray-700 uppercase mb-1">
                    {role}
                  </div>
                  <div className="space-y-1">
                    {entries
                      .sort((a, b) => a.order - b.order)
                      .map(entry => {
                        const paint = paints.find(p => p.paintId === entry.paintId);
                        if (!paint) return null;

                        return (
                          <div key={entry.paintId} className="flex items-center gap-2">
                            <PaintChip paint={paint} size="sm" />
                            {entry.ratio && (
                              <span className="text-xs text-gray-600">({entry.ratio})</span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
