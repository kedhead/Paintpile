'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddCustomPaintDialog } from '@/components/paints/AddCustomPaintDialog';
import { getUserCustomPaints, deleteCustomPaint, isCustomPaint } from '@/lib/firestore/custom-paints';
import { getAllPaints } from '@/lib/firestore/paints';
import { Paint, CustomPaint } from '@/types/paint';
import { Search, Trash2, Palette } from 'lucide-react';

export default function PaintsPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [globalPaints, setGlobalPaints] = useState<Paint[]>([]);
  const [customPaints, setCustomPaints] = useState<CustomPaint[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  useEffect(() => {
    loadPaints();
  }, [currentUser]);

  async function loadPaints() {
    if (!currentUser) return;

    try {
      setLoading(true);
      const [global, custom] = await Promise.all([
        getAllPaints(),
        getUserCustomPaints(currentUser.uid),
      ]);
      setGlobalPaints(global);
      setCustomPaints(custom);
    } catch (error) {
      console.error('Error loading paints:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCustomPaint(paintId: string) {
    if (!currentUser) return;
    if (!confirm('Are you sure you want to delete this custom paint?')) return;

    try {
      await deleteCustomPaint(paintId, currentUser.uid);
      setCustomPaints((prev) => prev.filter((p) => p.paintId !== paintId));
    } catch (error) {
      console.error('Error deleting custom paint:', error);
      alert('Failed to delete custom paint');
    }
  }

  // Get all unique brands
  const allBrands = Array.from(
    new Set([
      ...globalPaints.map((p) => p.brand),
      ...customPaints.map((p) => p.brand),
    ])
  ).sort();

  // Filter paints
  const filteredGlobalPaints = globalPaints.filter((paint) => {
    const matchesSearch =
      searchQuery === '' ||
      paint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paint.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrand === 'all' || paint.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const filteredCustomPaints = customPaints.filter((paint) => {
    const matchesSearch =
      searchQuery === '' ||
      paint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paint.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrand === 'all' || paint.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Please sign in to view paints</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-display font-bold text-foreground mb-2">
                Paint Library
              </h1>
              <p className="text-muted-foreground">
                Browse 200+ paints or create your own custom colors
              </p>
            </div>
            <AddCustomPaintDialog userId={currentUser.uid} onPaintAdded={loadPaints} />
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search paints..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
            >
              <option value="all">All Brands ({allBrands.length})</option>
              {allBrands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Custom Paints Section */}
            {customPaints.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Palette className="w-6 h-6" />
                  My Custom Paints ({filteredCustomPaints.length})
                </h2>
                {filteredCustomPaints.length === 0 ? (
                  <p className="text-muted-foreground">
                    No custom paints match your search.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredCustomPaints.map((paint) => (
                      <PaintCard
                        key={paint.paintId}
                        paint={paint}
                        isCustom
                        onDelete={() => handleDeleteCustomPaint(paint.paintId)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Global Paints Section */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Paint Database ({filteredGlobalPaints.length})
              </h2>
              {filteredGlobalPaints.length === 0 ? (
                <p className="text-muted-foreground">
                  No paints match your search.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredGlobalPaints.map((paint) => (
                    <PaintCard key={paint.paintId} paint={paint} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PaintCardProps {
  paint: Paint | CustomPaint;
  isCustom?: boolean;
  onDelete?: () => void;
}

function PaintCard({ paint, isCustom, onDelete }: PaintCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded border border-border flex-shrink-0"
          style={{ backgroundColor: paint.hexColor }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{paint.name}</h3>
          <p className="text-xs text-muted-foreground">{paint.brand}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-background border border-border rounded capitalize">
              {paint.type}
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {paint.hexColor}
            </span>
          </div>
        </div>
        {isCustom && onDelete && (
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-colors p-1"
            title="Delete custom paint"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
