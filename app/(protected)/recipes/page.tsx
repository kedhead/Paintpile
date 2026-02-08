'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRecipes, deleteRecipe, getUserSavedRecipes } from '@/lib/firestore/recipes';
import { PaintRecipe } from '@/types/recipe';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, BookMarked } from 'lucide-react';

export default function RecipesPage() {
  const { currentUser } = useAuth();
  const [recipes, setRecipes] = useState<PaintRecipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<PaintRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<PaintRecipe | null>(null);
  const [activeTab, setActiveTab] = useState<'my-recipes' | 'saved'>('my-recipes');

  useEffect(() => {
    if (currentUser) {
      loadRecipes();
    }
  }, [currentUser]);

  const loadRecipes = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const [myRecipes, saved] = await Promise.all([
        getUserRecipes(currentUser.uid),
        getUserSavedRecipes(currentUser.uid),
      ]);
      setRecipes(myRecipes);
      setSavedRecipes(saved);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecipe = () => {
    setEditingRecipe(null);
    setShowForm(true);
  };

  const handleEditRecipe = (recipe: PaintRecipe) => {
    setEditingRecipe(recipe);
    setShowForm(true);
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      await deleteRecipe(recipeId);
      await loadRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Failed to delete recipe');
    }
  };

  const handleFormSuccess = () => {
    loadRecipes();
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to view your recipes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Recipes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create and manage your paint recipes
              </p>
            </div>
            <Button onClick={handleCreateRecipe} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              New Recipe
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="my-recipes" value={activeTab} onValueChange={(v) => setActiveTab(v as 'my-recipes' | 'saved')}>
          <TabsList className="mb-6">
            <TabsTrigger value="my-recipes">
              My Recipes ({recipes.length})
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <BookMarked className="h-4 w-4" />
              Saved ({savedRecipes.length})
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <TabsContent value="my-recipes">
                {recipes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <Plus className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No recipes yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first recipe to get started</p>
                    <Button onClick={handleCreateRecipe} variant="default">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Recipe
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {recipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.recipeId}
                        recipe={recipe}
                        onEdit={handleEditRecipe}
                        onDelete={handleDeleteRecipe}
                        showActions
                        userId={currentUser.uid}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="saved">
                {savedRecipes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <BookMarked className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No saved recipes</h3>
                    <p className="text-muted-foreground mb-6">Browse the recipe library to save recipes</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {savedRecipes.map((recipe) => (
                      <RecipeCard
                        key={recipe.recipeId}
                        recipe={recipe}
                        showActions={false}
                        userId={currentUser.uid}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>

      {/* Recipe Form Modal */}
      {showForm && (
        <RecipeForm
          userId={currentUser.uid}
          editingRecipe={editingRecipe}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
