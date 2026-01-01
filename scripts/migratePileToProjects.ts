import { getDocs, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { PileItem } from '@/types/pile';

/**
 * Migration script to convert pile items to projects with 'shame' tag
 * 
 * Status mapping:
 * - unpainted → not-started
 * - painting → in-progress  
 * - painted → completed
 * 
 * Field mapping:
 * - notes → description
 * - quantity → quantity
 * - tags: ['shame']
 */
export async function migratePileToProjects(): Promise<{
  success: number;
  errors: number;
  total: number;
}> {
  const results = {
    success: 0,
    errors: 0,
    total: 0,
  };

  try {
    // Fetch all pile items
    const pileRef = collection(db, 'pile');
    const pileSnapshot = await getDocs(pileRef);

    results.total = pileSnapshot.size;
    console.log(`Found ${results.total} pile items to migrate`);

    if (results.total === 0) {
      console.log('No pile items to migrate');
      return results;
    }

    // Process each pile item
    for (const pileDoc of pileSnapshot.docs) {
      try {
        const pileItem = pileDoc.data() as PileItem;

        // Map pile status to project status
        let projectStatus: 'not-started' | 'in-progress' | 'completed';
        switch (pileItem.status) {
          case 'unpainted':
            projectStatus = 'not-started';
            break;
          case 'painting':
            projectStatus = 'in-progress';
            break;
          case 'painted':
            projectStatus = 'completed';
            break;
          default:
            projectStatus = 'not-started';
        }

        // Create project document with same ID as pile item for traceability
        const projectsRef = collection(db, 'projects');
        const newProjectRef = doc(projectsRef);

        const project = {
          projectId: newProjectRef.id,
          userId: pileItem.userId,
          name: pileItem.name,
          description: pileItem.notes || '',
          type: pileItem.type,
          status: projectStatus,
          quantity: pileItem.quantity,
          tags: ['shame'],
          startDate: null,
          createdAt: pileItem.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          isPublic: false,
          photoCount: 0,
          paintCount: 0,
        };

        await setDoc(newProjectRef, project);
        results.success++;
        console.log(`✓ Migrated: ${pileItem.name} (${pileItem.pileId} → ${newProjectRef.id})`);
      } catch (error) {
        results.errors++;
        console.error(`✗ Error migrating pile item ${pileDoc.id}:`, error);
      }
    }

    console.log(`\nMigration complete:`);
    console.log(`- Total pile items: ${results.total}`);
    console.log(`- Successfully migrated: ${results.success}`);
    console.log(`- Errors: ${results.errors}`);

    return results;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
