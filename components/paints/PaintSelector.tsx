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
      filtered = filtered.filter((paint) => paint.brand === selectedBrand);
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
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
              selectedBrand === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Brands
          </button>
          {PAINT_BRANDS.filter((b) => b !== 'Custom').map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition ${
                selectedBrand === brand
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Paints */}
      {selectedPaints.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-primary-900">
              Selected ({selectedPaints.length}
              {maxSelection ? ` / ${maxSelection}` : ''})
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPaintsChange([])}
              className="text-primary-700 hover:text-primary-900"
            >
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedPaints.map((paint) => (
              <div
                key={paint.paintId}
                className="inline-flex items-center gap-2 bg-white border border-primary-300 rounded-lg px-2 py-1"
              >
                <div
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: paint.hexColor }}
                />
                <span className="text-sm text-gray-900">{paint.name}</span>
                <button
                  onClick={() => togglePaint(paint)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paint List */}
      <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
        {filteredPaints.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No paints found</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try a different search term</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPaints.map((paint) => {
              const isSelected = isPaintSelected(paint);
              return (
                <button
                  key={paint.paintId}
                  onClick={() => togglePaint(paint)}
                  className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left ${
                    isSelected ? 'bg-primary-50' : ''
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: paint.hexColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-gray-900 truncate">
                        {paint.name}
                      </p>
                      {'userId' in paint && (
                        <span title="Custom paint">
                          <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {paint.brand} • {paint.type}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <Check className="h-5 w-5 text-primary-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        {filteredPaints.length} paint{filteredPaints.length !== 1 ? 's' : ''} available
      </p>
    </div>
  );
}
