'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRecipe } from '@/lib/firestore/recipes';
import { getPaintsByIds } from '@/lib/firestore/paints';
import { PaintRecipe, RECIPE_CATEGORY_LABELS, DIFFICULTY_LABELS, TECHNIQUE_LABELS, PAINT_ROLE_LABELS } from '@/types/recipe';
import { Paint } from '@/types/paint';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Clock, Palette } from 'lucide-react';

interface RecipeDetailPageProps {
  params: {
    recipeId: string;
  };
}

export default function RecipeDetailPage({ params }: RecipeDetailPageProps) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<PaintRecipe | null>(null);
  const [paints, setPaints] = useState<Record<string, Paint>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipe();
  }, [params.recipeId]);

  const loadRecipe = async () => {
    try {
      setLoading(true);
      const recipeData = await getRecipe(params.recipeId);

      if (!recipeData) {
        router.push('/recipes');
        return;
      }

      setRecipe(recipeData);

      // Load paint details for all ingredients
      const paintIds = recipeData.ingredients.map(ing => ing.paintId);
      const uniquePaintIds = [...new Set(paintIds)];

      const paintResults = await getPaintsByIds(uniquePaintIds);

      const paintMap: Record<string, Paint> = {};
      paintResults.forEach(paint => {
        paintMap[paint.paintId] = paint;
      });

      setPaints(paintMap);
    } catch (error) {
      console.error('Error loading recipe:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Recipe not found</p>
      </div>
    );
  }

  const difficultyColors = {
    beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Image */}
      {recipe.sourcePhotoUrl && (
        <div className="w-full h-64 md:h-96 bg-muted">
          <img
            src={recipe.sourcePhotoUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      {!recipe.sourcePhotoUrl && recipe.resultColor && (
        <div
          className="w-full h-64 md:h-96"
          style={{ backgroundColor: recipe.resultColor }}
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Title Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">{recipe.name}</h1>
          <p className="text-lg text-muted-foreground">{recipe.description}</p>

          <div className="flex flex-wrap gap-3 mt-4">
            <span className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary border border-primary/20">
              {RECIPE_CATEGORY_LABELS[recipe.category]}
            </span>
            <span className={`px-3 py-1 text-sm rounded-full border ${difficultyColors[recipe.difficulty]}`}>
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </span>
            {recipe.estimatedTime && (
              <span className="px-3 py-1 text-sm rounded-full bg-muted text-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {recipe.estimatedTime} min
              </span>
            )}
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="mb-8 bg-card border border-border rounded-lg p-6">
          <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Ingredients
          </h2>
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => {
              const paint = paints[ingredient.paintId];
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  {paint && (
                    <div
                      className="w-8 h-8 rounded border border-border flex-shrink-0"
                      style={{ backgroundColor: paint.hexColor }}
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {paint ? `${paint.brand} - ${paint.name}` : 'Unknown Paint'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {PAINT_ROLE_LABELS[ingredient.role]}
                      {ingredient.ratio && ` • ${ingredient.ratio}`}
                    </div>
                    {ingredient.notes && (
                      <div className="text-sm text-muted-foreground mt-1">{ingredient.notes}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Steps Section */}
        {recipe.steps && recipe.steps.length > 0 && (
          <div className="mb-8 bg-card border border-border rounded-lg p-6">
            <h2 className="text-2xl font-bold text-foreground mb-4">Steps</h2>
            <div className="space-y-4">
              {recipe.steps.map((step, index) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-primary">Step {step.stepNumber}</span>
                    <span className="font-semibold text-foreground">{step.title}</span>
                  </div>
                  <p className="text-foreground mb-2">{step.instruction}</p>
                  {step.technique && (
                    <div className="text-sm text-muted-foreground">
                      Technique: {TECHNIQUE_LABELS[step.technique]}
                    </div>
                  )}
                  {step.tips && step.tips.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {step.tips.map((tip, tipIndex) => (
                        <div key={tipIndex} className="text-sm text-muted-foreground">
                          💡 {tip}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Tips */}
        {(recipe.mixingInstructions || recipe.applicationTips) && (
          <div className="bg-card border border-border rounded-lg p-6">
            {recipe.mixingInstructions && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">Mixing Instructions</h3>
                <p className="text-foreground whitespace-pre-wrap">{recipe.mixingInstructions}</p>
              </div>
            )}
            {recipe.applicationTips && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Application Tips</h3>
                <p className="text-foreground whitespace-pre-wrap">{recipe.applicationTips}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
