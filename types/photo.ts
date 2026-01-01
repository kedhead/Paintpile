import { Timestamp } from 'firebase/firestore';

export interface Photo {
  photoId: string;
  userId: string;
  projectId: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  paintIds?: string[];
  createdAt: Timestamp;
  width: number;
  height: number;
  annotations?: PhotoAnnotation[];
}

export interface PhotoAnnotation {
  id: string;
  x: number;                    // X coordinate (percentage 0-100)
  y: number;                    // Y coordinate (percentage 0-100)
  label: string;                // "Hat", "Skin", "Jacket"
  recipeId?: string;            // Optional link to saved recipe
  paints: AnnotationPaint[];    // Paints for this area
}

export interface AnnotationPaint {
  paintId: string;
  role: 'base' | 'highlight' | 'shadow';
  ratio?: string;
  notes?: string;
}

export interface PhotoUpload {
  file: File;
  preview: string;
  caption?: string;
  paintIds?: string[];
}
