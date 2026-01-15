'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { getUserProjects } from '@/lib/firestore/projects';
import { getProjectPhotos } from '@/lib/firestore/photos';
import { Project } from '@/types/project';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function loadProjects() {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userProjects = await getUserProjects(currentUser.uid);
        setProjects(userProjects);

        // Load cover photos for each project
        const photoMap: Record<string, string> = {};
        await Promise.all(
          userProjects.map(async (project) => {
            try {
              const photos = await getProjectPhotos(project.projectId);
              if (photos.length > 0) {
                // Use featured photo if set, otherwise use first photo
                let coverPhoto = photos[0];
                if (project.featuredPhotoId) {
                  const featuredPhoto = photos.find(p => p.photoId === project.featuredPhotoId);
                  if (featuredPhoto) {
                    coverPhoto = featuredPhoto;
                  }
                }
                photoMap[project.projectId] = coverPhoto.thumbnailUrl || coverPhoto.url;
              }
            } catch (err) {
              console.error(`Error loading photos for project ${project.projectId}:`, err);
            }
          })
        );
        setCoverPhotos(photoMap);
      } catch (error) {
        console.error('Error loading projects:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [currentUser]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      searchQuery === '' ||
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filterButtons = [
    { id: 'all', label: 'All' },
    { id: 'not-started', label: 'Planning' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="relative h-64 md:h-80 overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <img
            src="/images/header.png"
            alt="Painting workspace"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2 drop-shadow-lg">
              My Gallery
            </h2>
            <p className="text-muted-foreground max-w-xl text-lg font-light">
              "Every mini tells a story. Keep track of yours."
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-10 -mt-8 relative z-10">

        {/* Analytics Dashboard */}
        <div className="mb-10">
          <AnalyticsDashboard />
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, techniques..."
              className="pl-10 bg-card border-border/50 shadow-sm focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {filterButtons.map((filter) => (
              <Button
                key={filter.id}
                variant={statusFilter === filter.id ? "default" : "outline"}
                onClick={() => setStatusFilter(filter.id)}
                className="capitalize whitespace-nowrap"
              >
                {filter.label.replace("-", " ")}
              </Button>
            ))}
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                coverPhotoUrl={coverPhotos[project.projectId]}
              />
            ))}

            {/* New Project Card */}
            <Link href="/projects/new">
              <div className="block h-full min-h-[300px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-card/50 transition-all cursor-pointer p-6">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-4xl font-light">+</span>
                </div>
                <h3 className="font-display font-bold text-lg">New Project</h3>
                <p className="text-sm opacity-70">Start a new journey</p>
              </div>
            </Link>

            {/* Snap & Match Tool Card */}
            <Link href="/tools/color-match">
              <div className="block h-full min-h-[300px] border border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-card/50 transition-all cursor-pointer p-6 bg-card">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">📸</span>
                </div>
                <h3 className="font-display font-bold text-lg">Snap & Match</h3>
                <p className="text-sm opacity-70">Match real colors to your paints</p>
              </div>
            </Link>

            {/* Smart Mixer Tool Card */}
            <Link href="/tools/paint-mixer">
              <div className="block h-full min-h-[300px] border border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-card/50 transition-all cursor-pointer p-6 bg-card">
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-2xl">🧪</span>
                </div>
                <h3 className="font-display font-bold text-lg">Smart Mixer</h3>
                <p className="text-sm opacity-70">AI mixing recipes</p>
              </div>
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No projects match your filters.'
                : 'No projects yet. Start your first project!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
