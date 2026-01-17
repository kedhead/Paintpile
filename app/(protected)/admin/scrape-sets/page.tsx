'use client';

import { useState, useEffect } from 'react';
import { Shield, Download, Loader2, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import { isUserAdmin } from '@/lib/auth/admin-check';

interface ScrapedSet {
  setName: string;
  brand: string;
  paintCount: number;
  paintNames: string[];
  sourceUrl: string;
  description?: string;
  imageUrl?: string;
}

interface ScrapeResult {
  brand: string;
  sets: ScrapedSet[];
  scrapedAt: string;
  errors: string[];
}

export default function ScrapePaintSetsPage() {
  const { currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [results, setResults] = useState<ScrapeResult[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(['Monument', 'Army Painter', 'Citadel']);
  const [error, setError] = useState<string>('');

  const availableBrands = [
    { id: 'Monument', name: 'Monument Hobbies (ProAcryl)', icon: '🎨' },
    { id: 'Army Painter', name: 'The Army Painter', icon: '🖌️' },
    { id: 'Citadel', name: 'Citadel (Games Workshop)', icon: '⚔️' },
    { id: 'Vallejo', name: 'Vallejo', icon: '💧' },
  ];

  useEffect(() => {
    async function checkAdmin() {
      setAdminCheckLoading(true);
      const adminStatus = await isUserAdmin(currentUser);
      setIsAdmin(adminStatus);
      setAdminCheckLoading(false);
    }
    checkAdmin();
  }, [currentUser]);

  const toggleBrand = (brandId: string) => {
    setSelectedBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(b => b !== brandId)
        : [...prev, brandId]
    );
  };

  const handleScrape = async () => {
    if (selectedBrands.length === 0) {
      setError('Please select at least one brand to scrape');
      return;
    }

    setIsScraping(true);
    setError('');
    setResults([]);

    try {
      const token = await currentUser?.getIdToken();

      const response = await fetch('/api/admin/scrape-paint-sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ brands: selectedBrands }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Scraping failed');
      }

      setResults(data.data.results);
    } catch (err: any) {
      setError(err.message || 'Failed to scrape paint sets');
    } finally {
      setIsScraping(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  const handleSaveToDB = async () => {
    if (results.length === 0) return;
    setIsSaving(true);
    setSaveSuccess('');
    setError('');

    try {
      const setsToSave: unknown[] = [];
      results.forEach(r => {
        r.sets.forEach(set => {
          const setId = `${set.brand.toLowerCase().replace(/\s+/g, '-')}-${set.setName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
          setsToSave.push({
            setId,
            setName: set.setName,
            brand: set.brand,
            paintCount: set.paintCount,
            isCurated: false,
            description: set.description,
            sourceUrl: set.sourceUrl,
            imageUrl: set.imageUrl,
            paintNames: set.paintNames
          });
        });
      });

      const token = await currentUser?.getIdToken();

      const response = await fetch('/api/admin/save-paint-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sets: setsToSave }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setSaveSuccess(`Successfully saved ${setsToSave.length} sets to database!`);
      // Clear results after successful save to prevent duplicates
      setTimeout(() => setResults([]), 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to save sets');
    } finally {
      setIsSaving(false);
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Scrape Paint Sets</h1>
          </div>
          <p className="text-muted-foreground">
            Use AI to scrape paint sets from manufacturer websites
          </p>
        </div>

        {/* Brand Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Select Brands to Scrape</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {availableBrands.map(brand => (
              <button
                key={brand.id}
                onClick={() => toggleBrand(brand.id)}
                className={`p-4 border rounded-lg transition-all ${selectedBrands.includes(brand.id)
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
                  }`}
              >
                <div className="text-2xl mb-2">{brand.icon}</div>
                <div className="font-medium">{brand.name}</div>
                {selectedBrands.includes(brand.id) && (
                  <CheckCircle2 className="w-5 h-5 text-primary mx-auto mt-2" />
                )}
              </button>
            ))}
          </div>

          <Button
            onClick={handleScrape}
            disabled={isScraping || selectedBrands.length === 0}
            className="w-full"
          >
            {isScraping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping... (This may take 2-5 minutes)
              </>
            ) : (
              'Start Scraping'
            )}
          </Button>
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

        {/* Success Display */}
        {saveSuccess && (
          <Card className="p-4 mb-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-1">Success</h3>
                <p className="text-sm text-green-700 dark:text-green-300">{saveSuccess}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Scraping Results</h2>
              <div className="flex gap-2">
                {/* Keep download as backup option if needed, or remove. I'll remove for now as requested */}
                <Button onClick={handleSaveToDB} disabled={isSaving}>
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                  Save to Database
                </Button>
              </div>
            </div>

            {results.map((result, idx) => (
              <Card key={idx} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{result.brand}</h3>
                    <p className="text-sm text-muted-foreground">
                      Found {result.sets.length} sets • {result.errors.length} errors
                    </p>
                  </div>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>

                {result.errors.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                      Warnings:
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                      {result.errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  {result.sets.map((set, setIdx) => (
                    <div
                      key={setIdx}
                      className="p-4 bg-muted/30 rounded-lg border border-border"
                    >
                      <div className="flex items-start gap-3">
                        {set.imageUrl && (
                          <img
                            src={set.imageUrl}
                            alt={set.setName}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold">{set.setName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {set.paintCount} paints • {set.paintNames.length} names extracted
                          </p>
                          {set.paintNames.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-primary cursor-pointer">
                                View paint names
                              </summary>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {set.paintNames.join(', ')}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Instructions */}
        <Card className="p-6 mt-6 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
            How to Use Scraped Data
          </h3>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2 list-decimal list-inside">
            <li>Click "Start Scraping" to fetch paint sets from selected manufacturers</li>
            <li>AI will extract paint names from product descriptions (takes 2-5 minutes)</li>
            <li>Review the results in the list above</li>
            <li>Click "Save to Database" to publish the new sets immediately</li>
            <li>Use the Paint Sets management page to make further edits if needed</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
