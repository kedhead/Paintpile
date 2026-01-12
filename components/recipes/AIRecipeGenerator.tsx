'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GeneratedRecipe, GenerateRecipeResponse } from '@/types/ai-recipe';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Upload, Sparkles, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { OPERATION_COSTS, creditsToDollars } from '@/lib/ai/constants';

interface AIRecipeGeneratorProps {
  onClose: () => void;
  onRecipeGenerated: (recipe: GeneratedRecipe, sourcePhotoUrl: string) => void;
  projectId?: string; // If generating from a project photo
}

type WizardStep = 'select-photo' | 'add-context' | 'generating' | 'preview';

export function AIRecipeGenerator({
  onClose,
  onRecipeGenerated,
  projectId,
}: AIRecipeGeneratorProps) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<WizardStep>('select-photo');
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [context, setContext] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string>('');
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null);

  const costInCredits = OPERATION_COSTS.recipeGeneration;
  const costInDollars = creditsToDollars(costInCredits);

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be smaller than 10MB');
      return;
    }

    setSelectedImageFile(file);
    setError('');

    // Upload to Firebase Storage
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', currentUser?.uid || '');

      const response = await fetch('/api/upload/temp-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setSelectedImageUrl(data.url);
      setStep('add-context');
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Generate recipe
  const handleGenerate = async () => {
    if (!selectedImageUrl || !currentUser) {
      setError('Missing required information');
      return;
    }

    setIsGenerating(true);
    setError('');
    setStep('generating');

    try {
      console.log('[AI Recipe] Starting generation');
      console.log('[AI Recipe] Image URL:', selectedImageUrl);
      console.log('[AI Recipe] User ID:', currentUser.uid);
      console.log('[AI Recipe] Context:', context.trim() || 'none');

      const response = await fetch('/api/ai/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.uid,
          imageUrl: selectedImageUrl,
          context: context.trim() || undefined,
        }),
      });

      console.log('[AI Recipe] Response status:', response.status);

      const data: GenerateRecipeResponse = await response.json();
      console.log('[AI Recipe] Response data:', data);

      if (!data.success) {
        // Show full error details in development
        const errorDetails = (data as any).details || (data as any).stack;
        if (errorDetails) {
          console.error('[AI Recipe] Error details:', errorDetails);
        }
        throw new Error(data.error || 'Failed to generate recipe');
      }

      if (!data.data?.recipe) {
        throw new Error('No recipe data returned');
      }

      console.log('[AI Recipe] Recipe generated:', data.data.recipe.name);
      setGeneratedRecipe(data.data.recipe);
      setStep('preview');
    } catch (err: any) {
      console.error('[AI Recipe] Client-side error:', err);
      setError(err.message || 'Failed to generate recipe');
      setStep('add-context');
    } finally {
      setIsGenerating(false);
    }
  };

  // Accept generated recipe
  const handleAccept = () => {
    if (generatedRecipe) {
      onRecipeGenerated(generatedRecipe, selectedImageUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Recipe Generator</h2>
              <p className="text-sm text-muted-foreground">
                Generate a paint recipe from a photo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Photo */}
          {step === 'select-photo' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Select a Photo</h3>
                <p className="text-muted-foreground mb-6">
                  Upload a photo of a painted miniature to generate a recipe
                </p>
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="recipe-photo-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="recipe-photo-upload"
                  className="cursor-pointer block"
                >
                  {isUploading ? (
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                  ) : (
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  )}
                  <p className="text-sm font-medium mb-1">
                    {isUploading ? 'Uploading...' : 'Click to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WEBP up to 10MB
                  </p>
                </label>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost per generation:</span>
                  <span className="font-semibold">
                    {costInCredits} credits ({costInDollars})
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Add Context */}
          {step === 'add-context' && (
            <div className="space-y-6">
              {selectedImageUrl && (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={selectedImageUrl}
                    alt="Selected miniature"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  Add Context (Optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="E.g., 'weathered armor with rust effects', 'ethereal glow effect', 'realistic skin tones'..."
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Describe the effect or technique you want to achieve to get better results
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-semibold">
                    {costInCredits} credits ({costInDollars})
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('select-photo');
                    setSelectedImageUrl('');
                    setSelectedImageFile(null);
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedImageUrl || isGenerating}
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Recipe
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Generating */}
          {step === 'generating' && (
            <div className="py-12 text-center space-y-6">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Generating Recipe...</h3>
                <p className="text-muted-foreground">
                  AI is analyzing your photo and creating a detailed paint recipe
                </p>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary animate-pulse" style={{ width: '70%' }} />
                </div>
                <p className="text-xs text-muted-foreground">
                  This may take 15-30 seconds...
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 'preview' && generatedRecipe && (
            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-primary mb-1">Recipe Generated!</h3>
                    <p className="text-sm text-muted-foreground">
                      Review the generated recipe and make any edits before saving
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-lg">{generatedRecipe.name}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {generatedRecipe.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2 font-medium">{generatedRecipe.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Difficulty:</span>
                    <span className="ml-2 font-medium">{generatedRecipe.difficulty}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ingredients:</span>
                    <span className="ml-2 font-medium">{generatedRecipe.ingredients.length} colors</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Steps:</span>
                    <span className="ml-2 font-medium">{generatedRecipe.steps.length} steps</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Confidence:</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${generatedRecipe.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-medium">{Math.round(generatedRecipe.confidence * 100)}%</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('add-context');
                    setGeneratedRecipe(null);
                  }}
                  className="flex-1"
                >
                  Regenerate
                </Button>
                <Button
                  onClick={handleAccept}
                  className="flex-1"
                >
                  Continue Editing
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
