import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { PaintRecipe, PaintRecipeFormData } from '@/types/paint-recipe';
import { createTimelineEvent } from './timeline';

/**
 * Create a new paint recipe for a project
 */
export async function createPaintRecipe(
  projectId: string,
  data: PaintRecipeFormData,
  userId?: string
): Promise<string> {
  const recipesRef = collection(db, 'projects', projectId, 'paintRecipes');
  const newRecipeRef = doc(recipesRef);

  const recipe: PaintRecipe = {
    recipeId: newRecipeRef.id,
    projectId,
    name: data.name,
    description: data.description,
    paints: data.paints,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(newRecipeRef, recipe);

  // Create timeline event if userId provided
  if (userId) {
    await createTimelineEvent(projectId, userId, 'recipe_created', {
      recipeId: newRecipeRef.id,
      recipeName: data.name,
      recipeDescription: data.description,
    });
  }

  return newRecipeRef.id;
}

/**
 * Get a single paint recipe by ID
 */
export async function getPaintRecipe(
  projectId: string,
  recipeId: string
): Promise<PaintRecipe | null> {
  const recipeRef = doc(db, 'projects', projectId, 'paintRecipes', recipeId);
  const recipeSnap = await getDoc(recipeRef);

  if (!recipeSnap.exists()) {
    return null;
  }

  return recipeSnap.data() as PaintRecipe;
}

/**
 * Get all paint recipes for a project
 */
export async function getProjectRecipes(projectId: string): Promise<PaintRecipe[]> {
  const recipesRef = collection(db, 'projects', projectId, 'paintRecipes');
  const q = query(recipesRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => doc.data() as PaintRecipe);
}

/**
 * Update an existing paint recipe
 */
export async function updatePaintRecipe(
  projectId: string,
  recipeId: string,
  data: Partial<PaintRecipeFormData>,
  userId?: string
): Promise<void> {
  const recipeRef = doc(db, 'projects', projectId, 'paintRecipes', recipeId);

  await updateDoc(recipeRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });

  // Create timeline event if userId provided
  if (userId && data.name) {
    await createTimelineEvent(projectId, userId, 'recipe_updated', {
      recipeId,
      recipeName: data.name,
      recipeDescription: data.description,
    });
  }
}

/**
 * Delete a paint recipe
 */
export async function deletePaintRecipe(
  projectId: string,
  recipeId: string
): Promise<void> {
  const recipeRef = doc(db, 'projects', projectId, 'paintRecipes', recipeId);
  await deleteDoc(recipeRef);
}
