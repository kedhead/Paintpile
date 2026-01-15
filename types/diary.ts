import { Timestamp } from 'firebase/firestore';

export interface DiaryLink {
    url: string;
    description?: string;
    type: 'youtube' | 'article' | 'image' | 'other';
}

export interface DiaryEntry {
    entryId: string;
    userId: string;
    title: string;
    content: string; // Rich text or markdown support in future, plain text for now
    links: DiaryLink[];
    tags: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface DiaryEntryFormData {
    title: string;
    content: string;
    links: DiaryLink[];
    tags: string[];
}
