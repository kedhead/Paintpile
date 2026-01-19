import { Timestamp } from 'firebase/firestore';

export type ChallengeStatus = 'draft' | 'active' | 'voting' | 'completed';
export type ChallengeType = 'painting' | 'kitbash' | 'community';

export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: ChallengeType;
    status: ChallengeStatus;
    isActive: boolean; // Computed or legacy? Let's deprecate isActive in favor of status=='active' but keep for compat if needed. Actually let's aim to migrate.
    startDate: Timestamp;
    endDate: Timestamp;
    rewardBadgeId?: string; // Optional link to a badge
    coverImageUrl?: string;
    participantCount: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface ChallengeEntry {
    entryId: string; // usually same as projectId
    challengeId: string; // Parent ID
    userId: string;
    projectId: string;
    photoUrl: string; // Snapshot of project cover at time of submission
    projectTitle: string;
    submittedAt: Timestamp;
    votes?: number;
    userDisplayName?: string;
    userPhotoUrl?: string;
}

export type CreateChallengeData = Omit<Challenge, 'id' | 'createdAt' | 'updatedAt' | 'participantCount' | 'isActive'> & {
    isActive?: boolean;
};
