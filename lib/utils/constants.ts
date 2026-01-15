import { ProjectStatus } from '@/types/project';
import { PaintType } from '@/types/paint';
import { PileStatus, PileType } from '@/types/pile';

// Project Status Options
export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

// Project Tags
export const TAG_SHAME = 'shame';

// Suggested tags for projects (users can also create custom tags)
export const SUGGESTED_TAGS = [
  // Status/Purpose Tags
  'shame',
  'commission',
  'personal',
  'gift',
  'competition',
  'tutorial',
  'showcase',

  // Game System Tags  
  'warhammer',
  'warhammer-40k',
  'age-of-sigmar',
  'd&d',
  'pathfinder',
  'historical',
  'star-wars',
  'board-game',

  // Model Type Tags
  'infantry',
  'vehicle',
  'monster',
  'terrain',
  'character',

  // Other
  'custom',
  'kitbash',
  'conversion',
] as const;

// Pile Types
export const PILE_TYPES: { value: PileType; label: string }[] = [
  { value: 'warhammer', label: 'Warhammer' },
  { value: 'd&d', label: 'D&D' },
  { value: 'historical', label: 'Historical' },
  { value: 'board-game', label: 'Board Game' },
  { value: 'other', label: 'Other' },
];

// Pile Status Options
export const PILE_STATUSES: { value: PileStatus; label: string }[] = [
  { value: 'unpainted', label: 'Unpainted' },
  { value: 'painting', label: 'Painting' },
  { value: 'painted', label: 'Painted' },
];

// Paint Brands
export const PAINT_BRANDS = [
  'Citadel',
  'Vallejo Model Color',
  'Vallejo Game Color',
  'Army Painter',
  'Reaper MSP',
  'Scale75',
  'ProAcryl',
  'Kimera',
  'AK Interactive',
  'P3',
  'Custom',
];

// Paint Types
export const PAINT_TYPES: { value: PaintType; label: string }[] = [
  { value: 'base', label: 'Base' },
  { value: 'layer', label: 'Layer' },
  { value: 'shade', label: 'Shade' },
  { value: 'metallic', label: 'Metallic' },
  { value: 'technical', label: 'Technical' },
  { value: 'contrast', label: 'Contrast' },
];

// Painting Technique Tags
export const TECHNIQUE_TAGS = [
  'OSL (Object Source Lighting)',
  'NMM (Non-Metallic Metal)',
  'TMM (True Metallic Metal)',
  'Weathering',
  'Freehand',
  'Wet Blending',
  'Glazing',
  'Drybrushing',
  'Edge Highlighting',
  'Zenithal',
  'Airbrush',
];

// File Upload Constraints
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGE_WIDTH = 1920;
export const THUMBNAIL_WIDTH = 400;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
