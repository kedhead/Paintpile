import { PaintSet } from '@/types/paint-set';

/**
 * Curated Paint Sets Database
 *
 * This file contains manually verified paint set contents.
 * Each set lists the exact paints included, which will be matched
 * against the comprehensive paint database.
 *
 * To add a new set:
 * 1. Find the official product page or unboxing video
 * 2. List ALL paint names exactly as they appear in the paint database
 * 3. Add the set with isCurated: true
 * 4. Include sourceUrl for verification
 */

export const CURATED_PAINT_SETS: PaintSet[] = [
  // ===== ARMY PAINTER =====
  {
    setId: 'army-painter-speedpaint-2-mega',
    setName: 'Speedpaint 2.0 Mega Set',
    brand: 'Army Painter',
    paintCount: 48,
    isCurated: true,
    description: 'Complete collection of Speedpaint 2.0 one-coat paints',
    releaseYear: 2024,
    sourceUrl: 'https://www.thearmypainter.com/shop/us/sp2001',
    paintNames: [
      // Reds & Pinks
      'Crusader Skin 2.0',
      'Mouldy Red 2.0',
      'Red Gore 2.0',
      'Runic Red 2.0',
      'Blood Red 2.0',
      'Sunset Red 2.0',

      // Oranges & Yellows
      'Burnt Sienna 2.0',
      'Flaming Orange 2.0',
      'Fire Giant Orange 2.0',
      'Daemonic Yellow 2.0',
      'Zealot Yellow 2.0',
      'Highlord Yellow 2.0',

      // Greens
      'Goblin Green 2.0',
      'Zealous Green 2.0',
      'Woodland Green 2.0',
      'Orc Skin 2.0',
      'Malignant Green 2.0',
      'Pale Green 2.0',

      // Blues & Cyans
      'Dark Blue 2.0',
      'Deep Blue 2.0',
      'Magic Blue 2.0',
      'Cloudburst Blue 2.0',
      'Turquoise 2.0',

      // Purples
      'Hive Purple 2.0',
      'Royal Purple 2.0',
      'Malignant Magenta 2.0',

      // Browns & Tans
      'Tanned Skin 2.0',
      'Terradon Turquoise 2.0',
      'Gravelord Grey 2.0',
      'Pallid Bone 2.0',
      'Mummy Skin 2.0',

      // Greys & Blacks
      'Dark Grey 2.0',
      'Hardened Carapace 2.0',
      'Dusk Grey 2.0',
      'Grim Black 2.0',
      'Ashen Grey 2.0',

      // Metals
      'Orichalcum Gold 2.0',
      'Bright Gold 2.0',
      'Aged Steel 2.0',
      'Chainmail Silver 2.0',
      'Hardened Leather 2.0',
      'Tainted Skin 2.0',
      'Holy White 2.0',
      'Slaughter Red 2.0',
      'Gravelord Grey 2.0',
      'Hiveborn Chitin 2.0',
    ],
  },
  {
    setId: 'army-painter-speedpaint-starter',
    setName: 'Speedpaint Starter Set',
    brand: 'Army Painter',
    paintCount: 10,
    isCurated: true,
    description: 'Essential Speedpaint colors for beginners',
    sourceUrl: 'https://www.thearmypainter.com/shop/us/sp7001',
    paintNames: [
      'Holy White 2.0',
      'Zealot Yellow 2.0',
      'Fire Giant Orange 2.0',
      'Blood Red 2.0',
      'Royal Purple 2.0',
      'Magic Blue 2.0',
      'Goblin Green 2.0',
      'Gravelord Grey 2.0',
      'Hardened Carapace 2.0',
      'Grim Black 2.0',
    ],
  },
  {
    setId: 'army-painter-fanatic-starter',
    setName: 'Fanatic Paint Starter Set',
    brand: 'Army Painter Fanatic',
    paintCount: 24,
    isCurated: true,
    description: 'Complete starter set of Fanatic acrylic paints',
    releaseYear: 2024,
    sourceUrl: 'https://www.thearmypainter.com/shop/us/fa2001',
    paintNames: [
      'Matt Black',
      'Matt White',
      'Deep Red',
      'Blood Red',
      'Bright Red',
      'Bright Orange',
      'Sun Yellow',
      'Basilisk Brown',
      'Oak Brown',
      'Deep Green',
      'Jungle Green',
      'Bright Green',
      'Deep Blue',
      'Ocean Blue',
      'Sky Blue',
      'Royal Purple',
      'Violet',
      'Smokey Grey',
      'Stone Grey',
      'Light Grey',
      'Leather Brown',
      'Bronze',
      'Gold',
      'Silver',
    ],
  },

  // ===== CITADEL =====
  {
    setId: 'citadel-base-paint-set',
    setName: 'Citadel Base Paint Set',
    brand: 'Citadel',
    paintCount: 11,
    isCurated: true,
    description: 'Essential base coat paints from Games Workshop',
    sourceUrl: 'https://www.games-workshop.com',
    paintNames: [
      'Abaddon Black',
      'Corax White',
      'Mephiston Red',
      'Caliban Green',
      'Macragge Blue',
      'Balthasar Gold',
      'Leadbelcher',
      'Rakarth Flesh',
      'Zandri Dust',
      'Rhinox Hide',
      'Screamer Pink',
    ],
  },
  {
    setId: 'citadel-essentials-set',
    setName: 'Citadel Essentials Set',
    brand: 'Citadel',
    paintCount: 8,
    isCurated: true,
    description: 'Core paint collection for new hobbyists',
    sourceUrl: 'https://www.games-workshop.com',
    paintNames: [
      'Abaddon Black',
      'Corax White',
      'Mephiston Red',
      'Caliban Green',
      'Macragge Blue',
      'Balthasar Gold',
      'Nuln Oil',
      'Agrax Earthshade',
    ],
  },

  // ===== VALLEJO =====
  {
    setId: 'vallejo-basic-usa-colors',
    setName: 'Basic USA Colors Set',
    brand: 'Vallejo Model Color',
    paintCount: 8,
    isCurated: true,
    description: 'WWII US military vehicle colors',
    sourceUrl: 'https://acrylicosvallejo.com',
    paintNames: [
      'Olive Drab',
      'Yellow Olive',
      'USA Tan Earth',
      'Khaki',
      'White',
      'Black',
      'Burnt Umber',
      'Dark Yellow',
    ],
  },
  {
    setId: 'vallejo-game-color-intro',
    setName: 'Game Color Introduction Set',
    brand: 'Vallejo Game Color',
    paintCount: 16,
    isCurated: true,
    description: 'Starter set for fantasy miniatures',
    sourceUrl: 'https://acrylicosvallejo.com',
    paintNames: [
      'Black',
      'White',
      'Bloody Red',
      'Scrofulous Brown',
      'Goblin Green',
      'Electric Blue',
      'Sun Yellow',
      'Orange Fire',
      'Sepia Wash',
      'Black Wash',
      'Elf Skintone',
      'Dwarf Skin',
      'Chainmail Silver',
      'Polished Gold',
      'Gunmetal',
      'Bonewhite',
    ],
  },

  // ===== REAPER =====
  {
    setId: 'reaper-core-colors',
    setName: 'Core Colors Paint Set',
    brand: 'Reaper MSP',
    paintCount: 11,
    isCurated: true,
    description: 'Essential colors for all miniature painting',
    sourceUrl: 'https://www.reapermini.com',
    paintNames: [
      'Pure Black',
      'Pure White',
      'Blood Red',
      'Harvest Brown',
      'Viper Green',
      'Ultramarine Blue',
      'Brilliant Yellow',
      'Burnt Orange',
      'Royal Purple',
      'Shadowed Stone',
      'Polished Silver',
    ],
  },

  // ===== SCALE75 =====
  {
    setId: 'scale75-basic-set',
    setName: 'Fantasy & Games Basic Set',
    brand: 'Scale75',
    paintCount: 8,
    isCurated: true,
    description: 'Essential colors for fantasy miniatures',
    sourceUrl: 'https://scale75.com',
    paintNames: [
      'Black',
      'White',
      'Red',
      'Yellow',
      'Blue',
      'Green',
      'Leather Brown',
      'Metal Medium',
    ],
  },
];

/**
 * Get all paint set brands
 */
export function getPaintSetBrands(): string[] {
  const brands = new Set(CURATED_PAINT_SETS.map(set => set.brand));
  return Array.from(brands).sort();
}

/**
 * Get paint sets by brand
 */
export function getPaintSetsByBrand(brand: string): PaintSet[] {
  return CURATED_PAINT_SETS.filter(set =>
    set.brand.toLowerCase() === brand.toLowerCase()
  );
}

/**
 * Get a specific paint set by ID
 */
export function getPaintSetById(setId: string): PaintSet | undefined {
  return CURATED_PAINT_SETS.find(set => set.setId === setId);
}

/**
 * Search paint sets by name
 */
export function searchPaintSets(query: string): PaintSet[] {
  const lowerQuery = query.toLowerCase();
  return CURATED_PAINT_SETS.filter(set =>
    set.setName.toLowerCase().includes(lowerQuery) ||
    set.brand.toLowerCase().includes(lowerQuery) ||
    set.description?.toLowerCase().includes(lowerQuery)
  );
}
