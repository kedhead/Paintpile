'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserInventory } from '@/lib/firestore/inventory';
import { getAllPaints } from '@/lib/firestore/paints';
import { UserOwnedPaint, Paint } from '@/types/paint';
import { Spinner } from '@/components/ui/Spinner';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { TrendingUp, DollarSign, Palette, Archive, Layers, CheckCircle2 } from 'lucide-react';
import { getUserProjects } from '@/lib/firestore/projects';
import { Project } from '@/types/project';


// Estimated average price per paint pot
const ESTIMATED_PRICE_PER_PAINT = 4.50;

// Brand colors for charts
const BRAND_COLORS: Record<string, string> = {
    'Citadel': '#1d4ed8', // blue-700
    'Army Painter': '#b91c1c', // red-700
    'Vallejo': '#15803d', // green-700
    'Pro Acryl': '#7e22ce', // purple-700
    'ProAcryl': '#7e22ce', // purple-700 (handle missing space variation)
    'Monument': '#7e22ce', // purple-700
    'Other': '#64748b', // slate-500
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function AnalyticsDashboard() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        totalPaints: number;
        totalValue: number;
        brandData: { name: string; value: number }[];
        projectStats?: {
            notStarted: number;
            inProgress: number;
            completed: number;
            total: number;
        };
    }>({
        totalPaints: 0,
        totalValue: 0,
        brandData: [],
    });
    const [projects, setProjects] = useState<Project[]>([]);
    const [showPileDetails, setShowPileDetails] = useState(false);

    useEffect(() => {
        async function loadStats() {
            if (!currentUser) return;

            try {
                // 1. Fetch data
                const [allPaints, inventory, userProjects] = await Promise.all([
                    getAllPaints(),
                    getUserInventory(currentUser.uid),
                    getUserProjects(currentUser.uid)
                ]);

                // Store projects for drill-down
                setProjects(userProjects);

                // 2. Process Data

                // Create a lookup map for faster access
                const paintMap = new Map<string, Paint>();
                allPaints.forEach(p => paintMap.set(p.paintId, p));

                const brandCounts: Record<string, number> = {};
                let matchedCount = 0;
                let validInventoryCount = 0;

                inventory.forEach(item => {
                    const paint = paintMap.get(item.paintId);
                    if (paint) {
                        matchedCount++;
                        validInventoryCount++;
                        const brand = paint.brand || 'Other';
                        // Normalize brand names if needed
                        const normalizedBrand = brand.includes('Army Painter') ? 'Army Painter' :
                            brand.includes('Citadel') ? 'Citadel' :
                                brand.includes('Vallejo') ? 'Vallejo' :
                                    (brand.includes('Pro Acryl') || brand.includes('ProAcryl')) ? 'Pro Acryl' :
                                        brand;

                        brandCounts[normalizedBrand] = (brandCounts[normalizedBrand] || 0) + 1;
                    } else {
                        // Paint ID exists in inventory but not in global database
                        // We filter these out to avoid the massive "Other" category for orphaned data
                        console.warn(`[Analytics] Filtering orphaned paint: ${item.paintId}`);
                    }
                });

                // 3. Prepare chart data
                const brandData = Object.entries(brandCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value); // Sort by count descending

                // 4. Process Project Stats
                const projectStats = {
                    notStarted: 0,
                    inProgress: 0,
                    completed: 0,
                    total: userProjects.length
                };

                userProjects.forEach(p => {
                    if (p.status === 'not-started') projectStats.notStarted++;
                    else if (p.status === 'in-progress') projectStats.inProgress++;
                    else if (p.status === 'completed') projectStats.completed++;
                });

                setStats({
                    totalPaints: validInventoryCount,
                    totalValue: validInventoryCount * ESTIMATED_PRICE_PER_PAINT,
                    brandData,
                    projectStats
                });

            } catch (error) {
                console.error('Failed to load analytics:', error);
            } finally {
                setLoading(false);
            }
        }

        loadStats();
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Spinner size="lg" />
            </div>
        );
    }

    if (stats.totalPaints === 0) {
        return null; // Don't show if no paints
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                            <Palette className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Paints</p>
                            <h3 className="text-2xl font-bold">{stats.totalPaints}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-500">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Collection Value</p>
                            <h3 className="text-2xl font-bold">
                                ${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-xs text-muted-foreground">Est. @ ${ESTIMATED_PRICE_PER_PAINT}/pot</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                            <Layers className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Projects</p>
                            <h3 className="text-2xl font-bold">
                                {stats.projectStats?.total || 0}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Status */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-foreground">Project Status</h3>
                        {stats.projectStats && stats.projectStats.notStarted > 0 && (
                            <button
                                onClick={() => setShowPileDetails(true)}
                                className="text-sm text-primary hover:underline font-medium"
                            >
                                View Pile of Opportunity
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Progress Bars */}
                        <div className="space-y-4">
                            {/* Pile of Opportunity */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Archive className="w-4 h-4" /> Pile of Opportunity
                                    </span>
                                    <span className="font-medium bg-secondary px-2 py-0.5 rounded text-xs">
                                        {stats.projectStats?.notStarted || 0}
                                    </span>
                                </div>
                                <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-slate-500 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${stats.projectStats?.total ? (stats.projectStats.notStarted / stats.projectStats.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* In Progress */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" /> In Progress
                                    </span>
                                    <span className="font-medium bg-secondary px-2 py-0.5 rounded text-xs">
                                        {stats.projectStats?.inProgress || 0}
                                    </span>
                                </div>
                                <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${stats.projectStats?.total ? (stats.projectStats.inProgress / stats.projectStats.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            {/* Completed */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Completed
                                    </span>
                                    <span className="font-medium bg-secondary px-2 py-0.5 rounded text-xs">
                                        {stats.projectStats?.completed || 0}
                                    </span>
                                </div>
                                <div className="h-2.5 bg-secondary/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${stats.projectStats?.total ? (stats.projectStats.completed / stats.projectStats.total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Brand Distribution */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6">Paint Brands</h3>
                    <div className="h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stats.brandData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                >
                                    {stats.brandData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={BRAND_COLORS[entry.name] || BRAND_COLORS.Other}
                                            strokeWidth={0}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '0.5rem',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Pile Details Modal */}
            {showPileDetails && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-background rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-border">
                        <div className="p-4 border-b flex justify-between items-center bg-muted/30">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Archive className="w-5 h-5 text-muted-foreground" />
                                Pile of Opportunity
                            </h3>
                            <button
                                onClick={() => setShowPileDetails(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            <div className="space-y-2">
                                {projects.filter(p => p.status === 'not-started').map(project => (
                                    <div key={project.projectId} className="p-3 bg-card border border-border rounded-lg">
                                        <h4 className="font-medium">{project.name}</h4>
                                        <p className="text-xs text-muted-foreground line-clamp-1">{project.description || 'No description'}</p>
                                    </div>
                                ))}
                                {projects.filter(p => p.status === 'not-started').length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">No projects in the pile!</p>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t bg-muted/30 flex justify-end">
                            <button
                                onClick={() => setShowPileDetails(false)}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
