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
  const [selectedSets, setSelectedSets] = useState<PaintSet[]>([]);
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
        // Normalize brand names to prevent duplicates
        const normalizedSets = data.sets.map((set: PaintSet) => {
          let brand = set.brand;

          // Army Painter Normalization
          if (brand === 'The Army Painter' || brand === 'Army Painter Fanatic') {
            brand = 'Army Painter';
          }

          // Citadel Normalization
          if (brand === 'Citadel (Games Workshop)' || brand === 'Games Workshop') {
            brand = 'Citadel';
          }

          // Vallejo Normalization (consolidate ranges found by web scraper if desired, or just pure 'Vallejo' from AI)
          // The AI generator returns just "Vallejo", but existing scraped data might have specific ranges.
          // Let's keep specific ranges if they seem distinct, but fix obvious dupes?
          // User complained about duplicates. If they see "Vallejo" AND "Vallejo Model Color" that's confusing.
          // Let's map everything starting with Vallejo to Vallejo for simplicity in this filter
          if (brand.startsWith('Vallejo')) {
            brand = 'Vallejo';
          }

          // Monument Normalization
          if (brand === 'Monument Hobbies' || brand.includes('ProAcryl')) {
            brand = 'ProAcryl';
          }

          return { ...set, brand };
        });

        setPaintSets(normalizedSets);
        setFilteredSets(normalizedSets);
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

  const handleToggleSet = (set: PaintSet) => {
    setSelectedSets(prev => {
      const isSelected = prev.some(s => s.setId === set.setId);
      if (isSelected) {
        return prev.filter(s => s.setId !== set.setId);
      } else {
        return [...prev, set];
      }
    });
  };

  const handleConfirm = async () => {
    if (selectedSets.length === 0) return;

    setIsSaving(true);
    setError('');

    try {
      // Resolve all selected sets in parallel
      const resolvePromises = selectedSets.map(set =>
        fetch('/api/paint-sets/resolve', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ setId: set.setId }),
        }).then(res => res.json())
      );

      const results = await Promise.all(resolvePromises);

      // Collect all unique paints from all sets
      const allPaints = new Map<string, Paint>();
      results.forEach(data => {
        if (data.paints) {
          data.paints.forEach((paint: Paint) => {
            allPaints.set(paint.paintId, paint);
          });
        }
      });

      const uniquePaintIds = Array.from(allPaints.keys());

      if (uniquePaintIds.length === 0) {
        setError('No matching paints found in our database for the selected sets.');
        return;
      }

      // Add all paints to inventory
      await bulkAddToInventory(userId, uniquePaintIds);

      setOpen(false);
      setSelectedSets([]);
      setSearchQuery('');
      onImportComplete();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save inventory');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSets([]);
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Select one or more paint sets to add to your inventory.
                  </p>
                  {selectedSets.length > 0 && (
                    <span className="text-sm font-medium text-primary">
                      {selectedSets.length} selected
                    </span>
                  )}
                </div>

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
                    {filteredSets.map(set => {
                      const isSelected = selectedSets.some(s => s.setId === set.setId);
                      return (
                        <button
                          key={set.setId}
                          onClick={() => handleToggleSet(set)}
                          className={`text-left p-4 border rounded-lg transition-all group ${isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary hover:bg-accent/50'
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-5 h-5 rounded border shrink-0 mt-0.5 transition-colors">
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-medium transition-colors ${isSelected ? 'text-primary' : 'text-foreground group-hover:text-primary'
                                }`}>
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
                            <Package className={`w-5 h-5 shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
                              }`} />
                          </div>
                        </button>
                      );
                    })}
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
            </div>

            {/* Footer */}
            <div className="border-t border-border p-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirm}
                disabled={isSaving || selectedSets.length === 0}
              >
                {isSaving ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Adding Sets...
                  </>
                ) : selectedSets.length === 0 ? (
                  'Select Sets to Add'
                ) : (
                  `Add ${selectedSets.length} Set${selectedSets.length > 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
