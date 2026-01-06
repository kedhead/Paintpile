'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Paint } from '@/types/paint';
import { Sparkles, Check, AlertCircle } from 'lucide-react';
import { bulkAddToInventory } from '@/lib/firestore/inventory';

interface AIImportDialogProps {
    userId: string;
    onImportComplete: () => void;
}

export function AIImportDialog({ userId, onImportComplete }: AIImportDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState('auto');
    const [description, setDescription] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [matchedPaints, setMatchedPaints] = useState<Paint[] | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const handleProcess = async () => {
        if (!description.trim()) return;

        setIsProcessing(true);
        setError('');
        setMatchedPaints(null);

        try {
            const response = await fetch('/api/ai/inventory-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description,
                    brand: selectedBrand === 'auto' ? undefined : selectedBrand
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to process request');
            }

            setMatchedPaints(data.paints);
            if (data.matchedCount === 0) {
                let msg = 'No matching paints found in our database.';
                if (data.debugInfo) {
                    msg += ` (Debug: DB has ${data.debugInfo.totalPaintsInDb} paints. Brands: ${data.debugInfo.availableBrands.join(', ')})`;
                }
                setError(msg);
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Something went wrong');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = async () => {
        if (!matchedPaints || matchedPaints.length === 0) return;

        setIsSaving(true);
        try {
            const paintIds = matchedPaints.map(p => p.paintId);
            await bulkAddToInventory(userId, paintIds);

            setOpen(false);
            setDescription('');
            setMatchedPaints(null);
            onImportComplete();
        } catch (err) {
            console.error(err);
            setError('Failed to save inventory');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className="gap-2"
            >
                <Sparkles className="w-4 h-4 text-primary" />
                AI Import
            </Button>

            {open && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Import Paints with AI</h2>
                            <button
                                onClick={() => setOpen(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Close"
                            >
                                <AlertCircle className="w-5 h-5 rotate-45" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {!matchedPaints ? (
                                <>
                                    <p className="text-sm text-muted-foreground">
                                        Describe the paints you own (e.g., "I have the Army Painter Speedpaint 2.0 Mega Set and Vallejo Game Color Starter Set").
                                        AI will identify and list them for you.
                                    </p>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Filter by Brand (Optional - Helps AI Accuracy)</label>
                                        <select
                                            value={selectedBrand}
                                            onChange={(e) => setSelectedBrand(e.target.value)}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <option value="auto">Auto-detect (All Brands)</option>
                                            <option value="Army Painter">Army Painter</option>
                                            <option value="Citadel">Citadel / Games Workshop</option>
                                            <option value="Vallejo">Vallejo</option>
                                            <option value="Scale75">Scale75</option>
                                            <option value="ProAcryl">Pro Acryl</option>
                                            <option value="Reaper">Reaper</option>
                                            <option value="AK Interactive">AK Interactive</option>
                                            <option value="Green Stuff World">Green Stuff World</option>
                                            <option value="Two Thin Coats">Two Thin Coats</option>
                                        </select>
                                    </div>

                                    <textarea
                                        placeholder="e.g. I have the Speedpaint 2.0 Mega Set..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={5}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                    {error && (
                                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                            <AlertCircle className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                                        <Button
                                            onClick={handleProcess}
                                            disabled={isProcessing || !description.trim()}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <Spinner size="sm" className="mr-2" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                'Identify Paints'
                                            )}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-foreground">
                                            Found {matchedPaints.length} Paints
                                        </h3>
                                        <Button variant="ghost" size="sm" onClick={() => setMatchedPaints(null)}>
                                            Back
                                        </Button>
                                    </div>

                                    <div className="border border-border rounded-md max-h-[300px] overflow-y-auto divide-y divide-border">
                                        {matchedPaints.map((paint) => (
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

                                    {error && (
                                        <div className="text-sm text-destructive">{error}</div>
                                    )}

                                    <div className="flex gap-2">
                                        <Button variant="outline" className="flex-1" onClick={() => setMatchedPaints(null)}>Back</Button>
                                        <Button
                                            className="flex-1"
                                            onClick={handleConfirm}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Spinner size="sm" className="mr-2" />
                                                    Adding...
                                                </>
                                            ) : (
                                                `Add ${matchedPaints.length} Paints`
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
