'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { updatePresence } from '@/lib/firestore/users';

const PRESENCE_INTERVAL = 5 * 60 * 1000; // 5 Minutes

export function usePresence() {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) return;

        // Update immediately on mount/login
        updatePresence(currentUser.uid).catch(console.error);

        // Then update every interval
        const interval = setInterval(() => {
            updatePresence(currentUser.uid).catch(console.error);
        }, PRESENCE_INTERVAL);

        return () => clearInterval(interval);
    }, [currentUser]);
}
