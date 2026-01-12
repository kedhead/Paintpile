import {
  RecipeCategory,
  RecipeDifficulty,
  TechniqueCategory,
  PaintRole,
  SurfaceType,
} from './recipe';
import { Paint } from './paint';

/**
 * AI-Generated Recipe Types
 * Used for Claude's recipe generation from photos
 */

/**
 * Ingredient suggested by AI with color matching
 */
export interface GeneratedIngredient {
  hexColor: string;           // Color detected by AI
  colorName: string;          // Descriptive name from AI
  role: PaintRole;            // How this color is used
  matchedPaints?: Paint[];    // Paints matched from database
  notes?: string;             // Application notes from AI
}

/**
 * Step in AI-generated recipe
 */
export interface GeneratedStep {
  stepNumber: number;
  title: string;
  instruction: string;
  paints?: string[];          // Paint names/IDs used in this step
  technique?: TechniqueCategory;
  tips?: string[];
}

/**
 * Complete AI-generated recipe structure
 * This is what Claude returns before user edits
 */
export interface GeneratedRecipe {
  // Recipe metadata
  name: string;
  description: string;
  category: RecipeCategory;
  difficulty: RecipeDifficulty;
  techniques: TechniqueCategory[];
  surfaceType?: SurfaceType;
  estimatedTime?: number;

  // Paint ingredients (5-8 colors)
  ingredients: GeneratedIngredient[];

  // Step-by-step instructions (4-10 steps)
  steps: GeneratedStep[];

  // Additional guidance
  mixingInstructions?: string;
  applicationTips?: string;

  // AI confidence and metadata
  confidence: number;         // 0-1, how confident Claude is
}

/**
 * Request for AI recipe generation
 */
export interface GenerateRecipeRequest {
  userId: string;
  imageUrl: string;           // Must be Firebase Storage URL
  context?: string;           // Optional user context
}

/**
 * Response from AI recipe generation
 */
export interface GenerateRecipeResponse {
  success: boolean;
  data?: {
    recipe: GeneratedRecipe;
    creditsUsed: number;
  };
  error?: string;
}
