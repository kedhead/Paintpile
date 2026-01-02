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
  where,
  orderBy,
  limit,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import {
  PaintRecipe,
  RecipeFormData,
  SavedRecipe,
  ProjectRecipeUsage,
  RecipeSearchParams,
} from '@/types/recipe';

/**
 * Create a new global paint recipe
 */
export async function createRecipe(
  userId: string,
  data: RecipeFormData
): Promise<string> {
  const recipesRef = collection(db, 'paintRecipes');
  const newRecipeRef = doc(recipesRef);

  const recipe: PaintRecipe = {
    recipeId: newRecipeRef.id,
    userId,
    name: data.name,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    ingredients: data.ingredients,
    techniques: data.techniques,
    steps: data.steps,
    mixingInstructions: data.mixingInstructions,
    applicationTips: data.applicationTips,
    resultPhotos: [],
    resultColor: data.resultColor,
    estimatedTime: data.estimatedTime,
    surfaceType: data.surfaceType,
    tags: data.tags || [],
    isPublic: data.isPublic,
    isGlobal: data.isGlobal,
    saves: 0,
    usedInProjects: 0,
    likes: 0,
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
  };

  await setDoc(newRecipeRef, recipe);

  return newRecipeRef.id;
}

/**
 * Get a single recipe by ID
 */
export async function getRecipe(recipeId: string): Promise<PaintRecipe | null> {
  const recipeRef = doc(db, 'paintRecipes', recipeId);
  const recipeSnap = await getDoc(recipeRef);

  if (!recipeSnap.exists()) {
    return null;
  }

  return recipeSnap.data() as PaintRecipe;
}

/**
 * Get all recipes for a specific user
 */
export async function getUserRecipes(userId: string): Promise<PaintRecipe[]> {
  const recipesRef = collection(db, 'paintRecipes');
  const q = query(
    recipesRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as PaintRecipe);
}

/**
 * Get public recipes (for browse/discovery)
 */
export async function getPublicRecipes(
  searchParams?: RecipeSearchParams,
  limitCount: number = 50
): Promise<PaintRecipe[]> {
  const recipesRef = collection(db, 'paintRecipes');
  let constraints: any[] = [where('isPublic', '==', true)];

  // Add filters
  if (searchParams?.category) {
    constraints.push(where('category', '==', searchParams.category));
  }
  if (searchParams?.difficulty) {
    constraints.push(where('difficulty', '==', searchParams.difficulty));
  }
  if (searchParams?.surfaceType) {
    constraints.push(where('surfaceType', '==', searchParams.surfaceType));
  }
  if (searchParams?.userId) {
    constraints.push(where('userId', '==', searchParams.userId));
  }

  // Add sorting
  const sortBy = searchParams?.sortBy || 'recent';
  if (sortBy === 'recent') {
    constraints.push(orderBy('createdAt', 'desc'));
  } else if (sortBy === 'popular') {
    constraints.push(orderBy('likes', 'desc'));
  } else if (sortBy === 'saves') {
    constraints.push(orderBy('saves', 'desc'));
  }

  constraints.push(limit(limitCount));

  const q = query(recipesRef, ...constraints);
  const querySnapshot = await getDocs(q);

  let recipes = querySnapshot.docs.map((doc) => doc.data() as PaintRecipe);

  // Client-side filtering for more complex queries
  if (searchParams?.query) {
    const searchLower = searchParams.query.toLowerCase();
    recipes = recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  }

  if (searchParams?.techniques && searchParams.techniques.length > 0) {
    recipes = recipes.filter((r) =>
      searchParams.techniques!.some((t) => r.techniques.includes(t))
    );
  }

  if (searchParams?.tags && searchParams.tags.length > 0) {
    recipes = recipes.filter((r) =>
      searchParams.tags!.some((tag) => r.tags?.includes(tag))
    );
  }

  return recipes;
}

/**
 * Update an existing recipe
 */
export async function updateRecipe(
  recipeId: string,
  data: Partial<RecipeFormData>
): Promise<void> {
  const recipeRef = doc(db, 'paintRecipes', recipeId);

  await updateDoc(recipeRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a recipe
 */
export async function deleteRecipe(recipeId: string): Promise<void> {
  const recipeRef = doc(db, 'paintRecipes', recipeId);
  await deleteDoc(recipeRef);

  // TODO: Also delete associated saves and project usages
}

/**
 * Update recipe photos
 */
export async function updateRecipePhotos(
  recipeId: string,
  photoUrls: string[]
): Promise<void> {
  const recipeRef = doc(db, 'paintRecipes', recipeId);

  await updateDoc(recipeRef, {
    resultPhotos: photoUrls,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Increment recipe like count
 */
export async function likeRecipe(recipeId: string): Promise<void> {
  const recipeRef = doc(db, 'paintRecipes', recipeId);

  await updateDoc(recipeRef, {
    likes: increment(1),
  });
}

/**
 * Decrement recipe like count
 */
export async function unlikeRecipe(recipeId: string): Promise<void> {
  const recipeRef = doc(db, 'paintRecipes', recipeId);

  await updateDoc(recipeRef, {
    likes: increment(-1),
  });
}

// =============================================================================
// SAVED RECIPES (Bookmarking)
// =============================================================================

/**
 * Save/bookmark a recipe
 */
export async function saveRecipe(
  userId: string,
  recipeId: string
): Promise<void> {
  const batch = writeBatch(db);

  // Add to user's saved recipes
  const saveRef = doc(db, 'users', userId, 'savedRecipes', recipeId);
  const savedRecipe: SavedRecipe = {
    saveId: recipeId,
    userId,
    recipeId,
    savedAt: serverTimestamp() as any,
  };

  batch.set(saveRef, savedRecipe);

  // Increment recipe save count
  const recipeRef = doc(db, 'paintRecipes', recipeId);
  batch.update(recipeRef, {
    saves: increment(1),
  });

  await batch.commit();
}

/**
 * Unsave/unbookmark a recipe
 */
export async function unsaveRecipe(
  userId: string,
  recipeId: string
): Promise<void> {
  const batch = writeBatch(db);

  // Remove from user's saved recipes
  const saveRef = doc(db, 'users', userId, 'savedRecipes', recipeId);
  batch.delete(saveRef);

  // Decrement recipe save count
  const recipeRef = doc(db, 'paintRecipes', recipeId);
  batch.update(recipeRef, {
    saves: increment(-1),
  });

  await batch.commit();
}

/**
 * Check if user has saved a recipe
 */
export async function isRecipeSaved(
  userId: string,
  recipeId: string
): Promise<boolean> {
  const saveRef = doc(db, 'users', userId, 'savedRecipes', recipeId);
  const saveSnap = await getDoc(saveRef);

  return saveSnap.exists();
}

/**
 * Get all recipes saved by a user
 */
export async function getUserSavedRecipes(
  userId: string
): Promise<PaintRecipe[]> {
  const savedRecipesRef = collection(db, 'users', userId, 'savedRecipes');
  const q = query(savedRecipesRef, orderBy('savedAt', 'desc'));
  const querySnapshot = await getDocs(q);

  // Get full recipe data for each saved recipe
  const recipePromises = querySnapshot.docs.map(async (doc) => {
    const savedRecipe = doc.data() as SavedRecipe;
    return getRecipe(savedRecipe.recipeId);
  });

  const recipes = await Promise.all(recipePromises);
  return recipes.filter((r) => r !== null) as PaintRecipe[];
}

// =============================================================================
// PROJECT RECIPE USAGE
// =============================================================================

/**
 * Link a recipe to a project
 */
export async function addRecipeToProject(
  projectId: string,
  recipeId: string,
  appliedTo?: string,
  notes?: string
): Promise<string> {
  const batch = writeBatch(db);

  // Create project usage record
  const usageRef = doc(collection(db, 'projects', projectId, 'recipeUsages'));
  const usage: ProjectRecipeUsage = {
    usageId: usageRef.id,
    projectId,
    recipeId,
    appliedTo,
    photoIds: [],
    notes,
    addedAt: serverTimestamp() as any,
  };

  batch.set(usageRef, usage);

  // Increment recipe usage count
  const recipeRef = doc(db, 'paintRecipes', recipeId);
  batch.update(recipeRef, {
    usedInProjects: increment(1),
  });

  await batch.commit();

  return usageRef.id;
}

/**
 * Remove a recipe from a project
 */
export async function removeRecipeFromProject(
  projectId: string,
  usageId: string,
  recipeId: string
): Promise<void> {
  const batch = writeBatch(db);

  // Delete usage record
  const usageRef = doc(db, 'projects', projectId, 'recipeUsages', usageId);
  batch.delete(usageRef);

  // Decrement recipe usage count
  const recipeRef = doc(db, 'paintRecipes', recipeId);
  batch.update(recipeRef, {
    usedInProjects: increment(-1),
  });

  await batch.commit();
}

/**
 * Get all recipes used in a project
 */
export async function getProjectRecipes(
  projectId: string
): Promise<{ usage: ProjectRecipeUsage; recipe: PaintRecipe | null }[]> {
  const usagesRef = collection(db, 'projects', projectId, 'recipeUsages');
  const q = query(usagesRef, orderBy('addedAt', 'desc'));
  const querySnapshot = await getDocs(q);

  const usages = querySnapshot.docs.map((doc) => doc.data() as ProjectRecipeUsage);

  // Fetch full recipe data
  const results = await Promise.all(
    usages.map(async (usage) => ({
      usage,
      recipe: await getRecipe(usage.recipeId),
    }))
  );

  return results;
}

/**
 * Update project recipe usage (add notes, change appliedTo, etc.)
 */
export async function updateProjectRecipeUsage(
  projectId: string,
  usageId: string,
  data: Partial<Pick<ProjectRecipeUsage, 'appliedTo' | 'notes' | 'photoIds'>>
): Promise<void> {
  const usageRef = doc(db, 'projects', projectId, 'recipeUsages', usageId);

  await updateDoc(usageRef, data);
}
