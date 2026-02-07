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
    ArrowRight,
    ChefHat,
    Shield,
    Book,
    Wand2,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function FeaturesPage() {
    const features = [
        {
            title: 'Collection Tracking',
            description: 'Keep track of your entire miniature collection. From pile of shame to fully painted armies.',
            icon: Boxes,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            href: '/pile'
        },
        {
            title: 'Smart Paint Recipes',
            description: 'Create, share, and discover paint recipes. AI helps you find color matches and mixing ratios.',
            icon: ChefHat,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
            href: '/recipes' // Guide: /guides/recipes
        },
        {
            title: 'Army Management',
            description: 'Organize your models into armies. Track progress, points, and project completion status.',
            icon: Shield,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            href: '/armies'
        },
        {
            title: 'Paint Diary',
            description: 'Journal your painting journey. Log time, techniques used, and improvements on every model.',
            icon: Book,
            color: 'text-green-500',
            bg: 'bg-green-500/10',
            href: '/diary'
        },
        {
            title: 'AI Paint Critic',
            description: 'Get instant feedback on your painting. Our AI analyzes technique, contrast, and color theory.',
            icon: Sparkles,
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            href: '/guides/ai-critic'
        },
        {
            title: 'AI Scheme Visualizer',
            description: 'Visualize color schemes on your minis before you paint. Test ideas instantly.',
            icon: Wand2,
            color: 'text-pink-500',
            bg: 'bg-pink-500/10',
            href: '/guides/ai-tools' // Goes to the unified AI tools guide
        },
        {
            title: 'AI Paint Tools',
            description: 'Color match from photos and get mixing recipes. Never guess a color again.',
            icon: Palette,
            color: 'text-indigo-500',
            bg: 'bg-indigo-500/10',
            href: '/guides/ai-tools'
        },
        {
            title: 'Community Sharing',
            description: 'Share your work, get inspired, and join challenges with other hobbyists.',
            icon: Users,
            color: 'text-yellow-500',
            bg: 'bg-yellow-500/10',
            href: '/community'
        },
        {
            title: 'Discovery',
            description: 'Explore a massive database of paints from all major brands. Find equivalents easily.',
            icon: Search,
            color: 'text-cyan-500',
            bg: 'bg-cyan-500/10',
            href: '/guides/paint-database'
        },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-12 px-4 animate-in fade-in duration-500">
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
                    <Link key={index} href={feature.href} className="block h-full">
                        <Card className="h-full border-border/50 hover:border-primary/50 transition-colors cursor-pointer hover:bg-accent/5">
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
                    </Link>
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
