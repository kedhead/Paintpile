import { Metadata } from 'next';
import { ClientPaintMixerWrapper } from './ClientPaintMixerWrapper';

export const metadata: Metadata = {
    title: 'Smart Mixing Assistant | PaintPile',
    description: 'AI-powered paint mixing recipes using your inventory.',
};

export default function PaintMixerPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto p-6 md:p-10">
                    <h1 className="text-3xl font-bold font-display text-foreground">Smart Mixing Assistant</h1>
                    <p className="text-muted-foreground mt-2">
                        Don't have a color? Let AI calculate a mixing recipe from the paints you own.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-10">
                <ClientPaintMixerWrapper />
            </div>
        </div>
    );
}
