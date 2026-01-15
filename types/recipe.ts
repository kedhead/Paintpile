import { Timestamp } from 'firebase/firestore';

/**
 * Unified Paint Recipe & Technique System
 * Combines paint mixing recipes with technique documentation
 */

// Paint role in a recipe (from original paint-recipe.ts)
export type PaintRole =
  | 'base'
  | 'highlight'
  | 'shadow'
  | 'midtone'
  | 'glaze'
  | 'wash'
  | 'layer'
  | 'accent';

// Recipe categories
export type RecipeCategory =
  | 'skin-tone'
  | 'metallic'
  | 'fabric'
  | 'leather'
  | 'armor'
  | 'weapon'
  | 'wood'
  | 'stone'
  | 'nmm'           // Non-Metallic Metal
  | 'osl'           // Object Source Lighting
  | 'weathering'
  | 'glow-effect'
  | 'gem'
  | 'base-terrain'
  | 'other';

// Technique categories (from original technique.ts)
export type TechniqueCategory =
  | 'nmm'              // Non-Metallic Metal
  | 'osl'              // Object Source Lighting
  | 'drybrushing'
  | 'layering'
  | 'glazing'
  | 'washing'
  | 'blending'
  | 'feathering'
  | 'stippling'
  | 'wetblending'
  | 'zenithal'
  | 'airbrushing'
  | 'freehand'
  | 'weathering'
  | 'other';

// Difficulty level
export type RecipeDifficulty = 'beginner' | 'intermediate' | 'advanced';

// Surface type the recipe is designed for
export type SurfaceType =
  | 'armor'
  | 'skin'
  | 'fabric'
  | 'leather'
  | 'metal'
  | 'wood'
  | 'stone'
  | 'gem'
  | 'other';

/**
 * Paint ingredient in a recipe
 */
export interface RecipeIngredient {
  paintId: string;
  role: PaintRole;
  ratio?: string;           // "2:1", "thin coat", "3 parts", "50%"
  order: number;            // Application/mixing order
  notes?: string;           // "add gradually", "mix thoroughly"
}

/**
 * Step in a recipe process
 */
export interface RecipeStep {
  stepNumber: number;
  title: string;                    // "Base coat", "First highlight"
  instruction: string;              // Detailed instructions
  photoUrl?: string;                // Photo demonstrating this step
  paints?: string[];                // paintIds used in this step
  technique?: TechniqueCategory;    // Technique used in this step
  tips?: string[];                  // Additional tips for this step
  estimatedTime?: number;           // Minutes for this step
}

/**
 * Global Paint Recipe
 * Shareable recipes that live in the global paintRecipes collection
 */
export interface PaintRecipe {
  recipeId: string;
  userId: string;

  // Basic Info
  name: string;
  description: string;
  category: RecipeCategory;
  difficulty: RecipeDifficulty;

  // Paint ingredients
  ingredients: RecipeIngredient[];

  // Techniques used in this recipe
  techniques: TechniqueCategory[];

  // Step-by-step instructions (optional)
  steps: RecipeStep[];

  // Additional instructions
  mixingInstructions?: string;      // How to mix the paints
  applicationTips?: string;          // Tips for applying

  // Visual results
  resultPhotos: string[];            // URLs of result photos
  resultColor?: string;              // Hex approximation of final color

  // Metadata
  estimatedTime?: number;            // Total time in minutes
  surfaceType?: SurfaceType;         // What surface this is for
  tags?: string[];                   // Additional searchable tags

  // Sharing settings
  isPublic: boolean;                 // Visible to others
  isGlobal: boolean;                 // Available in public library

  // Stats
  saves: number;                     // How many users bookmarked it
  usedInProjects: number;            // How many times used
  likes: number;                     // Like count

  // AI Generation metadata (Phase 3)
  generatedByAI?: boolean;               // True if created by AI
  sourcePhotoUrl?: string;               // Original photo used for generation
  aiGenerationMetadata?: {
    model: string;                       // AI model used (e.g., "claude-3-5-sonnet")
    confidence: number;                  // AI confidence score (0-1)
    creditsUsed: number;                 // Credits consumed
    generatedAt: Timestamp;              // When AI generated this
  };

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * User's saved/bookmarked recipe
 */
export interface SavedRecipe {
  saveId: string;
  userId: string;
  recipeId: string;
  savedAt: Timestamp;
}

/**
 * Recipe usage in a project
 * Links global recipes to specific projects
 */
export interface ProjectRecipeUsage {
  usageId: string;
  projectId: string;
  recipeId: string;              // Reference to global recipe
  appliedTo?: string;            // "Helmet", "Cloak", "Left shoulder", etc.
  photoIds: string[];            // Photos showing this recipe in use
  notes?: string;                // Project-specific notes
  addedAt: Timestamp;
}

/**
 * Form data for creating/editing recipes
 */
export interface RecipeFormData {
  name: string;
  description: string;
  category: RecipeCategory;
  difficulty: RecipeDifficulty;
  ingredients: RecipeIngredient[];
  techniques: TechniqueCategory[];
  steps: RecipeStep[];
  mixingInstructions?: string;
  applicationTips?: string;
  resultColor?: string;
  estimatedTime?: number;
  surfaceType?: SurfaceType;
  tags?: string[];
  isPublic: boolean;
  isGlobal: boolean;
}

/**
 * Recipe search/filter params
 */
export interface RecipeSearchParams {
  query?: string;                // Text search
  category?: RecipeCategory;
  difficulty?: RecipeDifficulty;
  techniques?: TechniqueCategory[];
  surfaceType?: SurfaceType;
  userId?: string;               // Filter by creator
  tags?: string[];
  minLikes?: number;
  sortBy?: 'recent' | 'popular' | 'saves';
}

// Human-readable labels
export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  'skin-tone': 'Skin Tone',
  'metallic': 'Metallic',
  'fabric': 'Fabric/Cloth',
  'leather': 'Leather',
  'armor': 'Armor',
  'weapon': 'Weapon',
  'wood': 'Wood',
  'stone': 'Stone',
  'nmm': 'Non-Metallic Metal',
  'osl': 'Object Source Lighting',
  'weathering': 'Weathering',
  'glow-effect': 'Glow Effect',
  'gem': 'Gem/Crystal',
  'base-terrain': 'Base/Terrain',
  'other': 'Other',
};

export const TECHNIQUE_LABELS: Record<TechniqueCategory, string> = {
  nmm: 'Non-Metallic Metal',
  osl: 'Object Source Lighting',
  drybrushing: 'Drybrushing',
  layering: 'Layering',
  glazing: 'Glazing',
  washing: 'Washing',
  blending: 'Blending',
  feathering: 'Feathering',
  stippling: 'Stippling',
  wetblending: 'Wet Blending',
  zenithal: 'Zenithal Priming',
  airbrushing: 'Airbrushing',
  freehand: 'Freehand',
  weathering: 'Weathering',
  other: 'Other',
};

export const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const SURFACE_TYPE_LABELS: Record<SurfaceType, string> = {
  armor: 'Armor',
  skin: 'Skin',
  fabric: 'Fabric/Cloth',
  leather: 'Leather',
  metal: 'Metal',
  wood: 'Wood',
  stone: 'Stone',
  gem: 'Gem/Crystal',
  other: 'Other',
};

export const PAINT_ROLE_LABELS: Record<PaintRole, string> = {
  base: 'Base Coat',
  highlight: 'Highlight',
  shadow: 'Shadow',
  midtone: 'Midtone',
  glaze: 'Glaze',
  wash: 'Wash',
  layer: 'Layer',
};
