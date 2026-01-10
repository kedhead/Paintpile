import { Timestamp } from 'firebase/firestore';

export type PaintRole = 'base' | 'highlight' | 'shadow' | 'midtone' | 'glaze' | 'wash';

export interface PaintRecipeEntry {
  paintId: string;
  role: PaintRole;
  ratio?: string;            // "1:2", "thin coat", "3 parts"
  order: number;             // Application order
}

export interface PaintRecipe {
  recipeId: string;
  projectId: string;
  name: string;              // "Dark skin base", "Gold armor highlight"
  description?: string;
  paints: PaintRecipeEntry[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaintRecipeFormData {
  name: string;
  description?: string;
  paints: PaintRecipeEntry[];
}
