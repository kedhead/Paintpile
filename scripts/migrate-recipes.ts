/**
 * Migration Script: Project Recipes to Global Recipe System
 *
 * This script migrates old project-scoped recipes to the new unified global recipe system.
 *
 * What it does:
 * 1. Finds all projects with paintRecipes subcollection
 * 2. For each project recipe:
 *    - Creates a new global recipe in paintRecipes collection
 *    - Creates a ProjectRecipeUsage link in the project
 *    - Preserves all original data
 * 3. Leaves old recipes intact (can be deleted manually after verification)
 *
 * Usage:
 *   npx tsx scripts/migrate-recipes.ts
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

// Initialize Firebase Admin
const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('Please download your Firebase Admin SDK private key and place it in the project root.');
  console.error('Download from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

interface OldPaintRecipeEntry {
  paintId: string;
  role: 'base' | 'highlight' | 'shadow' | 'midtone' | 'glaze' | 'wash';
  ratio?: string;
  order: number;
}

interface OldPaintRecipe {
  recipeId: string;
  projectId: string;
  name: string;
  description?: string;
  paints: OldPaintRecipeEntry[];
  createdAt: any;
  updatedAt: any;
}

interface NewRecipeIngredient {
  paintId: string;
  role: 'base' | 'highlight' | 'shadow' | 'midtone' | 'glaze' | 'wash' | 'layer';
  ratio?: string;
  order: number;
  notes?: string;
}

interface MigrationResult {
  totalProjects: number;
  projectsWithRecipes: number;
  totalRecipesMigrated: number;
  errors: string[];
}

async function migrateRecipes(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalProjects: 0,
    projectsWithRecipes: 0,
    totalRecipesMigrated: 0,
    errors: [],
  };

  console.log('🔄 Starting recipe migration...\n');

  try {
    // Get all projects
    const projectsSnapshot = await db.collection('projects').get();
    result.totalProjects = projectsSnapshot.size;

    console.log(`📊 Found ${result.totalProjects} projects\n`);

    for (const projectDoc of projectsSnapshot.docs) {
      const projectId = projectDoc.id;
      const projectData = projectDoc.data();
      const userId = projectData.userId;

      if (!userId) {
        result.errors.push(`Project ${projectId} has no userId`);
        continue;
      }

      // Get recipes for this project
      const recipesSnapshot = await db
        .collection('projects')
        .doc(projectId)
        .collection('paintRecipes')
        .get();

      if (recipesSnapshot.empty) {
        continue;
      }

      result.projectsWithRecipes++;
      console.log(`📦 Project: ${projectData.name || projectId}`);
      console.log(`   Found ${recipesSnapshot.size} recipes to migrate`);

      for (const recipeDoc of recipesSnapshot.docs) {
        try {
          const oldRecipe = recipeDoc.data() as OldPaintRecipe;

          // Create new global recipe
          const newRecipeRef = db.collection('paintRecipes').doc();
          const newRecipeId = newRecipeRef.id;

          // Convert old ingredients to new format
          const ingredients: NewRecipeIngredient[] = oldRecipe.paints.map(paint => ({
            paintId: paint.paintId,
            role: paint.role,
            ratio: paint.ratio,
            order: paint.order,
            notes: undefined,
          }));

          const newRecipe = {
            recipeId: newRecipeId,
            userId,
            name: oldRecipe.name,
            description: oldRecipe.description || '',
            category: 'other' as const, // Default category - users can update
            difficulty: 'beginner' as const, // Default difficulty - users can update
            ingredients,
            techniques: [], // Empty - users can add
            steps: [], // Empty - users can add
            mixingInstructions: '',
            applicationTips: '',
            resultPhotos: [],
            resultColor: undefined,
            estimatedTime: undefined,
            surfaceType: undefined,
            tags: [],
            isPublic: false, // Keep private by default
            isGlobal: false, // Not in global library by default
            saves: 0,
            usedInProjects: 1, // Used in this project
            likes: 0,
            createdAt: oldRecipe.createdAt || FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
          };

          // Create global recipe
          await newRecipeRef.set(newRecipe);

          // Create project recipe usage link
          const usageRef = db
            .collection('projects')
            .doc(projectId)
            .collection('recipeUsages')
            .doc();

          const usage = {
            usageId: usageRef.id,
            projectId,
            recipeId: newRecipeId,
            appliedTo: undefined,
            photoIds: [],
            notes: `Migrated from old recipe: ${oldRecipe.name}`,
            addedAt: oldRecipe.createdAt || FieldValue.serverTimestamp(),
          };

          await usageRef.set(usage);

          result.totalRecipesMigrated++;
          console.log(`   ✅ Migrated: ${oldRecipe.name}`);

        } catch (error: any) {
          const errorMsg = `Failed to migrate recipe ${recipeDoc.id} in project ${projectId}: ${error.message}`;
          result.errors.push(errorMsg);
          console.error(`   ❌ ${errorMsg}`);
        }
      }

      console.log('');
    }

    console.log('✨ Migration complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total projects: ${result.totalProjects}`);
    console.log(`   Projects with recipes: ${result.projectsWithRecipes}`);
    console.log(`   Recipes migrated: ${result.totalRecipesMigrated}`);

    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    console.log('\n📝 Next steps:');
    console.log('   1. Verify migrated recipes at /recipes');
    console.log('   2. Check project recipe usages in project detail pages');
    console.log('   3. Old recipes remain in projects/{projectId}/paintRecipes (safe to delete after verification)');

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  }

  return result;
}

// Run migration
migrateRecipes()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
