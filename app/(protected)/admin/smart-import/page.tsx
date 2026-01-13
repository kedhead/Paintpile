'use client';

import { useState, useEffect } from 'react';
import { Shield, Upload, Loader2, CheckCircle2, AlertCircle, Database, Info } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { isUserAdmin } from '@/lib/auth/admin-check';

export default function SmartImportPaintsPage() {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function checkAdmin() {
      setAdminCheckLoading(true);
      const adminStatus = await isUserAdmin(currentUser);
      setIsAdmin(adminStatus);
      setAdminCheckLoading(false);
    }
    checkAdmin();
  }, [currentUser]);

  const handleImport = async (dryRun: boolean) => {
    setIsImporting(true);
    setIsDryRun(dryRun);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/smart-import-paints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'seed',
          updateExisting,
          dryRun,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Import failed');
      }

      setResult(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to import paints');
    } finally {
      setIsImporting(false);
    }
  };

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            You do not have permission to access this page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Database className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Smart Paint Import</h1>
          </div>
          <p className="text-muted-foreground">
            Import paints without creating duplicates
          </p>
        </div>

        {/* Info Card */}
        <Card className="p-6 mb-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                How Smart Import Works
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Checks each paint against existing database using brand + name</li>
                <li>• <strong>Skips duplicates</strong> - won't create multiple entries for the same paint</li>
                <li>• <strong>Only adds new paints</strong> - safe to run multiple times</li>
                <li>• <strong>Preserves user data</strong> - doesn't wipe existing paints</li>
                <li>• Use "Preview" to see what would happen before committing</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Controls */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Import Options</h2>

          <div className="space-y-4 mb-6">
            <label className="flex items-start gap-3 p-4 border border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">Update Existing Paints</div>
                <div className="text-sm text-muted-foreground">
                  If a paint already exists, update it with new data (hex code, type, etc.)
                </div>
              </div>
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => handleImport(true)}
              disabled={isImporting}
              variant="outline"
              className="flex-1"
            >
              {isImporting && isDryRun ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Previewing...
                </>
              ) : (
                <>
                  <Info className="w-4 h-4 mr-2" />
                  Preview (Dry Run)
                </>
              )}
            </Button>

            <Button
              onClick={() => handleImport(false)}
              disabled={isImporting}
              className="flex-1"
            >
              {isImporting && !isDryRun ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Paints
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="p-4 mb-6 bg-destructive/10 border-destructive">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">Error</h3>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {result && (
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {result.dryRun ? 'Preview Results' : 'Import Complete'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {result.dryRun
                    ? 'No changes were made to the database'
                    : 'Database has been updated'}
                </p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {result.added}
                </div>
                <div className="text-sm text-green-600 dark:text-green-500">
                  {result.dryRun ? 'Would Add' : 'Added'}
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {result.skipped}
                </div>
                <div className="text-sm text-amber-600 dark:text-amber-500">Skipped</div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {result.updated}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-500">
                  {result.dryRun ? 'Would Update' : 'Updated'}
                </div>
              </div>
            </div>

            {/* Detailed Results for Dry Run */}
            {result.dryRun && result.addedPaints && result.addedPaints.length > 0 && (
              <details className="mb-4">
                <summary className="font-medium cursor-pointer text-green-700 dark:text-green-400 mb-2">
                  View {result.added} paints that would be added
                </summary>
                <div className="max-h-48 overflow-y-auto p-3 bg-muted/30 rounded text-xs space-y-1">
                  {result.addedPaints.map((paint: any, idx: number) => (
                    <div key={idx}>
                      {paint.brand} - {paint.name}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {result.dryRun && result.skippedPaints && result.skippedPaints.length > 0 && (
              <details className="mb-4">
                <summary className="font-medium cursor-pointer text-amber-700 dark:text-amber-400 mb-2">
                  View {result.skipped} paints that would be skipped
                </summary>
                <div className="max-h-48 overflow-y-auto p-3 bg-muted/30 rounded text-xs space-y-1">
                  {result.skippedPaints.slice(0, 100).map((paint: any, idx: number) => (
                    <div key={idx}>
                      {paint.brand} - {paint.name} ({paint.reason})
                    </div>
                  ))}
                  {result.skippedPaints.length > 100 && (
                    <div className="text-muted-foreground italic">
                      ... and {result.skippedPaints.length - 100} more
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Next Steps */}
            {result.dryRun && result.added > 0 && (
              <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium mb-2">Next Step:</p>
                <p className="text-sm text-muted-foreground mb-3">
                  {result.added} new paints are ready to import. Click "Import Paints" to add them to the
                  database.
                </p>
                <Button onClick={() => handleImport(false)} disabled={isImporting}>
                  <Upload className="w-4 h-4 mr-2" />
                  Import {result.added} New Paints
                </Button>
              </div>
            )}

            {!result.dryRun && result.added === 0 && result.skipped > 0 && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  All paints already exist in the database. No new paints were added.
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6 mt-6 bg-muted/30">
          <h3 className="font-semibold mb-3">Usage Guide</h3>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Click "Preview" to see what would happen without making changes</li>
            <li>Review the counts: Added (new), Skipped (duplicates), Updated (if enabled)</li>
            <li>When ready, click "Import Paints" to add new paints to the database</li>
            <li>Safe to run multiple times - duplicates are always skipped</li>
            <li>Enable "Update Existing" only if you want to refresh paint data (colors, types, etc.)</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
