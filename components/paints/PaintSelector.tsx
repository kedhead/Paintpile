'use client';

import { useState, useEffect } from 'react';
import { getAllPaints } from '@/lib/firestore/paints';
import { getAllPaintsForUser } from '@/lib/firestore/custom-paints';
import { Paint, CustomPaint } from '@/types/paint';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Search, X, Check, Sparkles } from 'lucide-react';
import { PAINT_BRANDS } from '@/lib/utils/constants';

interface PaintSelectorProps {
  selectedPaints: Paint[];
  onPaintsChange: (paints: Paint[]) => void;
  maxSelection?: number;
  userId?: string; // If provided, will include custom paints
}

export function PaintSelector({
  selectedPaints,
  onPaintsChange,
  maxSelection,
  userId,
}: PaintSelectorProps) {
  const [allPaints, setAllPaints] = useState<(Paint | CustomPaint)[]>([]);
  const [filteredPaints, setFilteredPaints] = useState<(Paint | CustomPaint)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  useEffect(() => {
    loadPaints();
  }, [userId]);

  useEffect(() => {
    filterPaints();
  }, [searchTerm, selectedBrand, allPaints]);

  async function loadPaints() {
    try {
      setLoading(true);
      // Load global paints + custom paints if userId is provided
      const paints = userId
        ? await getAllPaintsForUser(userId)
        : await getAllPaints();
      setAllPaints(paints);
      setFilteredPaints(paints);

      // Debug: Log available brands
      const brandCounts: Record<string, number> = {};
      paints.forEach(p => {
        brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
      });
      console.log('[PaintSelector] Loaded paints by brand:', brandCounts);

    } catch (err) {
      console.error('Error loading paints:', err);
    } finally {
      setLoading(false);
    }
  }

  async function filterPaints() {
    let filtered = [...allPaints];

    // Filter by brand
    if (selectedBrand !== 'all') {
      filtered = filtered.filter((paint) => {
        // Normalization helper (remove spaces, lowercase)
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '');
        const pBrand = normalize(paint.brand);
        const sBrand = normalize(selectedBrand);

        // 1. Exact Name/Normalized Match
        if (pBrand === sBrand) return true;

        // 2. Specific Aliases & Fuzzy Matching

        // Citadel: "Citadel Colour" -> "Citadel"
        if (selectedBrand === 'Citadel' && pBrand.includes('citadel')) return true;

        // Army Painter: "Army  Painter" (double space), "Fanatic" -> "Army Painter"
        if (selectedBrand === 'Army Painter' && pBrand.includes('armypainter')) return true;

        // AK Interactive: "A K" -> "AK Interactive"
        if (selectedBrand === 'AK Interactive' && (pBrand.includes('ak') || pBrand === 'ak')) return true;

        // Pro Acryl: "ProAcryl" vs "Pro Acryl"
        if ((selectedBrand === 'ProAcryl' || selectedBrand === 'Pro Acryl') &&
          (pBrand.includes('proacryl') || pBrand.includes('monument'))) return true;

        // Vallejo: "Vallejo Model Color" etc -> "Vallejo" (broad matching)
        if (selectedBrand.startsWith('Vallejo') && pBrand.includes('vallejo')) {
          // If user selected specific Vallejo line, try to match it
          if (selectedBrand.includes('Model') && pBrand.includes('model')) return true;
          if (selectedBrand.includes('Game') && pBrand.includes('game')) return true;
          // If just general matching or imperfect data, maybe just return true if it's broadly Vallejo seems unsafe?
          // Better keeping strict sub-brand check if the data supports it, but here data might be just "Vallejo"
          if (pBrand === 'vallejo') return true;
        }

        return false;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (paint) =>
          paint.name.toLowerCase().includes(lowerSearch) ||
          paint.brand.toLowerCase().includes(lowerSearch)
      );
    }

    setFilteredPaints(filtered);
  }

  function togglePaint(paint: Paint) {
    const isSelected = selectedPaints.some((p) => p.paintId === paint.paintId);

    if (isSelected) {
      onPaintsChange(selectedPaints.filter((p) => p.paintId !== paint.paintId));
    } else {
      if (maxSelection && selectedPaints.length >= maxSelection) {
        alert(`You can only select up to ${maxSelection} paints`);
        return;
      }
      onPaintsChange([...selectedPaints, paint]);
    }
  }

  function isPaintSelected(paint: Paint): boolean {
    return selectedPaints.some((p) => p.paintId === paint.paintId);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search paints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedBrand('all')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedBrand === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
          >
            All Brands
          </button>
          {PAINT_BRANDS.filter((b) => b !== 'Custom').map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${selectedBrand === brand
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Paints */}
      {selectedPaints.length > 0 && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-foreground">
              Selected ({selectedPaints.length}
              {maxSelection ? ` / ${maxSelection}` : ''})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPaintsChange([])}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedPaints.map((paint) => (
              <div
                key={paint.paintId}
                className="inline-flex items-center gap-2 bg-card border border-border rounded-lg px-2 py-1"
              >
                <div
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: paint.hexColor }}
                />
                <span className="text-sm text-foreground">{paint.name}</span>
                <button
                  onClick={() => togglePaint(paint)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paint List */}
      <div className="border border-border rounded-lg max-h-96 overflow-y-auto bg-background">
        {filteredPaints.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No paints found</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredPaints.map((paint) => {
              const isSelected = isPaintSelected(paint);
              return (
                <button
                  key={paint.paintId}
                  onClick={() => togglePaint(paint)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition text-left ${isSelected ? 'bg-primary/10' : ''
                    }`}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-border flex-shrink-0"
                    style={{ backgroundColor: paint.hexColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-foreground truncate">
                        {paint.name}
                      </p>
                      {'userId' in paint && (
                        <span title="Custom paint">
                          <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {paint.brand} • {paint.type}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {filteredPaints.length} paint{filteredPaints.length !== 1 ? 's' : ''} available
      </p>
    </div>
  );
}
