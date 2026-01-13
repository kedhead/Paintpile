'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { recipeSchema, type RecipeFormData } from '@/lib/validation/schemas';
import { PaintRecipe, RECIPE_CATEGORY_LABELS, DIFFICULTY_LABELS, TECHNIQUE_LABELS, PAINT_ROLE_LABELS, SURFACE_TYPE_LABELS } from '@/types/recipe';
import { createRecipe, updateRecipe } from '@/lib/firestore/recipes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagInput } from '@/components/ui/TagInput';
import { PaintSelectorModal } from '@/components/paints/PaintSelectorModal';
import { AIRecipeGenerator } from './AIRecipeGenerator';
import { GeneratedRecipe } from '@/types/ai-recipe';
import { X, Plus, Trash2, GripVertical, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface RecipeFormProps {
  userId: string;
  editingRecipe?: PaintRecipe | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function RecipeForm({ userId, editingRecipe, onClose, onSuccess }: RecipeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaintSelector, setShowPaintSelector] = useState(false);
  const [selectingIngredientIndex, setSelectingIngredientIndex] = useState<number | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiGeneratedPhotoUrl, setAiGeneratedPhotoUrl] = useState<string>('');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    ingredients: true,
    steps: false,
    details: false,
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'other',
      difficulty: 'beginner',
      ingredients: [],
      techniques: [],
      steps: [],
      mixingInstructions: '',
      applicationTips: '',
      resultColor: '',
      estimatedTime: undefined,
      surfaceType: undefined,
      tags: [],
      isPublic: false,
      isGlobal: false,
      sourcePhotoUrl: '',
    },
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient, update: updateIngredient } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({
    control,
    name: 'steps',
  });

  const selectedTechniques = watch('techniques') || [];

  useEffect(() => {
    if (editingRecipe) {
      setValue('name', editingRecipe.name);
      setValue('description', editingRecipe.description);
      setValue('category', editingRecipe.category);
      setValue('difficulty', editingRecipe.difficulty);
      setValue('ingredients', editingRecipe.ingredients);
      setValue('techniques', editingRecipe.techniques);
      setValue('steps', editingRecipe.steps || []);
      setValue('mixingInstructions', editingRecipe.mixingInstructions || '');
      setValue('applicationTips', editingRecipe.applicationTips || '');
      setValue('resultColor', editingRecipe.resultColor || '');
      setValue('estimatedTime', editingRecipe.estimatedTime);
      setValue('surfaceType', editingRecipe.surfaceType);
      setValue('tags', editingRecipe.tags || []);
      setValue('isPublic', editingRecipe.isPublic);
      setValue('isGlobal', editingRecipe.isGlobal);
    }
  }, [editingRecipe, setValue]);

  const handleAddIngredient = () => {
    setSelectingIngredientIndex(ingredientFields.length);
    setShowPaintSelector(true);
  };

  const handlePaintSelected = (paintIds: string[]) => {
    if (selectingIngredientIndex !== null && paintIds.length > 0) {
      const paintId = paintIds[0]; // Take first paint since we're in single-select mode
      const newIngredient = {
        paintId,
        role: 'base' as const,
        ratio: '',
        order: selectingIngredientIndex,
        notes: '',
      };

      if (selectingIngredientIndex < ingredientFields.length) {
        updateIngredient(selectingIngredientIndex, newIngredient);
      } else {
        appendIngredient(newIngredient);
      }
    }
    setShowPaintSelector(false);
    setSelectingIngredientIndex(null);
  };

  const handleAddStep = () => {
    appendStep({
      stepNumber: stepFields.length + 1,
      title: '',
      instruction: '',
      photoUrl: '',
      paints: [],
      tips: [],
      estimatedTime: undefined,
    });
  };

  const toggleTechnique = (technique: string) => {
    const current = selectedTechniques;
    const updated = current.includes(technique as any)
      ? current.filter(t => t !== technique)
      : [...current, technique as any];
    setValue('techniques', updated);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleAIRecipeGenerated = (recipe: GeneratedRecipe, sourcePhotoUrl: string) => {
    console.log('[Recipe Form] AI recipe generated:', recipe);
    console.log('[Recipe Form] Number of ingredients:', recipe.ingredients.length);
    console.log('[Recipe Form] Ingredients with matched paints:', recipe.ingredients.filter(ing => ing.matchedPaints && ing.matchedPaints.length > 0).length);
    console.log('[Recipe Form] Source photo URL:', sourcePhotoUrl);

    // Store the source photo URL for later
    setAiGeneratedPhotoUrl(sourcePhotoUrl);

    // Pre-fill form with AI-generated data
    setValue('name', recipe.name);
    setValue('description', recipe.description);
    setValue('category', recipe.category);
    setValue('difficulty', recipe.difficulty);
    setValue('techniques', recipe.techniques);
    setValue('surfaceType', recipe.surfaceType);
    setValue('estimatedTime', recipe.estimatedTime);
    setValue('mixingInstructions', recipe.mixingInstructions || '');
    setValue('applicationTips', recipe.applicationTips || '');
    setValue('sourcePhotoUrl', sourcePhotoUrl);

    // Convert AI ingredients to form ingredients
    // Auto-select the best matched paint for each color
    const formIngredients = recipe.ingredients
      .filter(ing => ing.matchedPaints && ing.matchedPaints.length > 0)
      .map((ing, index) => ({
        order: index + 1,
        paintId: ing.matchedPaints![0].paintId, // Select best match
        role: ing.role,
        ratio: '',
        notes: ing.notes || `AI suggested: ${ing.colorName}`,
      }));

    console.log('[Recipe Form] Form ingredients created:', formIngredients.length);

    if (formIngredients.length === 0) {
      console.warn('[Recipe Form] WARNING: No ingredients with matched paints!');
      alert('Warning: Could not match any paints for the detected colors. You will need to add paints manually before saving the recipe.');
    }

    setValue('ingredients', formIngredients);

    // Convert AI steps to form steps
    // Note: Don't include estimatedTime - it's optional and omitting it avoids NaN validation errors
    const formSteps = recipe.steps.map((step, index) => ({
      stepNumber: step.stepNumber,
      title: step.title.substring(0, 100), // Schema max 100
      instruction: step.instruction.substring(0, 1000), // Schema max 1000
      photoUrl: '',
      paints: [], // Will be filled when user adds paints
      technique: step.technique,
      tips: (step.tips || []).map(tip => tip.substring(0, 200)), // Schema max 200 per tip
    }));
    setValue('steps', formSteps);

    // Expand sections to show the populated content
    setExpandedSections({
      basic: true,
      ingredients: true,
      steps: true,
      details: true,
    });

    // Scroll to top of modal to show the filled form
    setTimeout(() => {
      const modalContent = document.querySelector('.max-h-\\[90vh\\]');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }, 100);
  };

  const onSubmit = async (data: RecipeFormData) => {
    console.log('[Recipe Form] onSubmit called');
    console.log('[Recipe Form] Form data:', data);

    try {
      setIsSubmitting(true);

      // Normalize data to ensure arrays are never undefined
      const normalizedData = {
        ...data,
        techniques: data.techniques || [],
        steps: data.steps || [],
        tags: data.tags || [],
      };

      console.log('[Recipe Form] Normalized data:', normalizedData);
      console.log('[Recipe Form] User ID:', userId);

      if (editingRecipe) {
        console.log('[Recipe Form] Updating recipe:', editingRecipe.recipeId);
        await updateRecipe(editingRecipe.recipeId, normalizedData);
      } else {
        console.log('[Recipe Form] Creating new recipe');
        await createRecipe(userId, normalizedData);
      }

      console.log('[Recipe Form] Recipe saved successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[Recipe Form] Error saving recipe:', err);
      alert('Failed to save recipe: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (validationErrors: any) => {
    console.error('[Recipe Form] Validation failed!');
    console.error('[Recipe Form] Validation errors:', validationErrors);

    // Build a user-friendly error message
    const errorMessages: string[] = [];

    Object.entries(validationErrors).forEach(([field, error]: [string, any]) => {
      if (Array.isArray(error)) {
        // Field array errors (like steps, ingredients)
        error.forEach((item: any, index: number) => {
          if (item) {
            console.error(`[Recipe Form] Error in ${field}[${index}]:`, item);
            Object.entries(item).forEach(([subField, subError]: [string, any]) => {
              const message = (subError as any)?.message || 'Invalid value';
              console.error(`[Recipe Form]   - ${subField}: ${message}`);
              errorMessages.push(`• ${field}[${index}].${subField}: ${message}`);
            });
          }
        });
      } else {
        const message = error?.message || 'Invalid value';
        errorMessages.push(`• ${field}: ${message}`);
      }
    });

    console.error('[Recipe Form] Total errors:', errorMessages.length);
    console.error('[Recipe Form] Error summary:', errorMessages);

    alert('Please fix the following errors before submitting:\n\n' + errorMessages.slice(0, 10).join('\n') +
      (errorMessages.length > 10 ? `\n\n... and ${errorMessages.length - 10} more errors` : ''));

    // Scroll to first error
    const firstErrorField = Object.keys(validationErrors)[0];
    const element = document.getElementById(firstErrorField);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-card rounded-lg max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* AI Generator Button (only show when creating new recipe) */}
          {!editingRecipe && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Generate with AI
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Let AI analyze a miniature photo and create a complete paint recipe with steps
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAIGenerator(true)}
                    className="border-primary/50 hover:bg-primary/10"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate from Photo
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={(e) => {
              console.log('[Recipe Form] Form onSubmit event triggered!');
              console.log('[Recipe Form] Event:', e);

              // Preprocess data to clean up NaN values before validation
              handleSubmit((data) => {
                // Remove NaN from steps estimatedTime
                if (data.steps) {
                  data.steps = data.steps.map(step => {
                    const cleanedStep = { ...step };
                    if (isNaN(cleanedStep.estimatedTime as any)) {
                      delete cleanedStep.estimatedTime;
                    }
                    return cleanedStep;
                  });
                }
                // Remove NaN from recipe estimatedTime
                if (isNaN(data.estimatedTime as any)) {
                  delete (data as any).estimatedTime;
                }
                return onSubmit(data);
              }, onError)(e);
            }}
            className="space-y-6"
          >
            {/* Basic Info Section */}
            <div className="border border-border rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-t-lg hover:bg-muted transition-colors"
              >
                <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                {expandedSections.basic ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {expandedSections.basic && (
                <div className="p-4 space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
                      Recipe Name *
                    </label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="e.g., Vibrant Red Armor"
                      error={errors.name?.message}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
                      Description *
                    </label>
                    <textarea
                      id="description"
                      {...register('description')}
                      rows={3}
                      placeholder="Describe what this recipe achieves and when to use it..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
                        Category *
                      </label>
                      <select
                        id="category"
                        {...register('category')}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {Object.entries(RECIPE_CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {errors.category && (
                        <p className="mt-1 text-sm text-destructive">{errors.category.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="difficulty" className="block text-sm font-medium text-foreground mb-1">
                        Difficulty *
                      </label>
                      <select
                        id="difficulty"
                        {...register('difficulty')}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {errors.difficulty && (
                        <p className="mt-1 text-sm text-destructive">{errors.difficulty.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Ingredients Section */}
            <div className="border border-border rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('ingredients')}
                className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-t-lg hover:bg-muted transition-colors"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  Paint Ingredients ({ingredientFields.length})
                </h3>
                {expandedSections.ingredients ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {expandedSections.ingredients && (
                <div className="p-4 space-y-4">
                  {ingredientFields.length === 0 && (
                    <p className="text-sm text-muted-foreground">No ingredients added yet. Click "Add Paint" to get started.</p>
                  )}

                  {ingredientFields.map((field, index) => (
                    <div key={field.id} className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Paint Role *
                            </label>
                            <select
                              {...register(`ingredients.${index}.role` as const)}
                              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              {Object.entries(PAINT_ROLE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                              Ratio/Amount
                            </label>
                            <Input
                              {...register(`ingredients.${index}.ratio` as const)}
                              placeholder="e.g., 2:1, thin coat"
                              className="text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            Notes
                          </label>
                          <Input
                            {...register(`ingredients.${index}.notes` as const)}
                            placeholder="e.g., Add gradually, mix thoroughly"
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="text-destructive hover:text-destructive/80 p-2"
                        title="Remove ingredient"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddIngredient}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Paint
                  </Button>

                  {errors.ingredients && (
                    <p className="text-sm text-destructive">{errors.ingredients.message}</p>
                  )}
                </div>
              )}
            </div>

            {/* Steps Section */}
            <div className="border border-border rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('steps')}
                className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-t-lg hover:bg-muted transition-colors"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  Step-by-Step Instructions ({stepFields.length})
                </h3>
                {expandedSections.steps ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {expandedSections.steps && (
                <div className="p-4 space-y-4">
                  {stepFields.length === 0 && (
                    <p className="text-sm text-muted-foreground">No steps added yet. Optional but recommended for detailed recipes.</p>
                  )}

                  {stepFields.map((field, index) => (
                    <div key={field.id} className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground">Step {index + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeStep(index)}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Title *
                        </label>
                        <Input
                          {...register(`steps.${index}.title` as const)}
                          placeholder="e.g., Apply base coat"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Instructions *
                        </label>
                        <textarea
                          {...register(`steps.${index}.instruction` as const)}
                          rows={3}
                          placeholder="Detailed instructions for this step..."
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          Estimated Time (minutes)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          {...register(`steps.${index}.estimatedTime` as const, { valueAsNumber: true })}
                          placeholder="15"
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddStep}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                  </Button>
                </div>
              )}
            </div>

            {/* Additional Details Section */}
            <div className="border border-border rounded-lg">
              <button
                type="button"
                onClick={() => toggleSection('details')}
                className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-t-lg hover:bg-muted transition-colors"
              >
                <h3 className="text-lg font-semibold text-foreground">Additional Details</h3>
                {expandedSections.details ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>

              {expandedSections.details && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Techniques Used
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(TECHNIQUE_LABELS).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleTechnique(value)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            selectedTechniques.includes(value as any)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mixingInstructions" className="block text-sm font-medium text-foreground mb-1">
                      Mixing Instructions
                    </label>
                    <textarea
                      id="mixingInstructions"
                      {...register('mixingInstructions')}
                      rows={3}
                      placeholder="How to mix the paints together..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="applicationTips" className="block text-sm font-medium text-foreground mb-1">
                      Application Tips
                    </label>
                    <textarea
                      id="applicationTips"
                      {...register('applicationTips')}
                      rows={3}
                      placeholder="Tips for applying this recipe..."
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="surfaceType" className="block text-sm font-medium text-foreground mb-1">
                        Surface Type
                      </label>
                      <select
                        id="surfaceType"
                        {...register('surfaceType')}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select surface type...</option>
                        {Object.entries(SURFACE_TYPE_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="estimatedTime" className="block text-sm font-medium text-foreground mb-1">
                        Total Time (minutes)
                      </label>
                      <Input
                        id="estimatedTime"
                        type="number"
                        min="0"
                        {...register('estimatedTime', { valueAsNumber: true })}
                        placeholder="60"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="resultColor" className="block text-sm font-medium text-foreground mb-1">
                      Result Color
                    </label>
                    <div className="flex gap-2 items-center">
                      {(() => {
                        const colorValue = watch('resultColor');
                        const isValidHex = colorValue && /^#[0-9A-Fa-f]{6}$/.test(colorValue);
                        return isValidHex ? (
                          <Input
                            id="resultColor"
                            type="color"
                            {...register('resultColor')}
                            className="w-20 h-10 p-1"
                          />
                        ) : (
                          <div className="w-20 h-10 bg-muted border border-border rounded flex items-center justify-center text-xs text-muted-foreground">
                            N/A
                          </div>
                        );
                      })()}
                      <Input
                        {...register('resultColor')}
                        placeholder="#FF6600"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      Tags
                    </label>
                    <Controller
                      name="tags"
                      control={control}
                      render={({ field }) => (
                        <TagInput
                          tags={field.value || []}
                          onChange={field.onChange}
                          placeholder="Add searchable tags..."
                        />
                      )}
                    />
                    {errors.tags && (
                      <p className="mt-1 text-sm text-destructive">{errors.tags.message}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sharing Settings */}
            <div className="border border-border rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Sharing Settings</h3>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  {...register('isPublic')}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="isPublic" className="text-sm text-foreground">
                  Make this recipe public (visible to others)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isGlobal"
                  {...register('isGlobal')}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="isGlobal" className="text-sm text-foreground">
                  Add to global recipe library (discoverable by all users)
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                type="submit"
                variant="default"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="flex-1"
                onClick={(e) => {
                  console.log('[Recipe Form] Submit button clicked!');
                  console.log('[Recipe Form] Event:', e);
                  console.log('[Recipe Form] Button type:', e.currentTarget.type);
                }}
              >
                {editingRecipe ? 'Save Changes' : 'Create Recipe'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Paint Selector Modal */}
      {showPaintSelector && (
        <PaintSelectorModal
          onSelectionChange={handlePaintSelected}
          onClose={() => {
            setShowPaintSelector(false);
            setSelectingIngredientIndex(null);
          }}
          multiSelect={false}
        />
      )}

      {/* AI Recipe Generator Modal */}
      {showAIGenerator && (
        <AIRecipeGenerator
          onClose={() => setShowAIGenerator(false)}
          onRecipeGenerated={handleAIRecipeGenerated}
        />
      )}
    </>
  );
}
