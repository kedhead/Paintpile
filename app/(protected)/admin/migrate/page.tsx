'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function MigratePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runMigration() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/admin/migrate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setResult(data); // Store the full response including details
        throw new Error(data.error || 'Migration failed');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Migration error:', err);
      setError(err.message || 'Failed to run migration');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Database Migration</h1>
          <p className="text-muted-foreground mb-8">
            Run migrations to add social feature fields to existing data
          </p>

          <div className="space-y-6">
            {/* Warning */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  Migrations Info
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  This will add the following fields to your database:
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 list-disc list-inside space-y-1">
                  <li>Projects: likeCount, commentCount (initialized to 0)</li>
                  <li>Users: usernameLower, followerCount, followingCount</li>
                </ul>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                  Safe to run multiple times - already migrated items will be skipped.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={runMigration}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Running Migration...
                </>
              ) : (
                'Run Migration'
              )}
            </Button>

            {/* Results */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex gap-3 mb-2">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-200">
                      Migration Failed
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
                {result?.details && (
                  <pre className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-auto max-h-40">
                    {result.details}
                  </pre>
                )}
              </div>
            )}

            {result && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-200">
                      Migration Completed Successfully!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {result.message}
                    </p>
                  </div>
                </div>

                {result.results && (
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-medium text-foreground">Details:</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Projects: {result.results.projects.migrated} migrated out of{' '}
                        {result.results.projects.total} total
                      </p>
                      <p>
                        Usernames: {result.results.usernames.migrated} migrated out of{' '}
                        {result.results.usernames.total} total
                      </p>
                      <p>
                        User Stats: {result.results.userStats.migrated} migrated out of{' '}
                        {result.results.userStats.total} total
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
