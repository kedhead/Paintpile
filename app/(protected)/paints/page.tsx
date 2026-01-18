'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddCustomPaintDialog } from '@/components/paints/AddCustomPaintDialog';
import { ImportPaintsDialog } from '@/components/paints/ImportPaintsDialog';
import { getUserCustomPaints, deleteCustomPaint, isCustomPaint } from '@/lib/firestore/custom-paints';
import { getAllPaints } from '@/lib/firestore/paints';
import { getUserInventory, addToInventory, removeFromInventory } from '@/lib/firestore/inventory';
import { Paint, CustomPaint, UserOwnedPaint } from '@/types/paint';
import { Search, Trash2, Palette, CheckCircle, Package } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function PaintsPage() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [globalPaints, setGlobalPaints] = useState<Paint[]>([]);
  const [customPaints, setCustomPaints] = useState<CustomPaint[]>([]);
  const [userInventory, setUserInventory] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [showInventoryOnly, setShowInventoryOnly] = useState(false);

  useEffect(() => {
    loadPaints();
  }, [currentUser]);

  async function loadPaints() {
    if (!currentUser) return;

    try {
      setLoading(true);
      setLoading(true);

      const [globalResult, customResult, inventoryResult] = await Promise.allSettled([
        getAllPaints(),
        getUserCustomPaints(currentUser.uid),
        getUserInventory(currentUser.uid),
      ]);

      if (globalResult.status === 'fulfilled') {
        setGlobalPaints(globalResult.value);
      } else {
        console.error('Failed to load global paints', globalResult.reason);
      }

      if (customResult.status === 'fulfilled') {
        setCustomPaints(customResult.value);
      } else {
        console.error('Failed to load custom paints', customResult.reason);
      }

      if (inventoryResult.status === 'fulfilled') {
        setUserInventory(new Set(inventoryResult.value.map(p => p.paintId)));
      } else {
        console.error('Failed to load inventory', inventoryResult.reason);
        // Don't crash, just show empty inventory
      }
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

  async function toggleInventory(paintId: string) {
    if (!currentUser) return;

    // optimistic update
    const isOwned = userInventory.has(paintId);
    const newInventory = new Set(userInventory);

    if (isOwned) {
      newInventory.delete(paintId);
      setUserInventory(newInventory);
      try {
        await removeFromInventory(currentUser.uid, paintId);
      } catch (err) {
        console.error('Failed to remove from inventory', err);
        setUserInventory(prev => new Set(prev).add(paintId)); // revert
      }
    } else {
      newInventory.add(paintId);
      setUserInventory(newInventory);
      try {
        await addToInventory(currentUser.uid, paintId);
      } catch (err) {
        console.error('Failed to add to inventory', err);
        setUserInventory(prev => {
          const revert = new Set(prev);
          revert.delete(paintId);
          return revert;
        }); // revert
      }
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
    const matchesInventory = !showInventoryOnly || userInventory.has(paint.paintId);
    return matchesSearch && matchesBrand && matchesInventory;
  });

  const filteredCustomPaints = customPaints.filter((paint) => {
    const matchesSearch =
      searchQuery === '' ||
      paint.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paint.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrand === 'all' || paint.brand === selectedBrand;
    const matchesInventory = !showInventoryOnly || userInventory.has(paint.paintId);
    return matchesSearch && matchesBrand && matchesInventory;
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
            <div className="flex items-center gap-2">
              <ImportPaintsDialog userId={currentUser.uid} onImportComplete={loadPaints} />
              <AddCustomPaintDialog userId={currentUser.uid} onPaintAdded={loadPaints} />
            </div>
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
            <Button
              variant={showInventoryOnly ? 'default' : 'outline'}
              onClick={() => setShowInventoryOnly(!showInventoryOnly)}
              className="gap-2"
            >
              <Package className="w-4 h-4" />
              {showInventoryOnly ? 'My Inventory' : 'All Paints'}
            </Button>
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
                        isOwned={userInventory.has(paint.paintId)}
                        onToggleOwn={() => toggleInventory(paint.paintId)}
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
                    <PaintCard
                      key={paint.paintId}
                      paint={paint}
                      isOwned={userInventory.has(paint.paintId)}
                      onToggleOwn={() => toggleInventory(paint.paintId)}
                    />
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
  isOwned?: boolean;
  onToggleOwn?: () => void;
  onDelete?: () => void;
}

function PaintCard({ paint, isCustom, isOwned, onToggleOwn, onDelete }: PaintCardProps) {
  return (
    <div className={cn(
      "bg-card border rounded-lg p-4 transition-all",
      isOwned ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50"
    )}>
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded border border-border flex-shrink-0 cursor-pointer overflow-hidden relative"
          style={{ backgroundColor: !paint.swatchUrl ? paint.hexColor : undefined }}
          onClick={onToggleOwn}
          title={isOwned ? "Remove from inventory" : "Add to inventory"}
        >
          {paint.swatchUrl && (
            <img
              src={paint.swatchUrl}
              alt={paint.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-medium text-foreground truncate" title={paint.name}>{paint.name}</h3>
            {isOwned && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground">{paint.brand}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-background border border-border rounded capitalize">
              {paint.type}
            </span>
            {(paint as any).category && (paint as any).category !== 'Standard' && (
              <span className="text-xs px-2 py-0.5 bg-secondary/50 border border-border rounded text-secondary-foreground truncate max-w-[120px]">
                {(paint as any).category}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 text-xs", isOwned && "text-primary")}
          onClick={onToggleOwn}
        >
          {isOwned ? 'Owned' : 'Add to Pile'}
        </Button>
        {isCustom && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            title="Delete custom paint"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
