import { Timestamp } from 'firebase/firestore';

export type PaintType = 'base' | 'layer' | 'shade' | 'metallic' | 'technical' | 'contrast';

export interface Paint {
  paintId: string;
  brand: string;
  name: string;
  hexColor: string;
  type: PaintType;
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
