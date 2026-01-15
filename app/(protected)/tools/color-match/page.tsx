import { Metadata } from 'next';
import { ClientColorMatchWrapper } from './ClientColorMatchWrapper';

export const metadata: Metadata = {
    title: 'Snap & Match | PaintPile',
    description: 'Match colors from photos to your paint inventory.',
};

export default function ColorMatchPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto p-6 md:p-10">
                    <h1 className="text-3xl font-bold font-display text-foreground">Snap & Match</h1>
                    <p className="text-muted-foreground mt-2">
                        Upload a photo, pick a color, and find the closest match in your inventory (and beyond).
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-10">
                <ClientColorMatchWrapper />
            </div>
        </div>
    );
}
