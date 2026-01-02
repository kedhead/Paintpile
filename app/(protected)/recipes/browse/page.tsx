'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPublicRecipes } from '@/lib/firestore/recipes';
import { PaintRecipe, RecipeSearchParams, RECIPE_CATEGORY_LABELS, DIFFICULTY_LABELS, TECHNIQUE_LABELS, SURFACE_TYPE_LABELS } from '@/types/recipe';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Loader2, SlidersHorizontal, X } from 'lucide-react';

export default function RecipeBrowsePage() {
  const { currentUser } = useAuth();
  const [recipes, setRecipes] = useState<PaintRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [selectedSurface, setSelectedSurface] = useState<string>('');
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'saves'>('popular');

  useEffect(() => {
    loadRecipes();
  }, [selectedCategory, selectedDifficulty, selectedSurface, selectedTechniques, sortBy]);

  const loadRecipes = async () => {
    try {
      setLoading(true);

      const searchParams: RecipeSearchParams = {
        query: searchQuery,
        category: selectedCategory as any || undefined,
        difficulty: selectedDifficulty as any || undefined,
        surfaceType: selectedSurface as any || undefined,
        techniques: selectedTechniques.length > 0 ? selectedTechniques as any : undefined,
        sortBy,
      };

      const publicRecipes = await getPublicRecipes(searchParams, 50);
      setRecipes(publicRecipes);
    } catch (error) {
      console.error('Error loading recipes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecipes();
  };

  const toggleTechnique = (technique: string) => {
    setSelectedTechniques(prev =>
      prev.includes(technique)
        ? prev.filter(t => t !== technique)
        : [...prev, technique]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedDifficulty('');
    setSelectedSurface('');
    setSelectedTechniques([]);
    setSortBy('popular');
  };

  const activeFilterCount = [
    selectedCategory,
    selectedDifficulty,
    selectedSurface,
    ...selectedTechniques,
  ].filter(Boolean).length;

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Please log in to browse recipes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Browse Recipes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Discover paint recipes from the community
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search recipes by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="default">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-4 mb-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Filters</h3>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Categories</option>
                    {Object.entries(RECIPE_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Difficulty
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Levels</option>
                    {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Surface Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Surface Type
                  </label>
                  <select
                    value={selectedSurface}
                    onChange={(e) => setSelectedSurface(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">All Surfaces</option>
                    {Object.entries(SURFACE_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Technique Tags */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Techniques
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(TECHNIQUE_LABELS).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleTechnique(value)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedTechniques.includes(value)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <div className="flex gap-2">
              {[
                { value: 'popular', label: 'Most Popular' },
                { value: 'recent', label: 'Most Recent' },
                { value: 'saves', label: 'Most Saved' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as any)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    sortBy === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recipe Grid */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No recipes found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your filters or search terms
            </p>
            {activeFilterCount > 0 && (
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Found {recipes.length} recipe{recipes.length !== 1 ? 's' : ''}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.recipeId}
                  recipe={recipe}
                  userId={currentUser.uid}
                  showActions={false}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
