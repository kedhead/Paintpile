import {
    collection,
    doc,
    setDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    limit,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { NewsPost, NewsFormData } from '@/types/news';

export const NEWS_COLLECTION = 'site_news';

/**
 * Create a new news post (Admin only)
 */
export async function createNewsPost(userId: string, data: NewsFormData): Promise<string> {
    const newsRef = collection(db, NEWS_COLLECTION);
    const newDocRef = doc(newsRef);
    const id = newDocRef.id;

    const post: Omit<NewsPost, 'date' | 'createdAt' | 'updatedAt'> & {
        date: any;
        createdAt: any;
        updatedAt: any;
    } = {
        id,
        title: data.title,
        content: data.content,
        type: data.type,
        authorId: userId,
        date: serverTimestamp(), // Display date defaults to creation time
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, post);
    return id;
}

/**
 * Get recent news posts
 */
export async function getNewsPosts(limitCount: number = 20): Promise<NewsPost[]> {
    const newsRef = collection(db, NEWS_COLLECTION);

    const q = query(
        newsRef,
        orderBy('date', 'desc'),
        limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as NewsPost);
}

/**
 * Delete a news post (Admin only)
 */
export async function deleteNewsPost(id: string): Promise<void> {
    const docRef = doc(db, NEWS_COLLECTION, id);
    await deleteDoc(docRef);
}
