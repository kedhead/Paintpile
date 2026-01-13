'use client';

import { useState } from 'react';
import { PaintRecipe, RECIPE_CATEGORY_LABELS, DIFFICULTY_LABELS, TECHNIQUE_LABELS } from '@/types/recipe';
import { saveRecipe, unsaveRecipe, isRecipeSaved, likeRecipe, unlikeRecipe } from '@/lib/firestore/recipes';
import { Button } from '@/components/ui/Button';
import { Heart, BookMarked, Edit2, Trash2, Clock, Users, Star } from 'lucide-react';
import Link from 'next/link';

interface RecipeCardProps {
  recipe: PaintRecipe;
  onEdit?: (recipe: PaintRecipe) => void;
  onDelete?: (recipeId: string) => void;
  showActions?: boolean;
  userId?: string;
}

export function RecipeCard({ recipe, onEdit, onDelete, showActions = false, userId }: RecipeCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [saves, setSaves] = useState(recipe.saves);
  const [likes, setLikes] = useState(recipe.likes);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if recipe is saved by current user
  useState(() => {
    if (userId) {
      isRecipeSaved(userId, recipe.recipeId).then(setIsSaved);
    }
  });

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!userId || loading) return;

    try {
      setLoading(true);
      if (isSaved) {
        await unsaveRecipe(userId, recipe.recipeId);
        setSaves(prev => prev - 1);
        setIsSaved(false);
      } else {
        await saveRecipe(userId, recipe.recipeId);
        setSaves(prev => prev + 1);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!userId || loading) return;

    try {
      setLoading(true);
      if (isLiked) {
        await unlikeRecipe(recipe.recipeId);
        setLikes(prev => prev - 1);
        setIsLiked(false);
      } else {
        await likeRecipe(recipe.recipeId);
        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColors = {
    beginner: 'bg-green-500/10 text-green-500 border-green-500/20',
    intermediate: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    advanced: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Result Color Preview */}
      {recipe.resultColor && (
        <div
          className="h-32 w-full"
          style={{ backgroundColor: recipe.resultColor }}
        />
      )}
      {!recipe.resultColor && recipe.resultPhotos.length > 0 && (
        <img
          src={recipe.resultPhotos[0]}
          alt={recipe.name}
          className="h-32 w-full object-cover"
        />
      )}
      {!recipe.resultColor && recipe.resultPhotos.length === 0 && recipe.sourcePhotoUrl && (
        <img
          src={recipe.sourcePhotoUrl}
          alt={recipe.name}
          className="h-32 w-full object-cover"
        />
      )}
      {!recipe.resultColor && recipe.resultPhotos.length === 0 && !recipe.sourcePhotoUrl && (
        <div className="h-32 w-full bg-muted flex items-center justify-center">
          <span className="text-muted-foreground text-sm">No preview</span>
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-lg font-semibold text-foreground line-clamp-1">
              {recipe.name}
            </h3>
            <span
              className={`px-2 py-1 text-xs rounded-full border ${
                difficultyColors[recipe.difficulty]
              }`}
            >
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {RECIPE_CATEGORY_LABELS[recipe.category]}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground line-clamp-2">
          {recipe.description}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            <span>{likes}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookMarked className="h-3 w-3" />
            <span>{saves}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{recipe.usedInProjects}</span>
          </div>
          {recipe.estimatedTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{recipe.estimatedTime}m</span>
            </div>
          )}
        </div>

        {/* Techniques */}
        {recipe.techniques.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.techniques.slice(0, 3).map((technique) => (
              <span
                key={technique}
                className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full"
              >
                {TECHNIQUE_LABELS[technique]}
              </span>
            ))}
            {recipe.techniques.length > 3 && (
              <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                +{recipe.techniques.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Ingredients Count */}
        <div className="text-xs text-muted-foreground">
          {recipe.ingredients.length} paint{recipe.ingredients.length !== 1 ? 's' : ''}
          {recipe.steps.length > 0 && ` • ${recipe.steps.length} steps`}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          {showActions ? (
            <>
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(recipe)}
                  className="flex-1"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(recipe.recipeId)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </>
          ) : (
            <>
              {userId && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    disabled={loading}
                    className={isLiked ? 'text-red-500' : ''}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                    disabled={loading}
                    className={isSaved ? 'text-primary' : ''}
                  >
                    <BookMarked className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                asChild
              >
                <Link href={`/recipes/${recipe.recipeId}`}>
                  View Details
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
