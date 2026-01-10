import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { ProjectTechnique, TechniqueFormData } from '@/types/technique';
import { createTimelineEvent } from './timeline';

/**
 * Add a technique to a project
 */
export async function addTechnique(
  projectId: string,
  data: TechniqueFormData,
  userId?: string
): Promise<string> {
  const techniquesRef = collection(db, 'projects', projectId, 'techniques');
  const newTechniqueRef = doc(techniquesRef);

  const technique: ProjectTechnique = {
    techniqueId: newTechniqueRef.id,
    projectId,
    name: data.name,
    category: data.category,
    description: data.description,
    photoIds: [],
    addedAt: serverTimestamp() as any,
  };

  await setDoc(newTechniqueRef, technique);

  // Create timeline event if userId provided
  if (userId) {
    await createTimelineEvent(projectId, userId, 'technique_added', {
      techniqueId: newTechniqueRef.id,
      techniqueName: data.name,
      techniqueCategory: data.category,
    });
  }

  return newTechniqueRef.id;
}

/**
 * Get all techniques for a project
 */
export async function getProjectTechniques(projectId: string): Promise<ProjectTechnique[]> {
  const techniquesRef = collection(db, 'projects', projectId, 'techniques');
  const q = query(techniquesRef, orderBy('addedAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => doc.data() as ProjectTechnique);
}

/**
 * Associate a photo with a technique
 */
export async function addPhotoToTechnique(
  projectId: string,
  techniqueId: string,
  photoId: string
): Promise<void> {
  const techniqueRef = doc(db, 'projects', projectId, 'techniques', techniqueId);

  await updateDoc(techniqueRef, {
    photoIds: arrayUnion(photoId),
  });
}

/**
 * Remove a photo from a technique
 */
export async function removePhotoFromTechnique(
  projectId: string,
  techniqueId: string,
  photoId: string
): Promise<void> {
  const techniqueRef = doc(db, 'projects', projectId, 'techniques', techniqueId);

  await updateDoc(techniqueRef, {
    photoIds: arrayRemove(photoId),
  });
}

/**
 * Delete a technique from a project
 */
export async function deleteTechnique(
  projectId: string,
  techniqueId: string
): Promise<void> {
  const techniqueRef = doc(db, 'projects', projectId, 'techniques', techniqueId);
  await deleteDoc(techniqueRef);
}

/**
 * Update a technique
 */
export async function updateTechnique(
  projectId: string,
  techniqueId: string,
  data: Partial<TechniqueFormData>
): Promise<void> {
  const techniqueRef = doc(db, 'projects', projectId, 'techniques', techniqueId);
  await updateDoc(techniqueRef, data);
}
