'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRecipes, deleteRecipe, getUserSavedRecipes } from '@/lib/firestore/recipes';
import { PaintRecipe } from '@/types/recipe';
import { RecipeForm } from '@/components/recipes/RecipeForm';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/Button';
import { Plus, Loader2, BookMarked } from 'lucide-react';

export default function RecipesPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<PaintRecipe[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<PaintRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<PaintRecipe | null>(null);
  const [activeTab, setActiveTab] = useState<'my-recipes' | 'saved'>('my-recipes');

  useEffect(() => {
    if (user) {
      loadRecipes();
    }
  }, [user]);

  const loadRecipes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [myRecipes, saved] = await Promise.all([
        getUserRecipes(user.uid),
        getUserSavedRecipes(user.uid),
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to view your recipes.</p>
      </div>
    );
  }

  const displayedRecipes = activeTab === 'my-recipes' ? recipes : savedRecipes;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
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

          {/* Tabs */}
          <div className="flex gap-4 mt-6">
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
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === 'saved'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <BookMarked className="h-4 w-4" />
              Saved ({savedRecipes.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displayedRecipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              {activeTab === 'my-recipes' ? (
                <Plus className="h-8 w-8 text-muted-foreground" />
              ) : (
                <BookMarked className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {activeTab === 'my-recipes' ? 'No recipes yet' : 'No saved recipes'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {activeTab === 'my-recipes'
                ? 'Create your first recipe to get started'
                : 'Browse the recipe library to save recipes'}
            </p>
            {activeTab === 'my-recipes' && (
              <Button onClick={handleCreateRecipe} variant="default">
                <Plus className="h-4 w-4 mr-2" />
                Create Recipe
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.recipeId}
                recipe={recipe}
                onEdit={activeTab === 'my-recipes' ? handleEditRecipe : undefined}
                onDelete={activeTab === 'my-recipes' ? handleDeleteRecipe : undefined}
                showActions={activeTab === 'my-recipes'}
                userId={user.uid}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recipe Form Modal */}
      {showForm && (
        <RecipeForm
          userId={user.uid}
          editingRecipe={editingRecipe}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
