'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';

export function SyncFeedVisibility() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSync = async () => {
        setLoading(true);
        setResult(null);

        try {
            const token = await getToken();
            const response = await fetch('/api/admin/sync-visibility', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setResult({ success: true, message: data.message });
            } else {
                setResult({ success: false, message: data.error || 'Failed to sync visibility' });
            }
        } catch (err) {
            setResult({ success: false, message: 'An error occurred while syncing' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors h-full">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                    <RefreshCw className={`w-6 h-6 text-primary ${loading ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Sync Feed Visibility
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Retroactively update activity visibility to match current Project/Army public status.
                        Use this if public projects are missing from the feed.
                    </p>

                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSync}
                            disabled={loading}
                        >
                            {loading ? 'Syncing...' : 'Run Sync Now'}
                        </Button>

                        {result && (
                            <div className={`text-sm flex items-center gap-2 ${result.success ? 'text-green-500' : 'text-destructive'
                                }`}>
                                {result.success ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                {result.message}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
