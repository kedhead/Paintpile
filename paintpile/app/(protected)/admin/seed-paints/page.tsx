'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CheckCircle, XCircle, AlertCircle, Palette } from 'lucide-react';

export default function SeedPaintsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function runSeeding() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/admin/seed-paints', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setResult(data);
        throw new Error(data.error || 'Seeding failed');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Seeding error:', err);
      setError(err.message || 'Failed to seed paint database');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="flex items-center gap-3 mb-2">
            <Palette className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Seed Paint Database</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Add 235 paints from major miniature paint brands to your database
          </p>

          <div className="space-y-6">
            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200">
                  Paint Database Contents
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  This will add the following paints to your global paint library:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 list-disc list-inside space-y-1">
                  <li>Citadel: 120 paints (base, layer, shade, metallic, contrast, technical)</li>
                  <li>Vallejo Model Color: 40 paints</li>
                  <li>Army Painter: 40 paints (warpaints, inks, speedpaints)</li>
                  <li>Reaper MSP: 20 paints</li>
                  <li>P3: 15 paints</li>
                </ul>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 font-medium">
                  Total: 235 paints
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  Note: Only run this once! Running multiple times will create duplicate paints.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={runSeeding}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Seeding Database...
                </>
              ) : (
                <>
                  <Palette className="w-5 h-5 mr-2" />
                  Seed Paint Database
                </>
              )}
            </Button>

            {/* Results */}
            {error && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-200">
                      {result?.existingCount ? 'Paints Already Exist' : 'Seeding Failed'}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {error}
                    </p>
                    {result?.existingCount && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                        Your database already has {result.existingCount} paints. You can continue using these or contact support to reset the database.
                      </p>
                    )}
                  </div>
                </div>
                {result?.details && !result?.existingCount && (
                  <pre className="mt-3 p-3 bg-amber-100 dark:bg-amber-900/30 rounded text-xs overflow-auto max-h-40">
                    {result.details}
                  </pre>
                )}
              </div>
            )}

            {result && !error && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-200">
                      Database Seeded Successfully!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {result.message}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      You can now browse all {result.count} paints in the Paint Library page.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Link */}
            <div className="text-center pt-4">
              <a
                href="/paints"
                className="text-sm text-primary hover:underline"
              >
                Go to Paint Library →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
