'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ArmyCard } from '@/components/armies/ArmyCard';
import { getPublicProjects } from '@/lib/firestore/projects';
import { getPublicArmies } from '@/lib/firestore/armies';
import { getProjectPhotos } from '@/lib/firestore/photos';
import { getProject } from '@/lib/firestore/projects';
import { Project } from '@/types/project';
import { Army, GalleryItem } from '@/types/army';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function GalleryPage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<'all' | 'projects' | 'armies'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadGalleryContent() {
      try {
        setLoading(true);

        // Load both projects and armies in parallel
        const [publicProjects, publicArmies] = await Promise.all([
          getPublicProjects(50),
          getPublicArmies(50)
        ]);

        // Load cover photos for projects
        const photoMap = new Map<string, string>();
        await Promise.all(
          publicProjects.map(async (project) => {
            try {
              const photos = await getProjectPhotos(project.projectId);
              if (photos.length > 0) {
                let coverPhoto = photos[0];
                if (project.featuredPhotoId) {
                  const featuredPhoto = photos.find(p => p.photoId === project.featuredPhotoId);
                  if (featuredPhoto) {
                    coverPhoto = featuredPhoto;
                  }
                }
                photoMap.set(project.projectId, coverPhoto.thumbnailUrl || coverPhoto.url);
              }
            } catch (err) {
              console.error(`Error loading photos for project ${project.projectId}:`, err);
            }
          })
        );

        // Load cover photos for armies
        await Promise.all(
          publicArmies.map(async (army) => {
            try {
              if (army.customPhotoUrl) {
                photoMap.set(army.armyId, army.customPhotoUrl);
                return;
              }

              // Otherwise, iterate projects to find the featured photo or a valid fallback
              if (army.projectIds.length > 0) {
                let fallbackUrl: string | null = null;

                // Check projects until we find the featured one or run out
                for (const projectId of army.projectIds) {
                  try {
                    // Try to load project - this might fail if we lack permission (e.g. private project in shared army)
                    const project = await getProject(projectId);
                    if (!project) continue;

                    const photos = await getProjectPhotos(projectId);
                    if (photos.length > 0) {
                      const coverPhoto = photos[0];
                      const firstUrl = coverPhoto.thumbnailUrl || coverPhoto.url;

                      // Capture the first valid photo as fallback
                      if (!fallbackUrl) fallbackUrl = firstUrl;

                      // If this is the featured photo, we're done!
                      if (army.featuredPhotoId) {
                        const featured = photos.find(p => p.photoId === army.featuredPhotoId);
                        if (featured) {
                          photoMap.set(army.armyId, featured.thumbnailUrl || featured.url);
                          return; // Found the specific featured one, stop checking
                        }
                      }
                    }
                  } catch (err) {
                    // Ignore permission errors for private projects, just skip them
                    continue;
                  }
                }

                // If we didn't find the specific featured photo but found a fallback, use it
                if (fallbackUrl && !photoMap.has(army.armyId)) {
                  photoMap.set(army.armyId, fallbackUrl);
                }
              }
            } catch (err) {
              console.error(`Error processing army ${army.armyId}:`, err);
            }
          })
        );

        setCoverPhotos(photoMap);

        // Create unified gallery items
        const items: GalleryItem[] = [
          ...publicProjects.map(p => ({
            type: 'project' as const,
            data: p,
            coverPhoto: photoMap.get(p.projectId)
          })),
          ...publicArmies.map(a => ({
            type: 'army' as const,
            data: a,
            coverPhoto: photoMap.get(a.armyId)
          }))
        ];

        // Sort by updatedAt
        items.sort((a, b) => {
          const aTime = a.data.updatedAt?.toMillis?.() || 0;
          const bTime = b.data.updatedAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

        setGalleryItems(items);
      } catch (error) {
        console.error('Error loading gallery content:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGalleryContent();
  }, [refreshKey]);

  const filteredItems = galleryItems.filter((item) => {
    // Content type filter
    if (contentTypeFilter !== 'all') {
      if (contentTypeFilter === 'projects' && item.type !== 'project') return false;
      if (contentTypeFilter === 'armies' && item.type !== 'army') return false;
    }

    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      item.data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.data.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.data.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter (only applies to projects)
    let matchesStatus = true;
    if (item.type === 'project' && statusFilter !== 'all') {
      matchesStatus = item.data.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  const contentTypeButtons = [
    { id: 'all' as const, label: 'All Content' },
    { id: 'projects' as const, label: 'Projects' },
    { id: 'armies' as const, label: 'Armies' },
  ];

  const statusFilterButtons = [
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
        <div className="space-y-4 mb-8">
          {/* Search and Refresh */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects, armies, tags..."
                className="pl-10 bg-card border-border/50 shadow-sm focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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

          {/* Content Type Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {contentTypeButtons.map((filter) => (
              <Button
                key={filter.id}
                variant={contentTypeFilter === filter.id ? "default" : "outline"}
                onClick={() => setContentTypeFilter(filter.id)}
                className="whitespace-nowrap"
              >
                {filter.label}
              </Button>
            ))}
          </div>

          {/* Status Filter (Projects Only) */}
          {contentTypeFilter !== 'armies' && (
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              {statusFilterButtons.map((filter) => (
                <Button
                  key={filter.id}
                  variant={statusFilter === filter.id ? "default" : "outline"}
                  onClick={() => setStatusFilter(filter.id)}
                  size="sm"
                  className="capitalize whitespace-nowrap"
                >
                  {filter.label.replace("-", " ")}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              if (item.type === 'project') {
                return (
                  <ProjectCard
                    key={item.data.projectId}
                    project={item.data}
                    coverPhotoUrl={item.coverPhoto}
                  />
                );
              } else {
                return (
                  <ArmyCard
                    key={item.data.armyId}
                    army={item.data}
                    coverPhotoUrl={item.coverPhoto}
                  />
                );
              }
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== 'all' || contentTypeFilter !== 'all'
                ? 'No items match your filters.'
                : 'No public content yet. Be the first to share!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
