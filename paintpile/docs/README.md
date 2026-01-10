# PaintPile Documentation

Welcome to the PaintPile documentation! This directory contains guides and references for all features.

## Available Guides

### [Paint Database Guide](./PAINT_DATABASE_GUIDE.md)
Complete guide to managing, importing, and maintaining the paint database.

**Topics covered**:
- Managing the paint database (clear & reseed)
- Importing paints from CSV files
- Adding paints manually
- Custom user paints
- Web scrapers (future use)
- Troubleshooting

**Quick links**:
- Admin Dashboard: `/admin`
- Manage Paints: `/admin/manage-paints`
- Import CSV: `/admin/import-paints`
- Paint Library: `/paints`

### [Recipe System Guide](./RECIPE_SYSTEM_GUIDE.md)
Complete guide to creating, managing, and sharing paint recipes.

**Topics covered**:
- Creating comprehensive paint recipes
- Managing your recipe library
- Saving and sharing recipes
- Using recipes in projects
- Recipe structure and best practices
- Migration from old system

**Quick links**:
- My Recipes: `/recipes`
- Create Recipe: Click "New Recipe" on recipes page
- Recipe Library: Coming soon

---

## Quick Start

### For End Users

1. **View Paints**: Go to `/paints` to browse all available paints
2. **Add Custom Paints**: Click "Add Custom Paint" on the paint library page
3. **Use in Projects**: Select paints when creating/editing projects

### For Admins

1. **Seed Database**: Go to `/admin/manage-paints` → Click "Clear and Reseed"
2. **Import More Paints**: Go to `/admin/import-paints` → Upload CSV file
3. **Add Manually**: Edit `lib/data/comprehensive-paints.ts` → Reseed database

---

## Common Tasks

### Adding New Paints (CSV Method - Recommended)

1. Create CSV file:
   ```csv
   brand,name,hexColor,type
   Citadel,New Paint,#ABCDEF,layer
   ```

2. Go to `/admin/import-paints`
3. Upload CSV and import

### Adding New Paints (Manual Method)

1. Edit `lib/data/comprehensive-paints.ts`
2. Add paint objects:
   ```typescript
   { brand: 'Brand', name: 'Paint Name', hexColor: '#ABCDEF', type: 'layer' },
   ```
3. Go to `/admin/manage-paints` → Click "Clear and Reseed"

### Troubleshooting "Missing permissions" Error

1. Go to Firebase Console → Firestore Database → Rules
2. Copy rules from `firestore.rules`
3. Paste and publish

Key rule:
```javascript
match /paints/{paintId} {
  allow read: if true;
  allow write: if isAuthenticated();
}
```

---

## File Structure

```
docs/
  ├── README.md                    # This file
  └── PAINT_DATABASE_GUIDE.md      # Complete paint database guide

lib/
  ├── data/
  │   └── comprehensive-paints.ts  # Main paint database (301 paints)
  ├── firestore/
  │   ├── paints.ts               # Paint database functions
  │   └── custom-paints.ts        # Custom paint functions
  └── scrapers/
      ├── base-scraper.ts         # Base scraper class
      ├── csv-importer.ts         # CSV import utility
      ├── citadel-scraper.ts      # Games Workshop scraper
      ├── army-painter-scraper.ts # Army Painter scraper
      ├── vallejo-scraper.ts      # Vallejo scraper
      └── monument-scraper.ts     # ProAcryl scraper

app/(protected)/
  ├── admin/
  │   ├── manage-paints/          # Paint management UI
  │   ├── import-paints/          # CSV import UI
  │   └── page.tsx               # Admin dashboard
  └── paints/
      └── page.tsx               # Paint library
```

---

## Current Status

- **Paint Count**: 301 paints
- **Brands**:
  - Army Painter Fanatic (85)
  - Citadel (73)
  - Vallejo Model Color (40)
  - Reaper MSP (28)
  - ProAcryl (28)
  - Scale75 (25)
  - Vallejo Game Color (22)

---

## Future Documentation

Additional guides will be added as features are implemented:

- Project management guide
- Social features guide (gallery, follows, likes, comments)
- Photo upload and annotation guide
- Pile of shame tracking guide
- Public recipe browse guide
- Recipe-to-project integration guide

---

## Contributing

When adding new features or making changes:

1. Update relevant documentation
2. Add examples where helpful
3. Include troubleshooting tips
4. Keep quick reference sections updated

---

## Getting Help

1. Check the relevant guide in this directory
2. Look at browser console for errors (F12)
3. Check Firebase Console for data/rules issues
4. Review `firestore.rules` for permissions

---

**Last Updated**: January 2026
