import { Metadata } from 'next';
import { ClientLightingRefWrapper } from './ClientLightingRefWrapper';

export const metadata: Metadata = {
    title: 'Lighting Reference | PaintPile',
    description: 'Visualize where highlights and shadows fall on your miniature based on light direction.',
};

export default function LightingRefPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-10">
                    <h1 className="text-3xl font-bold font-display text-foreground">Lighting Reference</h1>
                    <p className="text-muted-foreground mt-2">
                        Upload a photo of your mini, then interactively preview where highlights and shadows fall from any light direction.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-10">
                <ClientLightingRefWrapper />
            </div>
        </div>
    );
}
