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
import { TrendingUp, DollarSign, Palette } from 'lucide-react';

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
    const [stats, setStats] = useState({
        totalPaints: 0,
        totalValue: 0,
        brandData: [] as { name: string; value: number }[],
    });

    useEffect(() => {
        async function loadStats() {
            if (!currentUser) return;

            try {
                // 1. Fetch user inventory and all global paints in parallel
                const [inventory, allPaints] = await Promise.all([
                    getUserInventory(currentUser.uid),
                    getAllPaints()
                ]);

                // 2. Map inventory to full paint details
                // Create a lookup map for faster access
                const paintMap = new Map<string, Paint>();
                allPaints.forEach(p => paintMap.set(p.paintId, p));

                const brandCounts: Record<string, number> = {};
                let matchedCount = 0;

                inventory.forEach(item => {
                    const paint = paintMap.get(item.paintId);
                    if (paint) {
                        matchedCount++;
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
                        console.warn(`[Analytics] Orphaned paint found in inventory: ${item.paintId}`);

                        // Count unmatched paints as "Other"
                        brandCounts['Other'] = (brandCounts['Other'] || 0) + 1;
                    }
                });

                // 3. Prepare chart data
                const brandData = Object.entries(brandCounts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value); // Sort by count descending

                setStats({
                    totalPaints: inventory.length,
                    totalValue: inventory.length * ESTIMATED_PRICE_PER_PAINT,
                    brandData
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Palette className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Paints</p>
                            <h3 className="text-2xl font-bold">{stats.totalPaints}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-full">
                            <DollarSign className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Collection Value</p>
                            <h3 className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</h3>
                            <p className="text-xs text-muted-foreground">Est. @ ${ESTIMATED_PRICE_PER_PAINT}/pot</p>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-full">
                            <TrendingUp className="w-6 h-6 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Top Brand</p>
                            <h3 className="text-2xl font-bold truncate max-w-[150px]">
                                {stats.brandData[0]?.name || 'N/A'}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Brand Breakdown Bar Chart */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6">Brand Distribution</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.brandData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '0.5rem',
                                    }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {stats.brandData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={BRAND_COLORS[entry.name] || COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Brand Breakdown Pie Chart */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
                    <h3 className="text-lg font-semibold mb-2 self-start">Market Share</h3>
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.brandData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.brandData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={BRAND_COLORS[entry.name] || COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '0.5rem',
                                    }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
