# PaintPile Paint Database - Complete Guide

This guide covers all paint database features in PaintPile, including management, importing, and future web scraping capabilities.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Managing the Paint Database](#managing-the-paint-database)
3. [Importing Paints from CSV](#importing-paints-from-csv)
4. [Adding Paints Manually](#adding-paints-manually)
5. [Custom User Paints](#custom-user-paints)
6. [Web Scrapers (Future Use)](#web-scrapers-future-use)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Current Database Status
- **301 paints** in the comprehensive collection
- Includes: Army Painter Fanatic, Citadel, Vallejo, ProAcryl, Reaper MSP, Scale75

### Admin Pages
- **Manage Paints**: `/admin/manage-paints` - Clear and reseed database
- **Import Paints**: `/admin/import-paints` - Upload CSV files
- **Paint Library**: `/paints` - View all paints
- **Admin Dashboard**: `/admin` - Access all admin tools

---

## Managing the Paint Database

### Clear and Reseed

**Location**: `/admin/manage-paints`

**When to use**:
- Starting fresh with the comprehensive paint collection
- Replacing old/incomplete paint data
- After updating the comprehensive paints file

**How to use**:
1. Go to `/admin/manage-paints`
2. Click **"Clear and Reseed Database (Recommended)"**
3. Confirm the action
4. Wait for completion (deletes old paints, adds 301 new ones)

**What it does**:
- Deletes ALL existing paints from the `paints` collection
- Imports all paints from `lib/data/comprehensive-paints.ts`
- Uses batched writes for performance (500 paints per batch)

### Individual Operations

**Clear All Paints** - Deletes all paints without adding new ones
**Seed Paints Only** - Adds comprehensive paints (will fail if paints already exist)

---

## Importing Paints from CSV

### Overview

**Location**: `/admin/import-paints`

CSV import is the **most reliable way** to add new paints from any manufacturer.

### CSV Format

Your CSV file must have exactly 4 columns:

```csv
brand,name,hexColor,type
Citadel,Abaddon Black,#000000,base
Vallejo Model Color,Black,#000000,base
Army Painter Fanatic,Matt Black,#1A1A1A,base
```

**Column Requirements**:

| Column | Description | Example | Required |
|--------|-------------|---------|----------|
| `brand` | Paint brand name | `"Citadel"`, `"Vallejo Model Color"` | Yes |
| `name` | Paint name | `"Abaddon Black"` | Yes |
| `hexColor` | Hex color code (with #) | `#000000`, `#FF6600` | Yes |
| `type` | Paint type | `base`, `layer`, `shade`, `metallic`, `contrast`, `technical` | Yes |

### Valid Paint Types

- `base` - Base coat paints
- `layer` - Layer/highlight paints
- `shade` - Washes/inks/shades
- `metallic` - Metallic paints
- `contrast` - Contrast/speed paints
- `technical` - Technical/texture paints

### Step-by-Step Import

1. **Prepare your CSV file**
   - Use the template (download from import page)
   - Ensure hex colors start with `#`
   - Use valid paint types

2. **Go to** `/admin/import-paints`

3. **Upload your CSV**
   - Click "Choose CSV File"
   - Select your file

4. **Preview the data**
   - Review the paint list
   - Check colors are correct
   - Verify paint types

5. **Import**
   - Click "Import All"
   - Wait for completion

### Where to Find Paint Data

**Official Sources**:
- **Citadel**: GW website has color charts (may need to extract manually)
- **Vallejo**: Color charts available on their website
- **Army Painter**: Product pages list all colors
- **ProAcryl**: Monument Hobbies website

**Community Sources**:
- Reddit r/minipainting wiki
- DakkaDakka paint conversion charts
- Paint comparison websites
- Facebook miniature painting groups

**Pro Tip**: Google "[brand name] paint hex codes" - hobbyists have compiled many lists!

### Example CSV Files

**Citadel Paints**:
```csv
brand,name,hexColor,type
Citadel,Abaddon Black,#000000,base
Citadel,Corax White,#FFFFFF,base
Citadel,Mephiston Red,#9C1E1E,base
Citadel,Caliban Green,#00401F,base
Citadel,Macragge Blue,#0F3D7C,base
```

**Army Painter Fanatic**:
```csv
brand,name,hexColor,type
Army Painter Fanatic,Matt Black,#1A1A1A,base
Army Painter Fanatic,Pure White,#F5F5F5,base
Army Painter Fanatic,Deep Red,#8B1A1A,base
Army Painter Fanatic,Blood Red,#A92020,layer
```

---

## Adding Paints Manually

### Editing the Comprehensive Paints File

**File**: `lib/data/comprehensive-paints.ts`

This is the source file for the comprehensive paint database.

**How to add paints**:

1. **Open** `lib/data/comprehensive-paints.ts`

2. **Find the brand section** you want to add to (or create a new one)

3. **Add paint objects**:
```typescript
// Add to existing brand section
{ brand: 'Citadel', name: 'New Paint Name', hexColor: '#ABCDEF', type: 'layer' },
{ brand: 'Citadel', name: 'Another Paint', hexColor: '#123456', type: 'base' },

// Or create new brand section
// ===== NEW BRAND (50 paints) =====
{ brand: 'New Brand', name: 'Paint 1', hexColor: '#000000', type: 'base' },
{ brand: 'New Brand', name: 'Paint 2', hexColor: '#FFFFFF', type: 'layer' },
```

4. **Save the file**

5. **Run "Clear and Reseed"** at `/admin/manage-paints`

**Tips**:
- Keep paints organized by brand
- Add comments for paint counts
- Maintain alphabetical order within brands
- Use consistent formatting

---

## Custom User Paints

### Overview

Users can create their own custom paints that appear alongside the global paint database.

**Location**: Paint library page (`/paints`)

### Creating Custom Paints

1. Go to `/paints`
2. Click **"Add Custom Paint"** button
3. Fill in the form:
   - **Brand**: Any brand name (e.g., "My Custom Mix", "Homebrew")
   - **Name**: Paint name
   - **Hex Color**: Click color picker or enter hex code
   - **Type**: Select paint type
4. Click **"Add Paint"**

### Custom Paint Features

- **Personal library**: Each user has their own custom paints
- **Appears everywhere**: Shows in paint selectors with ✨ sparkle icon
- **Fully integrated**: Works with projects, paint recipes, etc.
- **Can be deleted**: Only owner can delete their custom paints

### Use Cases

- **Custom mixes**: Save your own paint mixing recipes
- **Homebrew paints**: Non-commercial paints
- **Special effects**: Unique colors you've created
- **Missing paints**: Brands not in the main database

---

## Web Scrapers (Future Use)

### Overview

Web scrapers automatically fetch paint data from manufacturer websites.

**Status**: ⚠️ **Template implementations** - Need testing and adjustment

### Available Scrapers

| Scraper | File | Target Website |
|---------|------|----------------|
| Citadel | `lib/scrapers/citadel-scraper.ts` | games-workshop.com |
| Army Painter | `lib/scrapers/army-painter-scraper.ts` | thearmypainter.com |
| Vallejo | `lib/scrapers/vallejo-scraper.ts` | acrylicosvallejo.com |
| ProAcryl | `lib/scrapers/monument-scraper.ts` | monumenthobbies.com |

### Why Scrapers Aren't Ready

**Current limitations**:
- ❌ HTML selectors need adjustment for each site
- ❌ Many sites use JavaScript (need headless browser)
- ❌ Sites change frequently, breaking scrapers
- ❌ Some sites don't provide hex color codes
- ❌ Anti-scraping measures (rate limiting, CAPTCHAs)

**Recommended approach**: Use CSV import instead

### When to Use Scrapers

Only use web scrapers if:
- You need to update paints frequently (new releases)
- You're comfortable debugging HTML/JavaScript
- You have time to maintain the scrapers
- CSV data isn't available

### Making Scrapers Work

If you want to implement web scraping in the future:

**1. Install Puppeteer** (for JavaScript-heavy sites):
```bash
npm install puppeteer
```

**2. Test a scraper**:
```typescript
import { CitadelScraper } from '@/lib/scrapers/citadel-scraper';

const scraper = new CitadelScraper();
const result = await scraper.scrape();

console.log(`Scraped ${result.paints.length} paints`);
console.log('Errors:', result.errors);
```

**3. Adjust HTML selectors**:
- Visit the target website
- Open browser DevTools (F12)
- Inspect product cards/listings
- Update selectors in scraper file

**4. Handle errors**:
- Add retry logic
- Implement rate limiting
- Cache results
- Log errors for debugging

**5. Create admin UI** (optional):
- Add scraper trigger buttons
- Show progress/results
- Preview before importing

---

## Troubleshooting

### Paint Library Shows "Missing or insufficient permissions"

**Problem**: Firestore security rules not deployed

**Solution**:
1. Go to Firebase Console → Firestore Database → Rules
2. Copy rules from `firestore.rules` file
3. Paste and publish
4. Key rule: `match /paints/{paintId} { allow read: if true; }`

### "Clear and Reseed" Button Does Nothing

**Problem**: Likely a JavaScript error or auth issue

**Solution**:
1. Open browser console (F12)
2. Look for errors
3. Refresh the page
4. Make sure you're logged in
5. Try again

### CSV Import Fails with "Invalid hex color"

**Problem**: Hex colors don't have `#` prefix or are invalid format

**Solution**:
1. Check all hex codes start with `#`
2. Ensure they're 6 characters (e.g., `#000000`, not `#000`)
3. Use uppercase letters (e.g., `#ABCDEF`, not `#abcdef`)

### CSV Import Fails with "Invalid paint type"

**Problem**: Paint type column has invalid value

**Solution**:
- Use only these values: `base`, `layer`, `shade`, `metallic`, `contrast`, `technical`
- Check for typos (e.g., `basse` instead of `base`)
- Values are case-insensitive

### Imported Paints Don't Show in Paint Library

**Problem**: Either Firestore rules or import failed

**Solution**:
1. Check browser console for errors
2. Go to Firebase Console → Firestore Database
3. Check if `paints` collection has documents
4. If empty, import failed - check CSV format
5. If populated, check Firestore rules

### Can't Delete Custom Paints

**Problem**: Trying to delete someone else's custom paint

**Solution**:
- You can only delete your own custom paints
- Custom paints show ✨ sparkle icon
- Check you're logged in as the correct user

---

## Quick Reference

### Admin URLs

- **Admin Dashboard**: https://www.paintpile.com/admin
- **Manage Paints**: https://www.paintpile.com/admin/manage-paints
- **Import CSV**: https://www.paintpile.com/admin/import-paints
- **Paint Library**: https://www.paintpile.com/paints

### File Locations

- **Comprehensive Paints**: `lib/data/comprehensive-paints.ts`
- **Firestore Rules**: `firestore.rules`
- **CSV Importer**: `lib/scrapers/csv-importer.ts`
- **Scrapers**: `lib/scrapers/[brand]-scraper.ts`

### Key Commands

```bash
# Add new paints manually
# 1. Edit lib/data/comprehensive-paints.ts
# 2. Go to /admin/manage-paints
# 3. Click "Clear and Reseed"

# Install scraper dependencies
npm install cheerio puppeteer

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

---

## Best Practices

### Maintaining Paint Data

1. **Keep comprehensive-paints.ts organized**
   - Group by brand
   - Add comments with paint counts
   - Maintain consistent formatting

2. **Use CSV import for bulk additions**
   - Easier than manual editing
   - Can preview before importing
   - Faster for large datasets

3. **Test before deploying**
   - Use "Clear and Reseed" in development first
   - Verify paint counts
   - Check colors in paint library

### Getting Paint Data

1. **Official sources are best**
   - Manufacturer websites
   - Official color charts
   - Product catalogs

2. **Community resources**
   - Reddit wikis
   - Paint comparison sites
   - Hobbyist compilations

3. **Verify colors**
   - Hex codes from images can be inaccurate
   - Cross-reference multiple sources
   - Test physical paints if possible

---

## Future Enhancements

### Potential Features

- **Automated scraper scheduling** - Run scrapers weekly to check for new paints
- **Paint comparison tool** - Compare colors across brands
- **Paint mixing calculator** - Calculate ratios for custom colors
- **Color palette generator** - Suggest paint combinations
- **Paint inventory** - Track which paints users own
- **Shopping list** - Generate lists of paints needed for projects

### Contributing

If you add new paint brands or improve scrapers:

1. Update `lib/data/comprehensive-paints.ts`
2. Test thoroughly
3. Update this guide
4. Commit changes with clear messages

---

## Support

**Issues or Questions?**

- Check this guide first
- Look at browser console for errors
- Check Firebase Console for data
- Review Firestore rules
- Test with CSV template

**For scraper development**:
- Inspect website HTML structure
- Use browser DevTools
- Test selectors in console
- Add error logging
- Start simple, iterate

---

**Last Updated**: January 2026
**Current Paint Count**: 301 paints
**Supported Brands**: Citadel, Army Painter Fanatic, Vallejo Model Color, Vallejo Game Color, ProAcryl, Reaper MSP, Scale75, P3
