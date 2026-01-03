import { Timestamp } from 'firebase/firestore';
import { Paint } from './paint';

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
  aiProcessing?: {
    backgroundRemoval?: AIProcessingResult;
    upscaling?: AIProcessingResult;
    enhancement?: AIProcessingResult;
    paintSuggestions?: PaintSuggestionsResult;
  };
}

export interface PhotoAnnotation {
  id: string;
  x: number;                    // X coordinate (percentage 0-100)
  y: number;                    // Y coordinate (percentage 0-100)
  label: string;                // "Hat", "Skin", "Jacket"
  notes?: string;               // User notes about this annotation
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

// AI Processing Types
export interface AIProcessingResult {
  status: 'processing' | 'completed' | 'failed';
  processedAt: Timestamp;
  url?: string;
  error?: string;
  costCredits?: number;  // 1 credit = $0.001
}

export interface PaintSuggestionsResult {
  status: 'processing' | 'completed' | 'failed';
  processedAt: Timestamp;
  suggestions?: ColorSuggestion[];
  error?: string;
  costCredits?: number;
}

export interface ColorSuggestion {
  hexColor: string;
  description: string;
  matchedPaints: Paint[];
  confidence: number;
  location?: 'base' | 'highlight' | 'shadow' | 'general';
}
