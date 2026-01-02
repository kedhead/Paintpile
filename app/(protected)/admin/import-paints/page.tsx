'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { AlertCircle, Upload, Download, CheckCircle, FileText } from 'lucide-react';
import { CSVPaintImporter } from '@/lib/scrapers/csv-importer';
import { ScrapedPaint } from '@/lib/scrapers/base-scraper';
import { db } from '@/lib/firebase/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

export default function ImportPaintsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ScrapedPaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);

    // Read and preview file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const paints = CSVPaintImporter.parsePaintsFromCSV(csvText);
        setPreview(paints);
      } catch (err: any) {
        setError(`Error parsing CSV: ${err.message}`);
        setPreview([]);
      }
    };
    reader.readAsText(selectedFile);
  }

  async function handleImport() {
    if (preview.length === 0) {
      setError('No paints to import');
      return;
    }

    if (!confirm(`Import ${preview.length} paints into the database?`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      console.log(`Importing ${preview.length} paints...`);

      const paintsRef = collection(db, 'paints');
      let count = 0;

      // Import in batches
      const batchSize = 500;
      let batch = writeBatch(db);
      let batchCount = 0;

      for (const paint of preview) {
        const paintRef = doc(paintsRef);
        batch.set(paintRef, {
          paintId: paintRef.id,
          ...paint,
        });
        batchCount++;
        count++;

        if (batchCount >= batchSize) {
          await batch.commit();
          console.log(`Imported batch of ${batchCount} paints`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      // Commit remaining batch
      if (batchCount > 0) {
        await batch.commit();
        console.log(`Imported final batch of ${batchCount} paints`);
      }

      console.log(`Successfully imported ${count} paints`);

      setResult({
        success: true,
        message: `Successfully imported ${count} paints`,
        count,
      });

      // Clear preview
      setPreview([]);
      setFile(null);
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.message || 'Failed to import paints');
    } finally {
      setLoading(false);
    }
  }

  function downloadTemplate() {
    const template = CSVPaintImporter.generateTemplate();
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paint-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="flex items-center gap-3 mb-2">
            <Upload className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Import Paints from CSV</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Import paint data from CSV files
          </p>

          <div className="space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-200">
                  CSV Format Requirements
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Your CSV file must have these columns:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 list-disc list-inside space-y-1">
                  <li><code>brand</code> - Paint brand name (e.g., "Citadel", "Vallejo Model Color")</li>
                  <li><code>name</code> - Paint name (e.g., "Abaddon Black")</li>
                  <li><code>hexColor</code> - Hex color code (e.g., "#000000")</li>
                  <li><code>type</code> - Paint type: base, layer, shade, metallic, contrast, or technical</li>
                </ul>
                <Button
                  onClick={downloadTemplate}
                  variant="ghost"
                  size="sm"
                  className="mt-3 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV Template
                </Button>
              </div>
            </div>

            {/* File Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="outline" size="lg" className="cursor-pointer" asChild>
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose CSV File
                  </span>
                </Button>
              </label>
              {file && (
                <p className="text-sm text-muted-foreground mt-3">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-foreground">
                    Preview ({preview.length} paints)
                  </h2>
                  <Button onClick={handleImport} disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Import All
                      </>
                    )}
                  </Button>
                </div>

                <div className="overflow-auto max-h-96 border border-border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-medium">Brand</th>
                        <th className="text-left p-2 font-medium">Name</th>
                        <th className="text-left p-2 font-medium">Color</th>
                        <th className="text-left p-2 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {preview.slice(0, 100).map((paint, index) => (
                        <tr key={index} className="hover:bg-accent/50">
                          <td className="p-2">{paint.brand}</td>
                          <td className="p-2">{paint.name}</td>
                          <td className="p-2 flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border border-border"
                              style={{ backgroundColor: paint.hexColor }}
                            />
                            <span className="text-muted-foreground">{paint.hexColor}</span>
                          </td>
                          <td className="p-2">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              {paint.type}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 100 && (
                    <p className="text-center text-sm text-muted-foreground p-3 bg-muted">
                      Showing first 100 of {preview.length} paints
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Results */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-200">
                      Import Failed
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {result && !error && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-200">
                      Import Successful!
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="flex gap-4 justify-center pt-4 text-sm">
              <a href="/paints" className="text-primary hover:underline">
                View Paint Library →
              </a>
              <a href="/admin" className="text-primary hover:underline">
                ← Back to Admin
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
