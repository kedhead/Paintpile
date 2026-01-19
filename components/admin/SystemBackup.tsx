'use client';

import { useState } from 'react';
import { Download, AlertTriangle, Upload } from 'lucide-react';
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

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('⚠️ WARNING: This will merge/overwrite database records with data from the backup. This action cannot be undone. Are you sure?')) {
            e.target.value = ''; // Reset input
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const token = await getAuthToken();
            if (!token) throw new Error('Not authenticated');

            const fileContent = await file.text();
            const backupData = JSON.parse(fileContent);

            const response = await fetch('/api/admin/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(backupData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Restore failed');
            }

            alert(result.message || 'Restore completed successfully!');
            e.target.value = ''; // Reset input

        } catch (err: any) {
            console.error('Restore error:', err);
            setError(`Restore failed: ${err.message}`);
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
                <div className="flex-1 space-y-4">
                    <div>
                        <h2 className="text-xl font-bold text-foreground mb-1">
                            System Backup & Restore
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Download snapshots or restore from a previous backup file.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-md flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBackup}
                            disabled={loading}
                        >
                            {loading ? 'Processing...' : 'Download Backup'}
                        </Button>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleRestore}
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                disabled={loading}
                            />
                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={loading}
                                className="pointer-events-none" // Events handled by input
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Restore from File
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
