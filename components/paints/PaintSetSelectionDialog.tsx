'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Paint } from '@/types/paint';
import { Package, Check, AlertCircle, Search, Sparkles } from 'lucide-react';
import { bulkAddToInventory } from '@/lib/firestore/inventory';

interface PaintSet {
  setId: string;
  setName: string;
  brand: string;
  paintCount: number;
  description?: string;
  isCurated: boolean;
}

interface PaintSetSelectionDialogProps {
  userId: string;
  onImportComplete: () => void;
  onFallbackToAI?: () => void; // Callback to switch to AI import
}

export function PaintSetSelectionDialog({
  userId,
  onImportComplete,
  onFallbackToAI,
}: PaintSetSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [paintSets, setPaintSets] = useState<PaintSet[]>([]);
  const [filteredSets, setFilteredSets] = useState<PaintSet[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSet, setSelectedSet] = useState<PaintSet | null>(null);
  const [matchedPaints, setMatchedPaints] = useState<Paint[] | null>(null);
  const [matchRate, setMatchRate] = useState(0);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Load available paint sets
  useEffect(() => {
    if (open) {
      loadPaintSets();
    }
  }, [open]);

  // Filter paint sets based on brand and search query
  useEffect(() => {
    let filtered = paintSets;

    // Filter by brand
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(set => set.brand === selectedBrand);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        set =>
          set.setName.toLowerCase().includes(query) ||
          set.brand.toLowerCase().includes(query) ||
          set.description?.toLowerCase().includes(query)
      );
    }

    setFilteredSets(filtered);
  }, [paintSets, selectedBrand, searchQuery]);

  const loadPaintSets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/paint-sets/list');
      const data = await response.json();

      if (data.success) {
        setPaintSets(data.sets);
        setFilteredSets(data.sets);
      } else {
        setError('Failed to load paint sets');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load paint sets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSet = async (set: PaintSet) => {
    setSelectedSet(set);
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/paint-sets/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setId: set.setId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve paint set');
      }

      setMatchedPaints(data.paints);
      setMatchRate(data.matchRate);
      setUnmatchedCount(data.unmatchedCount);

      if (data.paints.length === 0) {
        setError('No matching paints found in our database for this set.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load paint set');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!matchedPaints || matchedPaints.length === 0) return;

    setIsSaving(true);
    try {
      const paintIds = matchedPaints.map(p => p.paintId);
      await bulkAddToInventory(userId, paintIds);

      setOpen(false);
      setSelectedSet(null);
      setMatchedPaints(null);
      setSearchQuery('');
      onImportComplete();
    } catch (err) {
      console.error(err);
      setError('Failed to save inventory');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    setSelectedSet(null);
    setMatchedPaints(null);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSet(null);
    setMatchedPaints(null);
    setSearchQuery('');
    setError('');
  };

  // Get unique brands
  const brands = Array.from(new Set(paintSets.map(s => s.brand))).sort();

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Package className="w-4 h-4" />
        Import Paint Set
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Import Paint Set</h2>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Close"
              >
                <AlertCircle className="w-5 h-5 rotate-45" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!selectedSet ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select a paint set to quickly add all its paints to your inventory.
                  </p>

                  {/* Search and Filter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search paint sets..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <select
                      value={selectedBrand}
                      onChange={e => setSelectedBrand(e.target.value)}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="all">All Brands</option>
                      {brands.map(brand => (
                        <option key={brand} value={brand}>
                          {brand}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Paint Sets Grid */}
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner />
                    </div>
                  ) : filteredSets.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No paint sets found</p>
                      {onFallbackToAI && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onFallbackToAI}
                          className="mt-4 gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          Try AI Import Instead
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto">
                      {filteredSets.map(set => (
                        <button
                          key={set.setId}
                          onClick={() => handleSelectSet(set)}
                          className="text-left p-4 border border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                                {set.setName}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                {set.brand} • {set.paintCount} paints
                                {set.isCurated && (
                                  <span className="ml-2 text-green-600">✓ Verified</span>
                                )}
                              </p>
                              {set.description && (
                                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                  {set.description}
                                </p>
                              )}
                            </div>
                            <Package className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {/* Fallback to AI */}
                  {onFallbackToAI && filteredSets.length > 0 && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-3">
                        Don't see your paint set?
                      </p>
                      <Button
                        variant="outline"
                        onClick={onFallbackToAI}
                        className="w-full gap-2"
                      >
                        <Sparkles className="w-4 h-4 text-primary" />
                        Use AI to Identify Unknown Set
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected Set Info */}
                  <div className="bg-accent/30 border border-border rounded-lg p-4">
                    <h3 className="font-medium text-foreground">{selectedSet.setName}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedSet.brand} • {selectedSet.paintCount} paints
                    </p>
                    {matchRate < 100 && unmatchedCount > 0 && (
                      <div className="mt-2 text-sm text-amber-600">
                        ⚠ {unmatchedCount} paint{unmatchedCount > 1 ? 's' : ''} not found in
                        database ({matchRate}% match rate)
                      </div>
                    )}
                  </div>

                  {/* Matched Paints */}
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Spinner />
                    </div>
                  ) : matchedPaints && matchedPaints.length > 0 ? (
                    <>
                      <div>
                        <h4 className="font-medium text-foreground mb-3">
                          {matchedPaints.length} Paint{matchedPaints.length > 1 ? 's' : ''} Found
                        </h4>
                        <div className="border border-border rounded-md max-h-[300px] overflow-y-auto divide-y divide-border">
                          {matchedPaints.map(paint => (
                            <div key={paint.paintId} className="p-3 flex items-center gap-3">
                              <div
                                className="w-6 h-6 rounded-full border border-border shrink-0"
                                style={{ backgroundColor: paint.hexColor }}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{paint.name}</p>
                                <p className="text-xs text-muted-foreground">{paint.brand}</p>
                              </div>
                              <Check className="w-4 h-4 text-green-500" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {error && (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                          {error}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                      <p className="text-sm text-destructive">
                        {error || 'No paints could be matched from this set'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border p-6 flex gap-2">
              {selectedSet && matchedPaints ? (
                <>
                  <Button variant="outline" className="flex-1" onClick={handleBack}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={isSaving || !matchedPaints || matchedPaints.length === 0}
                  >
                    {isSaving ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Adding...
                      </>
                    ) : (
                      `Add ${matchedPaints.length} Paint${matchedPaints.length > 1 ? 's' : ''}`
                    )}
                  </Button>
                </>
              ) : (
                <Button variant="outline" className="w-full" onClick={handleClose}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
