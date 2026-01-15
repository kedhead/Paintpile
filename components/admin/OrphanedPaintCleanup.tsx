'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInventory, removeFromInventory } from '@/lib/firestore/inventory';
import { getAllPaints } from '@/lib/firestore/paints';
import { Paint } from '@/types/paint';

export function OrphanedPaintCleanup() {
    const { currentUser } = useAuth();
    const [scanning, setScanning] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [orphanedIds, setOrphanedIds] = useState<string[]>([]);
    const [scanned, setScanned] = useState(false);
    const [cleanedCount, setCleanedCount] = useState(0);

    const scanInventory = async () => {
        if (!currentUser) return;
        setScanning(true);
        setScanned(false);
        setCleanedCount(0);
        setOrphanedIds([]);

        try {
            // 1. Fetch all valid paints
            const allPaints = await getAllPaints();
            const validPaintIds = new Set(allPaints.map(p => p.paintId));

            // 2. Fetch user inventory
            const inventory = await getUserInventory(currentUser.uid);

            // 3. Find orphans
            const orphans = inventory
                .filter(item => !validPaintIds.has(item.paintId))
                .map(item => item.paintId);

            setOrphanedIds(orphans);
            setScanned(true);
        } catch (error) {
            console.error('Error scanning inventory:', error);
        } finally {
            setScanning(false);
        }
    };

    const cleanOrphans = async () => {
        if (!currentUser || orphanedIds.length === 0) return;
        setCleaning(true);

        try {
            let count = 0;
            for (const paintId of orphanedIds) {
                await removeFromInventory(currentUser.uid, paintId);
                count++;
            }
            setCleanedCount(count);
            setOrphanedIds([]); // Clear the list as they are gone
        } catch (error) {
            console.error('Error cleaning orphans:', error);
        } finally {
            setCleaning(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-lg p-6 hover:border-destructive/50 transition-colors h-full">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-destructive/10 rounded-lg">
                    <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Cleanup Orphaned Paints
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Scan your inventory for paints that no longer exist in the database and remove them.
                    </p>

                    <div className="flex flex-col gap-3">
                        {!scanned && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={scanInventory}
                                disabled={scanning}
                                className="w-full sm:w-auto"
                            >
                                {scanning ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        Scanning...
                                    </>
                                ) : (
                                    'Scan Inventory'
                                )}
                            </Button>
                        )}

                        {scanned && orphanedIds.length === 0 && (
                            <div className="flex items-center text-green-600 dark:text-green-500 text-sm mt-2">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                No orphaned paints found.
                            </div>
                        )}

                        {scanned && orphanedIds.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center text-amber-600 dark:text-amber-500 text-sm">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Found {orphanedIds.length} orphaned items.
                                </div>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={cleanOrphans}
                                    disabled={cleaning}
                                    className="w-full"
                                >
                                    {cleaning ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Cleaning...
                                        </>
                                    ) : (
                                        `Remove ${orphanedIds.length} Items`
                                    )}
                                </Button>
                            </div>
                        )}

                        {cleanedCount > 0 && (
                            <div className="flex items-center text-green-600 dark:text-green-500 text-sm mt-2">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Successfully removed {cleanedCount} items.
                            </div>
                        )}

                        {/* Reset button to scan again */}
                        {(scanned || cleanedCount > 0) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={scanInventory}
                                className="mt-2 h-8 text-muted-foreground"
                            >
                                Scan Again
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
