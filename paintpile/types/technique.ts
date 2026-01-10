import { Timestamp } from 'firebase/firestore';

export type TechniqueCategory =
  | 'nmm'              // Non-Metallic Metal
  | 'osl'              // Object Source Lighting
  | 'drybrushing'
  | 'layering'
  | 'glazing'
  | 'washing'
  | 'blending'
  | 'feathering'
  | 'stippling'
  | 'wetblending'
  | 'zenithal'
  | 'other';

export interface ProjectTechnique {
  techniqueId: string;
  projectId: string;
  name: string;
  category: TechniqueCategory;
  description?: string;
  photoIds: string[];        // Photos where this technique was used
  addedAt: Timestamp;
}

export interface TechniqueFormData {
  name: string;
  category: TechniqueCategory;
  description?: string;
}

// Human-readable labels for technique categories
export const TECHNIQUE_LABELS: Record<TechniqueCategory, string> = {
  nmm: 'Non-Metallic Metal',
  osl: 'Object Source Lighting',
  drybrushing: 'Drybrushing',
  layering: 'Layering',
  glazing: 'Glazing',
  washing: 'Washing',
  blending: 'Blending',
  feathering: 'Feathering',
  stippling: 'Stippling',
  wetblending: 'Wet Blending',
  zenithal: 'Zenithal Priming',
  other: 'Other',
};
