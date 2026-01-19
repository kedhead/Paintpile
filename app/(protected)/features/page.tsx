'use client';

import Link from 'next/link';
import {
    Palette,
    BookOpen,
    Swords,
    Boxes,
    Share2,
    Download,
    Sparkles,
    Search,
    BookMarked,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function FeaturesPage() {
    const features = [
        {
            title: 'Collection Tracking',
            description: 'Keep track of your entire miniature collection, from "Pile of Opportunity" to "Parade Ready". Manage inventory of paints, tools, and models.',
            icon: Boxes,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
        },
        {
            title: 'Smart Paint Recipes',
            description: 'Create, organize, and share painting recipes. Link specific paints to steps, estimate time, and attach reference photos.',
            icon: Palette,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
        },
        {
            title: 'Army Management',
            description: 'Group your projects into armies. Track points, total models painted, and overall progress for your entire force.',
            icon: Swords,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
        },
        {
            title: 'Paint Diary',
            description: 'Log your daily painting sessions, notes, and learnings. Tag entries and link relevant tutorials or resources.',
            icon: BookMarked,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
        },
        {
            title: 'AI Paint Tools',
            description: 'Use our AI to identify paints from images, suggest similar colors across brands, or generate recipe ideas.',
            icon: Sparkles,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
        },

        {
            title: 'Community Sharing',
            description: 'Share your recipes and finished projects with the community. Discover new techniques and get inspired by other hobbiests.',
            icon: Share2,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
        },
        {
            title: 'Discovery',
            description: 'Search a vast database of paints and recipes. Find exactly the color you need or the method to achieve that perfect NMM.',
            icon: Search,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
        },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-in fade-in duration-500">
            {/* Hero Section */}
            <div className="text-center space-y-4 pt-8">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    Manage Your Hobby Like a Pro
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    PaintPile brings your entire hobby life into one organized, powerful dashboard.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Link href="/dashboard">
                        <Button size="lg" className="rounded-full px-8">
                            Go to Dashboard
                        </Button>
                    </Link>
                    <Link href="/news">
                        <Button variant="outline" size="lg" className="rounded-full px-8">
                            See What's New
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <Card key={index} className="border-border/50 hover:border-primary/50 transition-colors">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${feature.bg} ${feature.color}`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <CardTitle className="text-lg">{feature.title}</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* CTA */}
            <div className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center space-y-6">
                <div className="text-center space-y-4 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Ready to organize your hobby?
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Join the growing list of painters who are getting more done and stressing less about their backlog.
                    </p>
                    <Link href="/signup">
                        <Button size="lg" className="mt-4 gap-2 text-lg px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105">
                            Get Started Free <ArrowRight className="w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
