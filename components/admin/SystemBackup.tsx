'use client';

import { useState } from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

export function SystemBackup() {
    const { getAuthToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBackup = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = await getAuthToken();
            if (!token) throw new Error('Not authenticated');

            const response = await fetch('/api/admin/backup', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to generate backup');
            }

            // Convert to blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `paintpile-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            console.error('Backup error:', err);
            setError('Failed to create backup. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors h-full">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                    <Download className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        System Backup
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                        Download a full JSON snapshot of the database for disaster recovery.
                    </p>

                    {error && (
                        <div className="mb-4 p-3 bg-destructive/10 text-destructive text-xs rounded-md flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBackup}
                        disabled={loading}
                    >
                        {loading ? 'Generating Backup...' : 'Download Backup →'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
