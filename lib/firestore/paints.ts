import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { Paint } from '@/types/paint';

/**
 * Get all paints from the global database
 */
export async function getAllPaints(): Promise<Paint[]> {
  const paintsRef = collection(db, 'paints');

  const querySnapshot = await getDocs(paintsRef);
  const paints = querySnapshot.docs.map((doc) => doc.data() as Paint);

  // Sort in memory instead of using Firestore orderBy (avoids needing composite index)
  return paints.sort((a, b) => {
    if (a.brand !== b.brand) {
      return a.brand.localeCompare(b.brand);
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get paints by brand
 */
export async function getPaintsByBrand(brand: string): Promise<Paint[]> {
  const paintsRef = collection(db, 'paints');
  const q = query(paintsRef, where('brand', '==', brand));

  const querySnapshot = await getDocs(q);
  const paints = querySnapshot.docs.map((doc) => doc.data() as Paint);

  // Sort by name in memory
  return paints.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Search paints by name
 */
export async function searchPaints(searchTerm: string): Promise<Paint[]> {
  const paints = await getAllPaints();
  const lowerSearch = searchTerm.toLowerCase();

  return paints.filter(
    (paint) =>
      paint.name.toLowerCase().includes(lowerSearch) ||
      paint.brand.toLowerCase().includes(lowerSearch)
  );
}

/**
 * Get paints by IDs
 */
export async function getPaintsByIds(paintIds: string[]): Promise<Paint[]> {
  if (paintIds.length === 0) return [];

  const paints = await getAllPaints();
  return paints.filter((paint) => paintIds.includes(paint.paintId));
}

/**
 * Seed the paint database (run once)
 */
export async function seedPaintDatabase(): Promise<number> {
  const paints: Omit<Paint, 'paintId'>[] = [
    // ===== CITADEL PAINTS =====

    // BASE PAINTS (22 colors)
    { brand: 'Citadel', name: 'Abaddon Black', hexColor: '#000000', type: 'base' },
    { brand: 'Citadel', name: 'Corax White', hexColor: '#FFFFFF', type: 'base' },
    { brand: 'Citadel', name: 'Celestra Grey', hexColor: '#90A8A4', type: 'base' },
    { brand: 'Citadel', name: 'Death Guard Green', hexColor: '#556229', type: 'base' },
    { brand: 'Citadel', name: 'Deathworld Forest', hexColor: '#5C6730', type: 'base' },
    { brand: 'Citadel', name: 'Incubi Darkness', hexColor: '#0B474A', type: 'base' },
    { brand: 'Citadel', name: 'Caliban Green', hexColor: '#00401F', type: 'base' },
    { brand: 'Citadel', name: 'Waaagh! Flesh', hexColor: '#1A5E3C', type: 'base' },
    { brand: 'Citadel', name: 'Castellan Green', hexColor: '#264715', type: 'base' },
    { brand: 'Citadel', name: 'Nocturne Green', hexColor: '#1C331E', type: 'base' },
    { brand: 'Citadel', name: 'Kantor Blue', hexColor: '#02134E', type: 'base' },
    { brand: 'Citadel', name: 'Macragge Blue', hexColor: '#0F3D7C', type: 'base' },
    { brand: 'Citadel', name: 'Thousand Sons Blue', hexColor: '#005B7C', type: 'base' },
    { brand: 'Citadel', name: 'Naggaroth Night', hexColor: '#3F286E', type: 'base' },
    { brand: 'Citadel', name: 'Daemonette Hide', hexColor: '#696684', type: 'base' },
    { brand: 'Citadel', name: 'Screamer Pink', hexColor: '#7C1645', type: 'base' },
    { brand: 'Citadel', name: 'Khorne Red', hexColor: '#6A0001', type: 'base' },
    { brand: 'Citadel', name: 'Mephiston Red', hexColor: '#9C1E1E', type: 'base' },
    { brand: 'Citadel', name: 'Rhinox Hide', hexColor: '#5C3726', type: 'base' },
    { brand: 'Citadel', name: 'Mournfang Brown', hexColor: '#6A4F3B', type: 'base' },
    { brand: 'Citadel', name: 'Zandri Dust', hexColor: '#9E915C', type: 'base' },
    { brand: 'Citadel', name: 'Mechanicus Standard Grey', hexColor: '#3D4B4D', type: 'base' },
    { brand: 'Citadel', name: 'Rakarth Flesh', hexColor: '#A7A297', type: 'base' },

    // Layer Paints
    { brand: 'Citadel', name: 'Evil Sunz Scarlet', hexColor: '#C11519', type: 'layer' },
    { brand: 'Citadel', name: 'Wild Rider Red', hexColor: '#E83A1F', type: 'layer' },
    { brand: 'Citadel', name: 'Wazdakka Red', hexColor: '#880C0C', type: 'layer' },
    { brand: 'Citadel', name: 'Warpstone Glow', hexColor: '#1E7331', type: 'layer' },
    { brand: 'Citadel', name: 'Moot Green', hexColor: '#52B244', type: 'layer' },
    { brand: 'Citadel', name: 'Altdorf Guard Blue', hexColor: '#1F56A7', type: 'layer' },
    { brand: 'Citadel', name: 'Caledor Sky', hexColor: '#366699', type: 'layer' },
    { brand: 'Citadel', name: 'Teclis Blue', hexColor: '#367CBB', type: 'layer' },
    { brand: 'Citadel', name: 'Genestealer Purple', hexColor: '#7758A4', type: 'layer' },
    { brand: 'Citadel', name: 'Xereus Purple', hexColor: '#47125A', type: 'layer' },
    { brand: 'Citadel', name: 'Eshin Grey', hexColor: '#4A4F52', type: 'layer' },
    { brand: 'Citadel', name: 'Stormvermin Fur', hexColor: '#6D6B5D', type: 'layer' },
    { brand: 'Citadel', name: 'Pallid Wych Flesh', hexColor: '#CDCEBE', type: 'layer' },
    { brand: 'Citadel', name: 'Flayed One Flesh', hexColor: '#E3C0A4', type: 'layer' },

    // Shade Paints
    { brand: 'Citadel', name: 'Nuln Oil', hexColor: '#14100E', type: 'shade' },
    { brand: 'Citadel', name: 'Agrax Earthshade', hexColor: '#3D2C1C', type: 'shade' },
    { brand: 'Citadel', name: 'Reikland Fleshshade', hexColor: '#78422E', type: 'shade' },
    { brand: 'Citadel', name: 'Carroburg Crimson', hexColor: '#571E29', type: 'shade' },
    { brand: 'Citadel', name: 'Drakenhof Nightshade', hexColor: '#1E2D44', type: 'shade' },
    { brand: 'Citadel', name: 'Athonian Camoshade', hexColor: '#283E2F', type: 'shade' },

    // Metallic Paints
    { brand: 'Citadel', name: 'Leadbelcher', hexColor: '#888D91', type: 'metallic' },
    { brand: 'Citadel', name: 'Ironbreaker', hexColor: '#A1A6A9', type: 'metallic' },
    { brand: 'Citadel', name: 'Runefang Steel', hexColor: '#C3C6C8', type: 'metallic' },
    { brand: 'Citadel', name: 'Retributor Armour', hexColor: '#C39E4A', type: 'metallic' },
    { brand: 'Citadel', name: 'Auric Armour Gold', hexColor: '#D6A856', type: 'metallic' },
    { brand: 'Citadel', name: "Gehenna's Gold", hexColor: '#B7884A', type: 'metallic' },
    { brand: 'Citadel', name: 'Balthasar Gold', hexColor: '#6F5836', type: 'metallic' },
    { brand: 'Citadel', name: 'Warplock Bronze', hexColor: '#59423C', type: 'metallic' },

    // Contrast Paints
    { brand: 'Citadel', name: 'Blood Angels Red', hexColor: '#A80F04', type: 'contrast' },
    { brand: 'Citadel', name: 'Gryph-Charger Grey', hexColor: '#6E7B86', type: 'contrast' },

    // Vallejo Model Color (20 paints)
    { brand: 'Vallejo Model Color', name: 'Black', hexColor: '#000000', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'White', hexColor: '#FFFFFF', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Flat Red', hexColor: '#9F1C19', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Scarlet', hexColor: '#C01518', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Yellow Green', hexColor: '#8FA033', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Intermediate Green', hexColor: '#6E834A', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Prussian Blue', hexColor: '#17395D', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Medium Blue', hexColor: '#4283A5', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Royal Purple', hexColor: '#4B3D6E', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Violet', hexColor: '#6B4E7C', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Burnt Umber', hexColor: '#6E4729', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'German Camo Beige', hexColor: '#9C8A70', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Medium Grey', hexColor: '#898988', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Dark Grey', hexColor: '#5C5C5C', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Flat Flesh', hexColor: '#D08B5B', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Beige Red', hexColor: '#C77764', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Gun Metal', hexColor: '#414141', type: 'metallic' },
    { brand: 'Vallejo Model Color', name: 'Silver', hexColor: '#9DA3A4', type: 'metallic' },
    { brand: 'Vallejo Model Color', name: 'Gold', hexColor: '#C49B43', type: 'metallic' },
    { brand: 'Vallejo Model Color', name: 'Copper', hexColor: '#AB6F3E', type: 'metallic' },

    // Army Painter (10 paints)
    { brand: 'Army Painter', name: 'Matt Black', hexColor: '#000000', type: 'base' },
    { brand: 'Army Painter', name: 'Matt White', hexColor: '#FFFFFF', type: 'base' },
    { brand: 'Army Painter', name: 'Pure Red', hexColor: '#A92121', type: 'base' },
    { brand: 'Army Painter', name: 'Greenskin', hexColor: '#6E8F47', type: 'base' },
    { brand: 'Army Painter', name: 'Ultramarine Blue', hexColor: '#0F4F8F', type: 'base' },
    { brand: 'Army Painter', name: 'Dirt Spatter', hexColor: '#7E5E3C', type: 'base' },
    { brand: 'Army Painter', name: 'Barbarian Flesh', hexColor: '#D1956F', type: 'base' },
    { brand: 'Army Painter', name: 'Plate Mail Metal', hexColor: '#9DA5AA', type: 'metallic' },
    { brand: 'Army Painter', name: 'Weapon Bronze', hexColor: '#9F7A56', type: 'metallic' },
    { brand: 'Army Painter', name: 'Strong Tone Ink', hexColor: '#2F231A', type: 'shade' },

    // Reaper MSP (8 paints)
    { brand: 'Reaper MSP', name: 'Black', hexColor: '#000000', type: 'base' },
    { brand: 'Reaper MSP', name: 'Pure White', hexColor: '#FFFFFF', type: 'base' },
    { brand: 'Reaper MSP', name: 'Blood Red', hexColor: '#9B1313', type: 'base' },
    { brand: 'Reaper MSP', name: 'Forest Green', hexColor: '#2E5B3F', type: 'base' },
    { brand: 'Reaper MSP', name: 'Imperial Blue', hexColor: '#1F4788', type: 'base' },
    { brand: 'Reaper MSP', name: 'Tanned Skin', hexColor: '#D59B6A', type: 'base' },
    { brand: 'Reaper MSP', name: 'Honed Steel', hexColor: '#9CA5AD', type: 'metallic' },
    { brand: 'Reaper MSP', name: 'Antique Gold', hexColor: '#C4994D', type: 'metallic' },

    // P3 Paints (5 paints)
    { brand: 'P3', name: 'Thamar Black', hexColor: '#000000', type: 'base' },
    { brand: 'P3', name: 'Morrow White', hexColor: '#FFFFFF', type: 'base' },
    { brand: 'P3', name: 'Khador Red Base', hexColor: '#8B1A1A', type: 'base' },
    { brand: 'P3', name: 'Cygnar Blue Base', hexColor: '#1A5C86', type: 'base' },
    { brand: 'P3', name: 'Pig Iron', hexColor: '#5C6469', type: 'metallic' },
  ];

  const paintsRef = collection(db, 'paints');
  let count = 0;

  for (const paint of paints) {
    const paintRef = doc(paintsRef);
    await setDoc(paintRef, {
      paintId: paintRef.id,
      ...paint,
    });
    count++;
  }

  return count;
}
