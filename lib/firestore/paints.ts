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
 * Comprehensive database with 200+ paints from major miniature paint brands
 */
export async function seedPaintDatabase(): Promise<number> {
  const paints: Omit<Paint, 'paintId'>[] = [
    // ===== CITADEL PAINTS =====

    // BASE PAINTS (25 colors)
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
    { brand: 'Citadel', name: 'Jokaero Orange', hexColor: '#EE3A08', type: 'base' },
    { brand: 'Citadel', name: 'Averland Sunset', hexColor: '#FDB825', type: 'base' },
    { brand: 'Citadel', name: 'Rhinox Hide', hexColor: '#5C3726', type: 'base' },
    { brand: 'Citadel', name: 'Mournfang Brown', hexColor: '#6A4F3B', type: 'base' },
    { brand: 'Citadel', name: 'Zandri Dust', hexColor: '#9E915C', type: 'base' },
    { brand: 'Citadel', name: 'Mechanicus Standard Grey', hexColor: '#3D4B4D', type: 'base' },
    { brand: 'Citadel', name: 'Rakarth Flesh', hexColor: '#A7A297', type: 'base' },

    // LAYER PAINTS (40 colors)
    { brand: 'Citadel', name: 'Evil Sunz Scarlet', hexColor: '#C11519', type: 'layer' },
    { brand: 'Citadel', name: 'Wild Rider Red', hexColor: '#E83A1F', type: 'layer' },
    { brand: 'Citadel', name: 'Wazdakka Red', hexColor: '#880C0C', type: 'layer' },
    { brand: 'Citadel', name: 'Troll Slayer Orange', hexColor: '#F36D3B', type: 'layer' },
    { brand: 'Citadel', name: 'Fire Dragon Bright', hexColor: '#F4864E', type: 'layer' },
    { brand: 'Citadel', name: 'Flash Gitz Yellow', hexColor: '#FFF300', type: 'layer' },
    { brand: 'Citadel', name: 'Yriel Yellow', hexColor: '#FFD900', type: 'layer' },
    { brand: 'Citadel', name: 'Warpstone Glow', hexColor: '#1E7331', type: 'layer' },
    { brand: 'Citadel', name: 'Moot Green', hexColor: '#52B244', type: 'layer' },
    { brand: 'Citadel', name: 'Warboss Green', hexColor: '#447853', type: 'layer' },
    { brand: 'Citadel', name: 'Skarsnik Green', hexColor: '#5A9C74', type: 'layer' },
    { brand: 'Citadel', name: 'Gauss Blaster Green', hexColor: '#84C3AA', type: 'layer' },
    { brand: 'Citadel', name: 'Kabalite Green', hexColor: '#0E7C6B', type: 'layer' },
    { brand: 'Citadel', name: 'Sybarite Green', hexColor: '#30AC91', type: 'layer' },
    { brand: 'Citadel', name: 'Sotek Green', hexColor: '#0B6975', type: 'layer' },
    { brand: 'Citadel', name: 'Temple Guard Blue', hexColor: '#339999', type: 'layer' },
    { brand: 'Citadel', name: 'Lothern Blue', hexColor: '#34AFCE', type: 'layer' },
    { brand: 'Citadel', name: 'Altdorf Guard Blue', hexColor: '#1F56A7', type: 'layer' },
    { brand: 'Citadel', name: 'Caledor Sky', hexColor: '#366699', type: 'layer' },
    { brand: 'Citadel', name: 'Teclis Blue', hexColor: '#367CBB', type: 'layer' },
    { brand: 'Citadel', name: 'Hoeth Blue', hexColor: '#57A9D7', type: 'layer' },
    { brand: 'Citadel', name: 'Thunderhawk Blue', hexColor: '#417074', type: 'layer' },
    { brand: 'Citadel', name: 'Fenrisian Grey', hexColor: '#719BB7', type: 'layer' },
    { brand: 'Citadel', name: 'Genestealer Purple', hexColor: '#7758A4', type: 'layer' },
    { brand: 'Citadel', name: 'Xereus Purple', hexColor: '#47125A', type: 'layer' },
    { brand: 'Citadel', name: 'Warpfiend Grey', hexColor: '#6C6D74', type: 'layer' },
    { brand: 'Citadel', name: 'Pink Horror', hexColor: '#903966', type: 'layer' },
    { brand: 'Citadel', name: 'Emperor\'s Children', hexColor: '#B056A4', type: 'layer' },
    { brand: 'Citadel', name: 'Administratum Grey', hexColor: '#949B95', type: 'layer' },
    { brand: 'Citadel', name: 'Eshin Grey', hexColor: '#4A4F52', type: 'layer' },
    { brand: 'Citadel', name: 'Dawnstone', hexColor: '#697068', type: 'layer' },
    { brand: 'Citadel', name: 'Stormvermin Fur', hexColor: '#6D6B5D', type: 'layer' },
    { brand: 'Citadel', name: 'Skavenblight Dinge', hexColor: '#47413B', type: 'layer' },
    { brand: 'Citadel', name: 'Karak Stone', hexColor: '#BB9662', type: 'layer' },
    { brand: 'Citadel', name: 'Ushabti Bone', hexColor: '#BEB78D', type: 'layer' },
    { brand: 'Citadel', name: 'Screaming Skull', hexColor: '#D5D6A0', type: 'layer' },
    { brand: 'Citadel', name: 'Pallid Wych Flesh', hexColor: '#CDCEBE', type: 'layer' },
    { brand: 'Citadel', name: 'Flayed One Flesh', hexColor: '#E3C0A4', type: 'layer' },
    { brand: 'Citadel', name: 'Cadian Fleshtone', hexColor: '#C77F5B', type: 'layer' },
    { brand: 'Citadel', name: 'Kislev Flesh', hexColor: '#D29E77', type: 'layer' },

    // SHADE PAINTS (15 colors)
    { brand: 'Citadel', name: 'Nuln Oil', hexColor: '#14100E', type: 'shade' },
    { brand: 'Citadel', name: 'Agrax Earthshade', hexColor: '#3D2C1C', type: 'shade' },
    { brand: 'Citadel', name: 'Reikland Fleshshade', hexColor: '#78422E', type: 'shade' },
    { brand: 'Citadel', name: 'Carroburg Crimson', hexColor: '#571E29', type: 'shade' },
    { brand: 'Citadel', name: 'Drakenhof Nightshade', hexColor: '#1E2D44', type: 'shade' },
    { brand: 'Citadel', name: 'Athonian Camoshade', hexColor: '#283E2F', type: 'shade' },
    { brand: 'Citadel', name: 'Biel-Tan Green', hexColor: '#1BA169', type: 'shade' },
    { brand: 'Citadel', name: 'Coelia Greenshade', hexColor: '#1EA095', type: 'shade' },
    { brand: 'Citadel', name: 'Seraphim Sepia', hexColor: '#90652E', type: 'shade' },
    { brand: 'Citadel', name: 'Casandora Yellow', hexColor: '#FCA931', type: 'shade' },
    { brand: 'Citadel', name: 'Fuegan Orange', hexColor: '#E8801A', type: 'shade' },
    { brand: 'Citadel', name: 'Druchii Violet', hexColor: '#4A3757', type: 'shade' },
    { brand: 'Citadel', name: 'Cryptek Armourshade Gloss', hexColor: '#485766', type: 'shade' },
    { brand: 'Citadel', name: 'Targor Rageshade', hexColor: '#692E21', type: 'shade' },
    { brand: 'Citadel', name: 'Mortarion Grime', hexColor: '#4F5E43', type: 'shade' },

    // METALLIC PAINTS (12 colors)
    { brand: 'Citadel', name: 'Leadbelcher', hexColor: '#888D91', type: 'metallic' },
    { brand: 'Citadel', name: 'Ironbreaker', hexColor: '#A1A6A9', type: 'metallic' },
    { brand: 'Citadel', name: 'Runefang Steel', hexColor: '#C3C6C8', type: 'metallic' },
    { brand: 'Citadel', name: 'Retributor Armour', hexColor: '#C39E4A', type: 'metallic' },
    { brand: 'Citadel', name: 'Auric Armour Gold', hexColor: '#D6A856', type: 'metallic' },
    { brand: 'Citadel', name: "Gehenna's Gold", hexColor: '#B7884A', type: 'metallic' },
    { brand: 'Citadel', name: 'Balthasar Gold', hexColor: '#6F5836', type: 'metallic' },
    { brand: 'Citadel', name: 'Warplock Bronze', hexColor: '#59423C', type: 'metallic' },
    { brand: 'Citadel', name: 'Screaming Bell', hexColor: '#9A5732', type: 'metallic' },
    { brand: 'Citadel', name: 'Brass Scorpion', hexColor: '#A58D43', type: 'metallic' },
    { brand: 'Citadel', name: 'Hashut Copper', hexColor: '#7C4B2F', type: 'metallic' },
    { brand: 'Citadel', name: 'Sycorax Bronze', hexColor: '#AF865D', type: 'metallic' },

    // CONTRAST PAINTS (20 colors)
    { brand: 'Citadel', name: 'Black Templar', hexColor: '#070707', type: 'contrast' },
    { brand: 'Citadel', name: 'Blood Angels Red', hexColor: '#A80F04', type: 'contrast' },
    { brand: 'Citadel', name: 'Flesh Tearers Red', hexColor: '#A92021', type: 'contrast' },
    { brand: 'Citadel', name: 'Gryph-Charger Grey', hexColor: '#6E7B86', type: 'contrast' },
    { brand: 'Citadel', name: 'Apothecary White', hexColor: '#D5E2E2', type: 'contrast' },
    { brand: 'Citadel', name: 'Iyanden Yellow', hexColor: '#EEB200', type: 'contrast' },
    { brand: 'Citadel', name: 'Nazdreg Yellow', hexColor: '#FDCB00', type: 'contrast' },
    { brand: 'Citadel', name: 'Gryph-Hound Orange', hexColor: '#D76900', type: 'contrast' },
    { brand: 'Citadel', name: 'Mantis Warriors Green', hexColor: '#00622E', type: 'contrast' },
    { brand: 'Citadel', name: 'Warp Lightning', hexColor: '#1F7A17', type: 'contrast' },
    { brand: 'Citadel', name: 'Militarum Green', hexColor: '#54673D', type: 'contrast' },
    { brand: 'Citadel', name: 'Terradon Turquoise', hexColor: '#006276', type: 'contrast' },
    { brand: 'Citadel', name: 'Aethermatic Blue', hexColor: '#00628C', type: 'contrast' },
    { brand: 'Citadel', name: 'Ultramarines Blue', hexColor: '#002E74', type: 'contrast' },
    { brand: 'Citadel', name: 'Space Wolves Grey', hexColor: '#657688', type: 'contrast' },
    { brand: 'Citadel', name: 'Leviadon Blue', hexColor: '#00567D', type: 'contrast' },
    { brand: 'Citadel', name: 'Magos Purple', hexColor: '#583E7C', type: 'contrast' },
    { brand: 'Citadel', name: 'Shyish Purple', hexColor: '#6E3254', type: 'contrast' },
    { brand: 'Citadel', name: 'Volupus Pink', hexColor: '#8C3462', type: 'contrast' },
    { brand: 'Citadel', name: 'Snakebite Leather', hexColor: '#814E15', type: 'contrast' },

    // TECHNICAL PAINTS (8 colors)
    { brand: 'Citadel', name: 'Stirland Mud', hexColor: '#4E4636', type: 'technical' },
    { brand: 'Citadel', name: 'Armageddon Dust', hexColor: '#9C7C46', type: 'technical' },
    { brand: 'Citadel', name: 'Astrogranite', hexColor: '#757679', type: 'technical' },
    { brand: 'Citadel', name: 'Martian Ironearth', hexColor: '#944C25', type: 'technical' },
    { brand: 'Citadel', name: 'Valhallan Blizzard', hexColor: '#FFFFFF', type: 'technical' },
    { brand: 'Citadel', name: 'Nihilakh Oxide', hexColor: '#6DB5A1', type: 'technical' },
    { brand: 'Citadel', name: 'Typhus Corrosion', hexColor: '#3F3725', type: 'technical' },
    { brand: 'Citadel', name: 'Blood for the Blood God', hexColor: '#650001', type: 'technical' },

    // ===== VALLEJO MODEL COLOR (40 paints) =====
    { brand: 'Vallejo Model Color', name: 'Black', hexColor: '#000000', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'White', hexColor: '#FFFFFF', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Flat Red', hexColor: '#9F1C19', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Scarlet', hexColor: '#C01518', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Vermillion', hexColor: '#E33B2C', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Orange Red', hexColor: '#DA3A25', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Orange', hexColor: '#FD6F0A', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Golden Yellow', hexColor: '#FEDB03', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Yellow Green', hexColor: '#8FA033', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Intermediate Green', hexColor: '#6E834A', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Flat Green', hexColor: '#1F5B21', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Dark Green', hexColor: '#2A502E', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Emerald', hexColor: '#00743D', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Turquoise', hexColor: '#018789', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Deep Sky Blue', hexColor: '#007FB3', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Sky Blue', hexColor: '#5EB4CB', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Prussian Blue', hexColor: '#17395D', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Medium Blue', hexColor: '#4283A5', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Dark Blue', hexColor: '#1D315D', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Royal Purple', hexColor: '#4B3D6E', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Violet', hexColor: '#6B4E7C', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Purple', hexColor: '#8F3E7E', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Magenta', hexColor: '#952E57', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Burnt Umber', hexColor: '#6E4729', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Flat Brown', hexColor: '#664021', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Chocolate Brown', hexColor: '#3B2714', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Beige Brown', hexColor: '#925F2F', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'German Camo Beige', hexColor: '#9C8A70', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Buff', hexColor: '#D0B279', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Ivory', hexColor: '#F3E4C5', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Medium Grey', hexColor: '#898988', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Dark Grey', hexColor: '#5C5C5C', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Light Grey', hexColor: '#C2BCAF', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Flat Flesh', hexColor: '#D08B5B', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Beige Red', hexColor: '#C77764', type: 'layer' },
    { brand: 'Vallejo Model Color', name: 'Basic Skintone', hexColor: '#BB7952', type: 'base' },
    { brand: 'Vallejo Model Color', name: 'Gun Metal', hexColor: '#414141', type: 'metallic' },
    { brand: 'Vallejo Model Color', name: 'Silver', hexColor: '#9DA3A4', type: 'metallic' },
    { brand: 'Vallejo Model Color', name: 'Gold', hexColor: '#C49B43', type: 'metallic' },
    { brand: 'Vallejo Model Color', name: 'Copper', hexColor: '#AB6F3E', type: 'metallic' },

    // ===== ARMY PAINTER (40 paints) =====
    { brand: 'Army Painter', name: 'Matt Black', hexColor: '#000000', type: 'base' },
    { brand: 'Army Painter', name: 'Matt White', hexColor: '#FFFFFF', type: 'base' },
    { brand: 'Army Painter', name: 'Pure Red', hexColor: '#A92121', type: 'base' },
    { brand: 'Army Painter', name: 'Dragon Red', hexColor: '#C1272D', type: 'layer' },
    { brand: 'Army Painter', name: 'Lava Orange', hexColor: '#FF6A00', type: 'layer' },
    { brand: 'Army Painter', name: 'Daemonic Yellow', hexColor: '#FFD300', type: 'layer' },
    { brand: 'Army Painter', name: 'Greenskin', hexColor: '#6E8F47', type: 'base' },
    { brand: 'Army Painter', name: 'Angel Green', hexColor: '#42BA8A', type: 'layer' },
    { brand: 'Army Painter', name: 'Mutant Hue', hexColor: '#94E864', type: 'layer' },
    { brand: 'Army Painter', name: 'Elf Green', hexColor: '#007F4F', type: 'base' },
    { brand: 'Army Painter', name: 'Goblin Green', hexColor: '#438317', type: 'base' },
    { brand: 'Army Painter', name: 'Ultramarine Blue', hexColor: '#0F4F8F', type: 'base' },
    { brand: 'Army Painter', name: 'Electric Blue', hexColor: '#41C9FF', type: 'layer' },
    { brand: 'Army Painter', name: 'Deep Blue', hexColor: '#232750', type: 'base' },
    { brand: 'Army Painter', name: 'Alien Purple', hexColor: '#5E1958', type: 'base' },
    { brand: 'Army Painter', name: 'Oak Brown', hexColor: '#6C3F10', type: 'base' },
    { brand: 'Army Painter', name: 'Leather Brown', hexColor: '#4B3A2A', type: 'base' },
    { brand: 'Army Painter', name: 'Desert Yellow', hexColor: '#CEB072', type: 'base' },
    { brand: 'Army Painter', name: 'Babe Blonde', hexColor: '#FFE4AE', type: 'layer' },
    { brand: 'Army Painter', name: 'Dirt Spatter', hexColor: '#7E5E3C', type: 'base' },
    { brand: 'Army Painter', name: 'Barbarian Flesh', hexColor: '#D1956F', type: 'base' },
    { brand: 'Army Painter', name: 'Tanned Flesh', hexColor: '#BE6C52', type: 'layer' },
    { brand: 'Army Painter', name: 'Drake Tooth', hexColor: '#AF8E59', type: 'layer' },
    { brand: 'Army Painter', name: 'Kobold Skin', hexColor: '#BE704E', type: 'layer' },
    { brand: 'Army Painter', name: 'Gun Metal', hexColor: '#585B62', type: 'metallic' },
    { brand: 'Army Painter', name: 'Plate Mail Metal', hexColor: '#9DA5AA', type: 'metallic' },
    { brand: 'Army Painter', name: 'Shining Silver', hexColor: '#C3C8CE', type: 'metallic' },
    { brand: 'Army Painter', name: 'Greedy Gold', hexColor: '#CDA03A', type: 'metallic' },
    { brand: 'Army Painter', name: 'Weapon Bronze', hexColor: '#9F7A56', type: 'metallic' },
    { brand: 'Army Painter', name: 'Bright Gold', hexColor: '#F5E053', type: 'metallic' },
    { brand: 'Army Painter', name: 'Dark Tone Ink', hexColor: '#1C1410', type: 'shade' },
    { brand: 'Army Painter', name: 'Strong Tone Ink', hexColor: '#2F231A', type: 'shade' },
    { brand: 'Army Painter', name: 'Soft Tone Ink', hexColor: '#B89969', type: 'shade' },
    { brand: 'Army Painter', name: 'Light Tone Ink', hexColor: '#D5BB7D', type: 'shade' },
    { brand: 'Army Painter', name: 'Red Tone Ink', hexColor: '#8F1A1D', type: 'shade' },
    { brand: 'Army Painter', name: 'Green Tone Ink', hexColor: '#2D3C23', type: 'shade' },
    { brand: 'Army Painter', name: 'Blue Tone Ink', hexColor: '#1F2B46', type: 'shade' },
    { brand: 'Army Painter', name: 'Purple Tone Ink', hexColor: '#3D2245', type: 'shade' },
    { brand: 'Army Painter', name: 'Tanned Skin Tone Ink', hexColor: '#9A6E44', type: 'shade' },
    { brand: 'Army Painter', name: 'Military Shader', hexColor: '#685F47', type: 'shade' },

    // ===== REAPER MSP (20 paints) =====
    { brand: 'Reaper MSP', name: 'Black', hexColor: '#000000', type: 'base' },
    { brand: 'Reaper MSP', name: 'Pure White', hexColor: '#FFFFFF', type: 'base' },
    { brand: 'Reaper MSP', name: 'Blood Red', hexColor: '#9B1313', type: 'base' },
    { brand: 'Reaper MSP', name: 'Carnage Red', hexColor: '#B21B20', type: 'layer' },
    { brand: 'Reaper MSP', name: 'Fiery Orange', hexColor: '#F2661F', type: 'layer' },
    { brand: 'Reaper MSP', name: 'Golden Yellow', hexColor: '#FFD837', type: 'layer' },
    { brand: 'Reaper MSP', name: 'Forest Green', hexColor: '#2E5B3F', type: 'base' },
    { brand: 'Reaper MSP', name: 'Grass Green', hexColor: '#449153', type: 'layer' },
    { brand: 'Reaper MSP', name: 'Imperial Blue', hexColor: '#1F4788', type: 'base' },
    { brand: 'Reaper MSP', name: 'Sky Blue', hexColor: '#4998C5', type: 'layer' },
    { brand: 'Reaper MSP', name: 'Royal Purple', hexColor: '#502A6B', type: 'base' },
    { brand: 'Reaper MSP', name: 'Violet Red', hexColor: '#862657', type: 'layer' },
    { brand: 'Reaper MSP', name: 'Rust Brown', hexColor: '#6F3E1E', type: 'base' },
    { brand: 'Reaper MSP', name: 'Terran Khaki', hexColor: '#997953', type: 'layer' },
    { brand: 'Reaper MSP', name: 'Stone Grey', hexColor: '#757575', type: 'base' },
    { brand: 'Reaper MSP', name: 'Aged Bone', hexColor: '#C9B591', type: 'layer' },
    { brand: 'Reaper MSP', name: 'Tanned Skin', hexColor: '#D59B6A', type: 'base' },
    { brand: 'Reaper MSP', name: 'Fair Skin', hexColor: '#E5B89D', type: 'layer' },
    { brand: 'Reaper MSP', name: 'Honed Steel', hexColor: '#9CA5AD', type: 'metallic' },
    { brand: 'Reaper MSP', name: 'Antique Gold', hexColor: '#C4994D', type: 'metallic' },

    // ===== P3 PAINTS (15 paints) =====
    { brand: 'P3', name: 'Thamar Black', hexColor: '#000000', type: 'base' },
    { brand: 'P3', name: 'Morrow White', hexColor: '#FFFFFF', type: 'base' },
    { brand: 'P3', name: 'Khador Red Base', hexColor: '#8B1A1A', type: 'base' },
    { brand: 'P3', name: 'Khador Red Highlight', hexColor: '#B32E2E', type: 'layer' },
    { brand: 'P3', name: 'Cygnar Blue Base', hexColor: '#1A5C86', type: 'base' },
    { brand: 'P3', name: 'Cygnar Blue Highlight', hexColor: '#247EB8', type: 'layer' },
    { brand: 'P3', name: 'Cryx Bane Base', hexColor: '#2E4650', type: 'base' },
    { brand: 'P3', name: 'Menoth White Base', hexColor: '#D2D1BF', type: 'base' },
    { brand: 'P3', name: 'Ryn Flesh', hexColor: '#E4B494', type: 'layer' },
    { brand: 'P3', name: 'Rucksack Tan', hexColor: '#9F8560', type: 'base' },
    { brand: 'P3', name: 'Thornwood Green', hexColor: '#3B5241', type: 'base' },
    { brand: 'P3', name: 'Pig Iron', hexColor: '#5C6469', type: 'metallic' },
    { brand: 'P3', name: 'Blighted Gold', hexColor: '#A48744', type: 'metallic' },
    { brand: 'P3', name: 'Moldy Ochre', hexColor: '#7A6F3A', type: 'base' },
    { brand: 'P3', name: 'Battlefield Brown', hexColor: '#705941', type: 'base' },
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
