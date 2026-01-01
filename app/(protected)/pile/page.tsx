'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPile, deletePileItem, getPileStats, startPainting, completePainting } from '@/lib/firestore/pile';
import { PileItem } from '@/types/pile';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Plus, Trash2, Play, Check, BarChart3 } from 'lucide-react';
import { PileItemForm } from '@/components/pile/PileItemForm';
import { PileStats } from '@/components/pile/PileStats';

export default function PilePage() {
  const { currentUser } = useAuth();
  const [pileItems, setPileItems] = useState<PileItem[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    unpainted: number;
    painting: number;
    painted: number;
    byType: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PileItem | null>(null);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadPile();
      loadStats();
    }
  }, [currentUser]);

  async function loadPile() {
    try {
      setLoading(true);
      const items = await getUserPile(currentUser!.uid);
      setPileItems(items);
    } catch (err) {
      console.error('Error loading pile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const pileStats = await getPileStats(currentUser!.uid);
      setStats(pileStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  async function handleDelete(item: PileItem) {
    if (!confirm(`Delete "${item.name}" from your pile?`)) return;

    try {
      await deletePileItem(item.pileId, currentUser!.uid, item.quantity);
      await loadPile();
      await loadStats();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
    }
  }

  async function handleStartPainting(item: PileItem) {
    try {
      await startPainting(item.pileId);
      await loadPile();
      await loadStats();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  }

  async function handleCompletePainting(item: PileItem) {
    try {
      await completePainting(item.pileId);
      await loadPile();
      await loadStats();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  }

  function handleFormClose() {
    setShowForm(false);
    setEditingItem(null);
    loadPile();
    loadStats();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unpainted':
        return 'bg-gray-100 text-gray-700';
      case 'painting':
        return 'bg-secondary-100 text-secondary-700';
      case 'painted':
        return 'bg-success-100 text-success-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'unpainted':
        return 'Unpainted';
      case 'painting':
        return 'In Progress';
      case 'painted':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pile of Shame</h1>
          <p className="text-gray-600 mt-1">
            Track your unpainted miniatures and painting progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setShowStats(!showStats)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-5 w-5" />
            {showStats ? 'Hide' : 'Show'} Stats
          </Button>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add to Pile
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {showStats && stats && <PileStats stats={stats} />}

      {/* Pile Items */}
      <Card>
        <CardHeader>
          <CardTitle>Your Pile ({pileItems.length} items, {stats?.total || 0} miniatures)</CardTitle>
        </CardHeader>
        <CardContent>
          {pileItems.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <p className="text-lg font-medium">Your pile is empty!</p>
              <p className="text-sm mt-2">Add your first unpainted miniature to get started.</p>
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
                className="mt-4"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add to Pile
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {pileItems.map((item) => (
                <div
                  key={item.pileId}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusLabel(item.status)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                          {item.type}
                        </span>
                        <span className="text-sm text-gray-600">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600">{item.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {item.status === 'unpainted' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartPainting(item)}
                          className="flex items-center gap-1"
                          title="Start painting"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {item.status === 'painting' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompletePainting(item)}
                          className="flex items-center gap-1"
                          title="Mark as completed"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setShowForm(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        className="text-accent-600 hover:text-accent-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <PileItemForm
          userId={currentUser!.uid}
          editingItem={editingItem}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
