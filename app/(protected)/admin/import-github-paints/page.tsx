'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ArrowLeft, Download, Check, X, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ImportStatus {
  manufacturer: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  count?: number;
  error?: string;
}

const MANUFACTURERS = [
  'AK', 'AKRC', 'Acrilex', 'AppleBarrel', 'Army_Painter', 'Arteza',
  'Citadel_Colour', 'CoatDArmes', 'Creature', 'Duncan', 'FolkArt',
  'Foundry', 'Golden', 'GreenStuffWorld', 'Humbrol', 'Italeri',
  'KimeraKolors', 'Liquitex', 'Mig', 'MissionModels', 'Monument',
  'MrHobby', 'MrPaint', 'P3', 'Pantone', 'RAL', 'Reaper', 'Revell',
  'Scale75', 'Tamiya', 'TomColor', 'TurboDork', 'Vallejo', 'Warcolours'
];

export default function ImportGithubPaintsPage() {
  const [selectedManufacturers, setSelectedManufacturers] = useState<string[]>([]);

  // Initialize selection with effective "Select None" or maybe "Select All" by default? 
  // Let's start with empty so they choose what they want, or all? User said "choose only the paint brands I want".
  // Let's start empty to be safe/lightweight.

  const toggleManufacturer = (m: string) => {
    setSelectedManufacturers(prev =>
      prev.includes(m) ? prev.filter(item => item !== m) : [...prev, m]
    );
  };

  const selectAll = () => setSelectedManufacturers(MANUFACTURERS);
  const selectNone = () => setSelectedManufacturers([]);

  async function handleImportSelected() {
    if (selectedManufacturers.length === 0) return;

    setImporting(true);
    setStatuses([]);
    setTotalImported(0);

    // Initialize statuses for SELECTED items only
    const initialStatuses: ImportStatus[] = selectedManufacturers.map(m => ({
      manufacturer: m.replace('_', ' '),
      status: 'pending'
    }));
    setStatuses(initialStatuses);

    let totalCount = 0;

    // Import selected manufacturers sequentially
    for (let i = 0; i < selectedManufacturers.length; i++) {
      const manufacturer = selectedManufacturers[i];

      // Update status to processing
      setStatuses(prev => prev.map((s, idx) =>
        idx === i ? { ...s, status: 'processing' } : s
      ));

      try {
        const response = await fetch('/api/admin/import-github-paints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manufacturer }),
        });

        const result = await response.json();

        if (result.success) {
          totalCount += result.count;
          setTotalImported(totalCount);

          setStatuses(prev => prev.map((s, idx) =>
            idx === i
              ? { ...s, status: 'success', count: result.count }
              : s
          ));
        } else {
          setStatuses(prev => prev.map((s, idx) =>
            idx === i
              ? { ...s, status: 'error', error: result.error }
              : s
          ));
        }
      } catch (error: any) {
        setStatuses(prev => prev.map((s, idx) =>
          idx === i
            ? { ...s, status: 'error', error: error.message }
            : s
        ));
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setImporting(false);
  }

  const successCount = statuses.filter(s => s.status === 'success').length;
  const errorCount = statuses.filter(s => s.status === 'error').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Import Paints from GitHub</h1>
          <p className="text-muted-foreground">
            Select the paint brands you want to import from the repository.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">
                Select Manufacturers
              </h3>

              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={selectAll} disabled={importing}>Select All</Button>
                <Button variant="outline" size="sm" onClick={selectNone} disabled={importing}>Deselect All</Button>
                <span className="text-sm text-muted-foreground self-center ml-2">
                  {selectedManufacturers.length} selected
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-h-60 overflow-y-auto p-2 border rounded-md">
                {MANUFACTURERS.map(m => (
                  <label key={m} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-accent p-1 rounded">
                    <input
                      type="checkbox"
                      checked={selectedManufacturers.includes(m)}
                      onChange={() => toggleManufacturer(m)}
                      disabled={importing}
                      className="rounded border-gray-300"
                    />
                    <span>{m.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">
                      Warning
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      This will add paints to your database. It won't remove existing paints.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleImportSelected}
                disabled={importing || selectedManufacturers.length === 0}
                className="w-full"
              >
                {importing ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Importing... ({successCount + errorCount}/{statuses.length})
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Import {selectedManufacturers.length} Selected Brands
                  </>
                )}
              </Button>
            </div>
          </div>

          {totalImported > 0 && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-900 dark:text-green-200 font-medium">
                Total Paints Imported: {totalImported}
              </p>
            </div>
          )}
        </Card>

        {statuses.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Import Progress</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {statuses.map((status, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {status.status === 'pending' && (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    {status.status === 'processing' && (
                      <Spinner size="sm" />
                    )}
                    {status.status === 'success' && (
                      <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                    )}
                    {status.status === 'error' && (
                      <X className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium">{status.manufacturer}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {status.count !== undefined && `${status.count} paints`}
                    {status.error && (
                      <span className="text-destructive">{status.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
