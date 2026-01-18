import { Timestamp } from 'firebase/firestore';

export type PaintType = 'base' | 'layer' | 'shade' | 'metallic' | 'technical' | 'contrast';

export interface Paint {
  paintId: string;
  brand: string;
  name: string;
  hexColor: string;
  type: PaintType;
  category?: string; // e.g. "Speedpaint 2.0", "Model Color", etc.
  swatchUrl?: string;
}

export interface CustomPaint extends Paint {
  userId: string;
  createdAt: Timestamp;
}

export interface ProjectPaint {
  paintId: string;
  projectId: string;
  addedAt: Timestamp;
  notes?: string;            // User notes about this paint in the project
  usageCount: number;        // How many photos/annotations use this paint
}

export interface UserOwnedPaint {
  docId?: string;       // Firestore document ID (usually same as paintId or composite)
  userId: string;
  paintId: string;
  quantity: number;     // Usually 1
  notes?: string;       // Private notes (e.g. "Low", "Dried out")
  acquiredAt: Timestamp;
}
