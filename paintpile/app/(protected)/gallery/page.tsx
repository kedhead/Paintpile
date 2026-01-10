'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { getPublicProjects } from '@/lib/firestore/projects';
import { getProjectPhotos } from '@/lib/firestore/photos';
import { Project } from '@/types/project';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function GalleryPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadPublicProjects() {
      try {
        setLoading(true);
        const publicProjects = await getPublicProjects(50); // Load more for community
        setProjects(publicProjects);

        // Load cover photos for each project
        const photoMap: Record<string, string> = {};
        await Promise.all(
          publicProjects.map(async (project) => {
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
        console.error('Error loading public projects:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPublicProjects();
  }, [refreshKey]);

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
            alt="Community Gallery"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"></div>
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2 drop-shadow-lg">
              Community Gallery
            </h2>
            <p className="text-muted-foreground max-w-xl text-lg font-light">
              "Discover amazing miniatures from painters around the world."
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-10 -mt-8 relative z-10">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, tags, techniques..."
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => setRefreshKey(prev => prev + 1)}
              disabled={loading}
              title="Refresh gallery"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No projects match your filters.'
                : 'No public projects yet. Be the first to share!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
