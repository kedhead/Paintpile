import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  increment,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { ProjectPaint } from '@/types/paint';
import { Paint } from '@/types/paint';
import { getPaintsByIds } from './paints';

/**
 * Add a paint to a project's paint library
 */
export async function addPaintToProject(
  projectId: string,
  paintId: string,
  notes?: string
): Promise<void> {
  const paintRef = doc(db, 'projects', projectId, 'paints', paintId);

  const paintDoc: ProjectPaint = {
    paintId,
    projectId,
    addedAt: serverTimestamp() as any,
    notes,
    usageCount: 0,
  };

  await setDoc(paintRef, paintDoc);
}

/**
 * Get all paints used in a project
 */
export async function getProjectPaints(projectId: string): Promise<Paint[]> {
  const paintsRef = collection(db, 'projects', projectId, 'paints');
  const q = query(paintsRef, orderBy('addedAt', 'desc'));
  const querySnapshot = await getDocs(q);

  // Get paint IDs
  const paintIds = querySnapshot.docs.map(doc => doc.data().paintId);

  if (paintIds.length === 0) {
    return [];
  }

  // Fetch full paint details
  const paints = await getPaintsByIds(paintIds);

  return paints;
}

/**
 * Get project paint metadata (usage count, notes)
 */
export async function getProjectPaint(
  projectId: string,
  paintId: string
): Promise<ProjectPaint | null> {
  const paintRef = doc(db, 'projects', projectId, 'paints', paintId);
  const paintSnap = await getDoc(paintRef);

  if (!paintSnap.exists()) {
    return null;
  }

  return paintSnap.data() as ProjectPaint;
}

/**
 * Remove a paint from a project's paint library
 */
export async function removePaintFromProject(
  projectId: string,
  paintId: string
): Promise<void> {
  const paintRef = doc(db, 'projects', projectId, 'paints', paintId);
  await deleteDoc(paintRef);
}

/**
 * Update notes for a paint in a project
 */
export async function updateProjectPaintNotes(
  projectId: string,
  paintId: string,
  notes: string
): Promise<void> {
  const paintRef = doc(db, 'projects', projectId, 'paints', paintId);
  await updateDoc(paintRef, { notes });
}

/**
 * Increment or decrement the usage count for a paint in a project
 */
export async function incrementPaintUsage(
  projectId: string,
  paintId: string,
  value: number = 1
): Promise<void> {
  const paintRef = doc(db, 'projects', projectId, 'paints', paintId);

  const paintSnap = await getDoc(paintRef);

  if (!paintSnap.exists()) {
    // If paint doesn't exist in project, add it with initial usage count
    await addPaintToProject(projectId, paintId);
  }

  await updateDoc(paintRef, {
    usageCount: increment(value),
  });
}
