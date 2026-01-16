export type NewsType = 'update' | 'feature' | 'announcement' | 'maintenance';

export interface NewsPost {
    id: string;
    title: string;
    content: string;
    type: NewsType;
    date: any; // Firestore Timestamp
    authorId: string;
    authorName?: string;
    createdAt: any;
    updatedAt: any;
}

export interface NewsFormData {
    title: string;
    content: string;
    type: NewsType;
}
