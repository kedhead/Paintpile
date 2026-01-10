'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Project } from '@/types/project';
import { TAG_SHAME } from '@/lib/utils/constants';

interface PileStatsProps {
  projects: Project[];
}

const STATUS_COLORS = {
  'not-started': '#6B7280', // gray
  'in-progress': '#2563EB', // blue
  'completed': '#16A34A', // green
};

const TAG_COLORS = [
  '#C026D3', // primary (magenta)
  '#2563EB', // secondary (blue)
  '#16A34A', // success (green)
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // purple
];

export function PileStats({ projects }: PileStatsProps) {
  // Calculate stats from projects
  const stats = useMemo(() => {
    const result = {
      total: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      byTag: {} as Record<string, number>,
    };

    projects.forEach((project) => {
      const qty = project.quantity || 1;
      result.total += qty;

      // Count by status
      if (project.status === 'not-started') result.notStarted += qty;
      else if (project.status === 'in-progress') result.inProgress += qty;
      else if (project.status === 'completed') result.completed += qty;

      // Count by tags (excluding 'shame')
      project.tags
        ?.filter((tag) => tag !== TAG_SHAME)
        .forEach((tag) => {
          result.byTag[tag] = (result.byTag[tag] || 0) + qty;
        });
    });

    return result;
  }, [projects]);

  const statusData = [
    { name: 'Not Started', value: stats.notStarted, color: STATUS_COLORS['not-started'] },
    { name: 'In Progress', value: stats.inProgress, color: STATUS_COLORS['in-progress'] },
    { name: 'Completed', value: stats.completed, color: STATUS_COLORS['completed'] },
  ];

  const tagData = Object.entries(stats.byTag).map(([tag, count], index) => ({
    name: tag.charAt(0).toUpperCase() + tag.slice(1),
    value: count,
    color: TAG_COLORS[index % TAG_COLORS.length],
  }));

  const completionRate = stats.total > 0
    ? ((stats.completed / stats.total) * 100).toFixed(1)
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

      {/* Not Started */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Not Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-gray-700">{stats.notStarted}</div>
          <p className="text-sm text-gray-500 mt-1">waiting to start</p>
        </CardContent>
      </Card>

      {/* In Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-secondary-600">{stats.inProgress}</div>
          <p className="text-sm text-gray-500 mt-1">currently painting</p>
        </CardContent>
      </Card>

      {/* Completed */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-success-600">{stats.completed}</div>
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
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
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

      {/* Tag Breakdown Chart */}
      <Card className="md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle>By Tag</CardTitle>
        </CardHeader>
        <CardContent>
          {tagData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={tagData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#C026D3">
                  {tagData.map((entry, index) => (
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
