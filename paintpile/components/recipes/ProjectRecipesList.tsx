'use client';

import { useState, useEffect } from 'react';
import { getProjectRecipes, removeRecipeFromProject } from '@/lib/firestore/recipes';
import { PaintRecipe, ProjectRecipeUsage, RECIPE_CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/recipe';
import { Button } from '@/components/ui/Button';
import { Trash2, ExternalLink, Loader2, ChefHat } from 'lucide-react';
import Link from 'next/link';

interface ProjectRecipesListProps {
  projectId: string;
  isOwner: boolean;
  onUpdate?: () => void;
}

export function ProjectRecipesList({ projectId, isOwner, onUpdate }: ProjectRecipesListProps) {
  const [recipeData, setRecipeData] = useState<{ usage: ProjectRecipeUsage; recipe: PaintRecipe | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecipes();
  }, [projectId]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const data = await getProjectRecipes(projectId);
      setRecipeData(data);
    } catch (error) {
      console.error('Error loading project recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRecipe = async (usageId: string, recipeId: string) => {
    if (!confirm('Remove this recipe from the project?')) return;

    try {
      await removeRecipeFromProject(projectId, usageId, recipeId);
      await loadRecipes();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing recipe:', error);
      alert('Failed to remove recipe');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (recipeData.length === 0) {
    return (
      <div className="text-center py-8">
        <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">
          No recipes linked to this project yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recipeData.map(({ usage, recipe }) => {
        if (!recipe) return null;

        return (
          <div key={usage.usageId} className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-2">
                  <h3 className="font-semibold text-foreground">{recipe.name}</h3>
                  <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full whitespace-nowrap">
                    {DIFFICULTY_LABELS[recipe.difficulty]}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {recipe.description}
                </p>

                {usage.appliedTo && (
                  <p className="text-sm text-foreground mb-1">
                    <span className="font-medium">Applied to:</span> {usage.appliedTo}
                  </p>
                )}

                {usage.notes && (
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Notes:</span> {usage.notes}
                  </p>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{RECIPE_CATEGORY_LABELS[recipe.category]}</span>
                  <span>•</span>
                  <span>{recipe.ingredients.length} paints</span>
                  {recipe.steps.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{recipe.steps.length} steps</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link href={`/recipes/${recipe.recipeId}`} target="_blank">
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>

                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveRecipe(usage.usageId, recipe.recipeId)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
