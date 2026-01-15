'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllPaints } from '@/lib/firestore/paints';
import { getUserInventory } from '@/lib/firestore/inventory';
import { ColorMatcher } from '@/components/tools/ColorMatcher';
import { Paint, UserOwnedPaint } from '@/types/paint';
import { Spinner } from '@/components/ui/Spinner';

export function ClientColorMatchWrapper() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [allPaints, setAllPaints] = useState<Paint[]>([]);
    const [inventory, setInventory] = useState<UserOwnedPaint[]>([]);

    useEffect(() => {
        async function loadData() {
            if (!currentUser) return;

            try {
                // Fetch data in parallel
                const [paintsData, inventoryData] = await Promise.all([
                    getAllPaints(),
                    getUserInventory(currentUser.uid)
                ]);

                setAllPaints(paintsData);
                setInventory(inventoryData);
            } catch (error) {
                console.error('Failed to load data for color matcher:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return <ColorMatcher allPaints={allPaints} userInventory={inventory} />;
}
