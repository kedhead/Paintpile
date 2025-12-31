import { Timestamp } from 'firebase/firestore';

export type PileStatus = 'unpainted' | 'painting' | 'painted';

export interface PileItem {
  pileId: string;
  name: string;
  type: string;
  quantity: number;
  status: PileStatus;
  addedDate: Timestamp;
  projectId?: string;
}

export interface PileFormData {
  name: string;
  type: string;
  quantity: number;
}
