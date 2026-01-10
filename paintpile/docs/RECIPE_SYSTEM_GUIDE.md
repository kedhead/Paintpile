# PaintPile Recipe System - Complete Guide

This guide covers the unified Paint Recipe & Technique system in PaintPile, which combines paint mixing recipes with painting technique documentation.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Creating Recipes](#creating-recipes)
3. [Managing Your Recipes](#managing-your-recipes)
4. [Saving and Sharing Recipes](#saving-and-sharing-recipes)
5. [Using Recipes in Projects](#using-recipes-in-projects)
6. [Recipe Structure](#recipe-structure)
7. [Migration from Old System](#migration-from-old-system)

---

## Quick Start

### What are Recipes?

Recipes in PaintPile are comprehensive guides for achieving specific paint effects. They include:
- **Paint ingredients** with roles (base, highlight, shadow, etc.)
- **Step-by-step instructions** for application
- **Techniques** used (drybrushing, layering, NMM, OSL, etc.)
- **Mixing instructions** and application tips
- **Visual previews** of the final result

### Key Features

- **Personal Library**: Create and manage your own recipes
- **Global Library**: Browse and save recipes from other users
- **Project Integration**: Link recipes to specific projects
- **Searchable**: Filter by category, difficulty, techniques, and more
- **Shareable**: Make recipes public for the community

---

## Creating Recipes

### Accessing the Recipe Creator

1. Go to `/recipes` (accessible from sidebar)
2. Click **"New Recipe"** button
3. Fill out the recipe form

### Basic Information

**Required Fields**:
- **Name**: Clear, descriptive name (e.g., "Vibrant Red Armor", "Realistic Skin Tone")
- **Description**: What this recipe achieves and when to use it
- **Category**: Type of surface or effect
  - Skin Tone, Metallic, Fabric, Leather, Armor, Weapon
  - Wood, Stone, Gem/Crystal, Base/Terrain
  - NMM (Non-Metallic Metal), OSL (Object Source Lighting)
  - Weathering, Glow Effect, Other
- **Difficulty**: Beginner, Intermediate, or Advanced

### Paint Ingredients

Add paints used in the recipe:

1. Click **"Add Paint"**
2. Select paint from the paint library
3. Choose **paint role**:
   - **Base Coat**: Foundation layer
   - **Highlight**: Bright areas
   - **Shadow**: Dark areas
   - **Midtone**: Middle values
   - **Glaze**: Transparent layers
   - **Wash**: Thinned paint for recesses
   - **Layer**: General layering paint

4. Optional: Add **ratio/amount** (e.g., "2:1", "thin coat", "3 parts")
5. Optional: Add **notes** (e.g., "Add gradually", "Mix thoroughly")

**Best Practices**:
- Add paints in the order they'll be used
- Include all paints, even primers and varnishes
- Specify mixing ratios for custom mixes

### Step-by-Step Instructions (Optional but Recommended)

Break down the process into clear steps:

1. Click **"Add Step"**
2. Fill in:
   - **Title**: Brief step description (e.g., "Apply base coat")
   - **Instructions**: Detailed how-to for this step
   - **Estimated Time**: Minutes needed for this step
   - **Technique**: Specific technique used (optional)

**Example Step**:
```
Title: Base Coat Application
Instructions: Apply two thin coats of Mephiston Red to all armor plates.
Let each coat dry completely before applying the next. Ensure even coverage.
Estimated Time: 15 minutes
Technique: Layering
```

### Techniques

Select all techniques used in this recipe:
- NMM (Non-Metallic Metal)
- OSL (Object Source Lighting)
- Drybrushing, Layering, Glazing, Washing
- Blending, Feathering, Stippling, Wet Blending
- Zenithal Priming, Airbrushing, Freehand
- Weathering, Other

### Additional Details (Optional)

**Mixing Instructions**: How to combine paints before application

**Application Tips**: Pro tips for best results

**Surface Type**: What surface this recipe is designed for (armor, skin, fabric, etc.)

**Total Time**: Estimated total time in minutes

**Result Color**: Color picker or hex code for final result preview

**Tags**: Additional searchable keywords

### Sharing Settings

**Make recipe public**: Allow others to view and save your recipe

**Add to global library**: Make recipe discoverable in browse/search

**Privacy Options**:
- Private: Only you can see it
- Public: Visible to others when they view your profile
- Global: Appears in public recipe library for all users to discover

---

## Managing Your Recipes

### Your Recipe Library

Access at `/recipes`:
- **My Recipes Tab**: Recipes you've created
- **Saved Tab**: Recipes you've bookmarked from others

### Editing Recipes

1. Go to **My Recipes** tab
2. Click **Edit** on any recipe
3. Make changes
4. Click **Save Changes**

### Deleting Recipes

1. Go to **My Recipes** tab
2. Click the trash icon on any recipe
3. Confirm deletion

**Note**: Deleting a recipe removes it from the global library and any project links.

### Organizing Recipes

**Tips for Organization**:
- Use clear, descriptive names
- Add detailed descriptions
- Tag with relevant keywords
- Categorize correctly
- Specify difficulty accurately
- Include result photos when possible

---

## Saving and Sharing Recipes

### Saving Others' Recipes

**From Browse Page** (coming soon):
1. Go to public recipe library
2. Click bookmark icon on any recipe
3. Recipe appears in your "Saved" tab

**From User Profiles**:
1. Visit a user's profile
2. Browse their public recipes
3. Click bookmark to save

### Liking Recipes

Show appreciation for great recipes:
- Click the heart icon
- Like count is visible to all users
- Helps surface popular recipes

### Sharing Your Recipes

**Make Recipe Public**:
1. Edit your recipe
2. Check "Make this recipe public"
3. Check "Add to global recipe library" for maximum visibility
4. Save changes

**Share Links** (coming soon):
- Direct URL to recipe detail page
- Shareable outside PaintPile

---

## Using Recipes in Projects

### Linking Recipes to Projects

**From Project Detail Page** (coming soon):
1. Go to your project
2. Click "Add Recipe"
3. Select from your recipes or saved recipes
4. Optional: Specify where applied ("Helmet", "Cloak", etc.)
5. Optional: Add project-specific notes

### Recipe Usage Tracking

The system automatically tracks:
- How many projects use each recipe
- Which paints from the recipe were used
- Photos showing the recipe in action

### Project Recipe Notes

Add context-specific notes:
- "Applied to all armor plates"
- "Used 3 coats instead of 2"
- "Modified ratio to 3:1 for more contrast"

---

## Recipe Structure

### Data Model

```typescript
interface PaintRecipe {
  recipeId: string;
  userId: string;

  // Basic Info
  name: string;
  description: string;
  category: RecipeCategory;
  difficulty: RecipeDifficulty;

  // Paints & Techniques
  ingredients: RecipeIngredient[];
  techniques: TechniqueCategory[];

  // Instructions
  steps: RecipeStep[];
  mixingInstructions?: string;
  applicationTips?: string;

  // Metadata
  resultPhotos: string[];
  resultColor?: string;
  estimatedTime?: number;
  surfaceType?: SurfaceType;
  tags?: string[];

  // Sharing
  isPublic: boolean;
  isGlobal: boolean;

  // Stats
  saves: number;
  usedInProjects: number;
  likes: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Categories

**Recipe Categories**:
- Skin Tone, Metallic, Fabric, Leather
- Armor, Weapon, Wood, Stone
- NMM, OSL, Weathering, Glow Effect
- Gem/Crystal, Base/Terrain, Other

**Techniques**:
- NMM (Non-Metallic Metal)
- OSL (Object Source Lighting)
- Drybrushing, Layering, Glazing, Washing
- Blending, Feathering, Stippling, Wet Blending
- Zenithal Priming, Airbrushing, Freehand
- Weathering, Other

**Difficulty Levels**:
- Beginner: Simple techniques, few paints
- Intermediate: Multiple steps, some advanced techniques
- Advanced: Complex techniques, precise application

---

## Migration from Old System

### Old System Overview

Previously, recipes and techniques were:
- Stored per-project (subcollections)
- Not shareable between projects
- Separate recipe and technique entities
- Limited discoverability

### New System Benefits

- **Global recipes**: Create once, use everywhere
- **Unified model**: Recipes include techniques
- **Shareable**: Public library for discovery
- **Reusable**: Link to multiple projects
- **Social features**: Likes, saves, comments (coming)

### Running the Migration Script

**Prerequisites**:
1. Download Firebase Admin SDK private key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` in project root
2. Install dependencies: `npm install`

**Run Migration**:
```bash
npm run migrate:recipes
```

**What it does**:
1. Finds all projects with old paintRecipes subcollection
2. For each recipe:
   - Creates a new global recipe in `paintRecipes` collection
   - Creates a `ProjectRecipeUsage` link in the project
   - Preserves all original data
3. Old recipes remain intact for safety (delete manually after verification)

**After Migration**:
1. Check `/recipes` to see migrated recipes
2. Verify recipe links in project detail pages
3. Old recipes in `projects/{id}/paintRecipes` can be deleted once verified

**Migration Stats**:
The script outputs:
- Total projects scanned
- Projects with recipes found
- Total recipes migrated
- Any errors encountered

**Note**: Migration is safe to run multiple times (creates new global recipes each time, so run only once in production).

---

## Best Practices

### Creating Great Recipes

1. **Be Specific**: Include exact paints, ratios, and techniques
2. **Add Steps**: Break complex processes into manageable steps
3. **Include Photos**: Show the result or step-by-step progress
4. **Test First**: Create recipe after you've successfully used it
5. **Update**: Refine recipes based on results

### Naming Conventions

**Good Names**:
- "Realistic Caucasian Skin Tone"
- "Weathered Brass NMM"
- "Vibrant Red Power Armor"
- "Glowing Green OSL Effect"

**Avoid**:
- "Recipe 1"
- "Test"
- "Red paint mix"

### Tagging

Use descriptive tags:
- Army/game system: "warhammer", "d&d", "infinity"
- Faction: "space marines", "elves", "orks"
- Effect: "battle damage", "glow", "rust"
- Technique: "smooth blend", "quick paint"

---

## Troubleshooting

### Recipe Not Saving

**Problem**: Recipe form shows errors or doesn't save

**Solution**:
1. Check all required fields are filled
2. Ensure at least one paint ingredient is added
3. Verify description is not too long (500 char max)
4. Check browser console for specific errors

### Can't Find Saved Recipe

**Problem**: Recipe doesn't appear in "Saved" tab

**Solution**:
1. Check you're logged in as correct user
2. Verify recipe is still public (creator may have deleted or made private)
3. Try refreshing the page

### Paint Selector Not Working

**Problem**: Can't select paints for ingredients

**Solution**:
1. Ensure paint library is loaded (go to /paints first)
2. Check browser console for errors
3. Try creating a custom paint if specific paint is missing

---

## Future Features

### Planned Enhancements

- **Recipe Browse Page**: Public library with search and filters
- **Recipe Detail Page**: Full recipe view with comments
- **Project Integration**: Easy recipe application to projects
- **Recipe Variations**: Fork and modify existing recipes
- **Recipe Collections**: Group related recipes
- **Print-Friendly**: Export recipes as PDF
- **Video Links**: Add YouTube tutorial links
- **Community Ratings**: Rate and review recipes

---

## Quick Reference

### Admin URLs

- **My Recipes**: https://www.paintpile.com/recipes
- **Create Recipe**: Click "New Recipe" button on recipes page
- **Edit Recipe**: Click "Edit" on your recipe cards

### Keyboard Shortcuts

(Coming soon)

### API Reference

(For developers - coming soon)

---

## Support

**Issues or Questions?**

- Check this guide first
- Look at browser console for errors (F12)
- Verify Firestore rules are deployed
- Check that paints are loaded in paint library

**For recipe creation help**:
- Start with simple recipes (few paints, no steps)
- Add complexity gradually
- Use existing recipes as templates
- Test in projects before sharing publicly

---

**Last Updated**: January 2026
**Feature Status**: Core functionality complete, browse/search/project integration coming soon

## System Architecture

### Collections

**Global Recipes**:
- Collection: `paintRecipes`
- Security: Anyone can read public recipes, only owners can edit

**Saved Recipes**:
- Subcollection: `users/{userId}/savedRecipes/{recipeId}`
- Security: Only owner can read/write

**Project Recipe Usages**:
- Subcollection: `projects/{projectId}/recipeUsages/{usageId}`
- Security: Follows project visibility rules

### Indexes Required

Already configured in `firestore.rules`:
- `paintRecipes` by public/createdAt
- `paintRecipes` by userId/createdAt
- `paintRecipes` by category/difficulty

---

## Contributing

When adding recipes to the public library:

1. Ensure recipe is tested and works
2. Use clear, descriptive names
3. Add comprehensive descriptions
4. Include all paints used
5. Specify techniques accurately
6. Add result photos when possible
7. Tag appropriately for search

**Quality over quantity**: One great recipe is better than ten incomplete ones.

---

**Happy Painting!** 🎨
