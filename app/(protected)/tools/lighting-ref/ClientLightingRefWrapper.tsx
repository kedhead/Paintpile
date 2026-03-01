'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { LightingRefTool } from '@/components/tools/LightingRefTool';

export function ClientLightingRefWrapper() {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                Please sign in to use this tool.
            </div>
        );
    }

    return <LightingRefTool userId={currentUser.uid} />;
}
