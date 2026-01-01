'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

interface PileStatsProps {
  stats: {
    total: number;
    unpainted: number;
    painting: number;
    painted: number;
    byType: Record<string, number>;
  };
}

const STATUS_COLORS = {
  unpainted: '#6B7280', // gray
  painting: '#2563EB', // blue
  painted: '#16A34A', // green
};

const TYPE_COLORS = [
  '#C026D3', // primary (magenta)
  '#2563EB', // secondary (blue)
  '#16A34A', // success (green)
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
];

export function PileStats({ stats }: PileStatsProps) {
  const statusData = [
    { name: 'Unpainted', value: stats.unpainted, color: STATUS_COLORS.unpainted },
    { name: 'In Progress', value: stats.painting, color: STATUS_COLORS.painting },
    { name: 'Completed', value: stats.painted, color: STATUS_COLORS.painted },
  ];

  const typeData = Object.entries(stats.byType).map(([type, count], index) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: TYPE_COLORS[index % TYPE_COLORS.length],
  }));

  const completionRate = stats.total > 0
    ? ((stats.painted / stats.total) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Count */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Total Miniatures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-gray-900">{stats.total}</div>
          <p className="text-sm text-gray-500 mt-1">in your pile</p>
        </CardContent>
      </Card>

      {/* Unpainted */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Unpainted</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-gray-700">{stats.unpainted}</div>
          <p className="text-sm text-gray-500 mt-1">waiting to start</p>
        </CardContent>
      </Card>

      {/* In Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-secondary-600">{stats.painting}</div>
          <p className="text-sm text-gray-500 mt-1">currently painting</p>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-success-600">{stats.painted}</div>
          <p className="text-sm text-gray-500 mt-1">{completionRate}% completion</p>
        </CardContent>
      </Card>

      {/* Status Breakdown Chart */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.total > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              No data to display
            </div>
          )}
        </CardContent>
      </Card>

      {/* Type Breakdown Chart */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle>By Type</CardTitle>
        </CardHeader>
        <CardContent>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#C026D3">
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              No data to display
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
