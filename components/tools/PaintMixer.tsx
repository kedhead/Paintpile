'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { Palette, Beaker, ArrowRight, Sparkles } from 'lucide-react';
import { UserOwnedPaint, Paint } from '@/types/paint';

interface PaintMixerProps {
    inventory: UserOwnedPaint[];
    allPaints: Paint[];
}

export function PaintMixer({ inventory, allPaints }: PaintMixerProps) {
    const [targetColor, setTargetColor] = useState('');
    const [recipe, setRecipe] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Prepare inventory names for the API
    const inventoryNames = inventory
        .map(item => {
            const paint = allPaints.find(p => p.paintId === item.paintId);
            return paint ? `${paint.brand} ${paint.name}` : null;
        })
        .filter(Boolean) as string[];

    const handleMix = async () => {
        if (!targetColor.trim()) return;
        if (inventoryNames.length === 0) {
            setError("You need paints in your inventory to mix!");
            return;
        }

        setIsLoading(true);
        setError('');
        setRecipe(null);

        try {
            const response = await fetch('/api/ai/mix-paint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetColor,
                    inventory: inventoryNames
                })
            });

            const data = await response.json();

            if (data.success) {
                setRecipe(data.recipe);
            } else {
                setError(data.error || 'Failed to generate recipe');
            }
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Input Section */}
            <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Beaker className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">What do you want to mix?</h2>
                    <p className="text-muted-foreground mt-2">
                        Enter a paint name (e.g. "Citadel Warpstone Glow") or a description (e.g. "Dark Forest Green").
                        <br />
                        AI will find a recipe using <span className="font-semibold text-foreground">{inventoryNames.length} paints</span> from your inventory.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
                    <Input
                        placeholder="Target Paint Name..."
                        value={targetColor}
                        onChange={(e) => setTargetColor(e.target.value)}
                        className="h-12 text-lg"
                        onKeyDown={(e) => e.key === 'Enter' && handleMix()}
                    />
                    <Button
                        size="lg"
                        onClick={handleMix}
                        disabled={isLoading || !targetColor.trim() || inventoryNames.length === 0}
                        className="h-12 px-8 gap-2"
                    >
                        {isLoading ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4" />}
                        Generate
                    </Button>
                </div>

                {error && (
                    <p className="text-destructive text-center mt-4 text-sm">{error}</p>
                )}
            </div>

            {/* Result Section */}
            {recipe && (
                <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-primary" />
                        Mixing Recipe
                    </h3>
                    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none bg-secondary/30 p-6 rounded-lg">
                        {/* Simple markdown rendering by replacing newlines */}
                        {recipe.split('\n').map((line, i) => (
                            <p key={i} className={line.startsWith('**') ? 'font-bold mt-4' : 'mb-2'}>
                                {line.replace(/\*\*/g, '')}
                            </p>
                        ))}
                    </div>
                    <div className="mt-6 text-center">
                        <Button variant="outline" onClick={() => setRecipe(null)}>
                            Try Another Color
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
