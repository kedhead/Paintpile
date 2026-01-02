'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { AlertCircle, Palette, Trash2, CheckCircle } from 'lucide-react';

export default function ManagePaintsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [operation, setOperation] = useState<'clear' | 'seed' | null>(null);

  async function clearPaints() {
    if (!confirm('Are you sure you want to delete ALL paints from the database? This action cannot be undone!')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setOperation('clear');

      const response = await fetch('/api/admin/clear-paints', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setResult(data);
        throw new Error(data.error || 'Clearing failed');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Clearing error:', err);
      setError(err.message || 'Failed to clear paint database');
    } finally {
      setLoading(false);
    }
  }

  async function seedPaints() {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setOperation('seed');

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

  async function clearAndReseed() {
    if (!confirm('This will DELETE all existing paints and add 500+ new paints. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      setOperation('seed');

      // Step 1: Clear existing paints
      const clearResponse = await fetch('/api/admin/clear-paints', {
        method: 'POST',
      });

      const clearData = await clearResponse.json();

      if (!clearResponse.ok) {
        throw new Error(clearData.error || 'Clearing failed');
      }

      console.log(`Cleared ${clearData.count} paints`);

      // Step 2: Seed new paints
      const seedResponse = await fetch('/api/admin/seed-paints', {
        method: 'POST',
      });

      const seedData = await seedResponse.json();

      if (!seedResponse.ok) {
        throw new Error(seedData.error || 'Seeding failed');
      }

      setResult(seedData);
    } catch (err: any) {
      console.error('Clear and reseed error:', err);
      setError(err.message || 'Failed to clear and reseed paint database');
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
            <h1 className="text-3xl font-bold text-foreground">Manage Paint Database</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Clear existing paints or seed the comprehensive paint database
          </p>

          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200">
                  Comprehensive Paint Database
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  The comprehensive database includes 500+ paints from major brands:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 list-disc list-inside space-y-1">
                  <li>Citadel: 120 paints (base, layer, shade, metallic, contrast, technical)</li>
                  <li>Army Painter Fanatic: 100 paints</li>
                  <li>Vallejo Model Color: 80 paints</li>
                  <li>Vallejo Game Color: 40 paints</li>
                  <li>Scale75 Scalecolor: 60 paints</li>
                  <li>ProAcryl: 50 paints</li>
                  <li>Reaper MSP: 40 paints</li>
                  <li>P3: 15 paints</li>
                </ul>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2 font-medium">
                  Total: 500+ paints
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={clearAndReseed}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading && operation === 'seed' ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Clearing and Seeding Database...
                  </>
                ) : (
                  <>
                    <Palette className="w-5 h-5 mr-2" />
                    Clear and Reseed Database (Recommended)
                  </>
                )}
              </Button>

              <div className="flex gap-3">
                <Button
                  onClick={clearPaints}
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  {loading && operation === 'clear' ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear All Paints
                    </>
                  )}
                </Button>

                <Button
                  onClick={seedPaints}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && operation === 'seed' ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Palette className="w-4 h-4 mr-2" />
                      Seed Paints Only
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Results */}
            {error && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex gap-3 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-200">
                      {result?.existingCount ? 'Paints Already Exist' : 'Operation Failed'}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      {error}
                    </p>
                    {result?.existingCount && (
                      <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
                        Your database already has {result.existingCount} paints. Use "Clear and Reseed Database" to replace them with the comprehensive database.
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
                      Success!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {result.message}
                    </p>
                    {result.count > 0 && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        {operation === 'clear' ? `Deleted ${result.count} paints` : `Added ${result.count} paints to the database`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="flex gap-4 justify-center pt-4 text-sm">
              <a
                href="/paints"
                className="text-primary hover:underline"
              >
                View Paint Library →
              </a>
              <a
                href="/admin"
                className="text-primary hover:underline"
              >
                ← Back to Admin
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
