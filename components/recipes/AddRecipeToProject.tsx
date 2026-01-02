'use client';

import { useState, useEffect } from 'react';
import { getUserRecipes, getUserSavedRecipes, addRecipeToProject } from '@/lib/firestore/recipes';
import { PaintRecipe, RECIPE_CATEGORY_LABELS, DIFFICULTY_LABELS } from '@/types/recipe';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Plus, Search, ChefHat } from 'lucide-react';

interface AddRecipeToProjectProps {
  projectId: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRecipeToProject({ projectId, userId, onClose, onSuccess }: AddRecipeToProjectProps) {
  const [recipes, setRecipes] = useState<PaintRecipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<PaintRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-recipes' | 'saved'>('my-recipes');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<PaintRecipe | null>(null);
  const [appliedTo, setAppliedTo] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadRecipes();
  }, [userId]);

  const loadRecipes = async () => {
    try {
      setLoading(true);
      const [myRecipes, saved] = await Promise.all([
        getUserRecipes(userId),
        getUserSavedRecipes(userId),
      ]);
      setRecipes(myRecipes);
      setSavedRecipes(saved);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipe = (recipe: PaintRecipe) => {
    setSelectedRecipe(recipe);
  };

  const handleAddRecipe = async () => {
    if (!selectedRecipe) return;

    try {
      setAdding(true);
      await addRecipeToProject(projectId, selectedRecipe.recipeId, appliedTo || undefined, notes || undefined);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding recipe to project:', error);
      alert('Failed to add recipe to project');
    } finally {
      setAdding(false);
    }
  };

  const displayedRecipes = activeTab === 'my-recipes' ? recipes : savedRecipes;
  const filteredRecipes = displayedRecipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {selectedRecipe ? 'Add Recipe to Project' : 'Select Recipe'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedRecipe ? (
            <>
              {/* Search and Tabs */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('my-recipes')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'my-recipes'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    My Recipes ({recipes.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('saved')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      activeTab === 'saved'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Saved ({savedRecipes.length})
                  </button>
                </div>
              </div>

              {/* Recipe List */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading recipes...
                </div>
              ) : filteredRecipes.length === 0 ? (
                <div className="text-center py-8">
                  <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No recipes match your search' : 'No recipes found'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredRecipes.map(recipe => (
                    <button
                      key={recipe.recipeId}
                      onClick={() => handleSelectRecipe(recipe)}
                      className="text-left p-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{recipe.name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                          {DIFFICULTY_LABELS[recipe.difficulty]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {recipe.description}
                      </p>
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
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Selected Recipe Details */}
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-foreground">{selectedRecipe.name}</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRecipe(null)}>
                      Change
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{selectedRecipe.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{RECIPE_CATEGORY_LABELS[selectedRecipe.category]}</span>
                    <span>•</span>
                    <span>{DIFFICULTY_LABELS[selectedRecipe.difficulty]}</span>
                    <span>•</span>
                    <span>{selectedRecipe.ingredients.length} paints</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Applied To (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Helmet, Cloak, Left shoulder pad..."
                    value={appliedTo}
                    onChange={(e) => setAppliedTo(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Specify which part of the model this recipe was used on
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any project-specific notes about using this recipe..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-border">
          {selectedRecipe ? (
            <>
              <Button
                onClick={handleAddRecipe}
                variant="default"
                isLoading={adding}
                disabled={adding}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Project
              </Button>
              <Button
                onClick={() => setSelectedRecipe(null)}
                variant="ghost"
                disabled={adding}
              >
                Back
              </Button>
            </>
          ) : (
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
