'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/Spinner';
import { ArmyList } from '@/components/armies/ArmyList';
import { getUserArmies } from '@/lib/firestore/armies';
import { getProjectPhotos } from '@/lib/firestore/photos';
import { getProject } from '@/lib/firestore/projects';
import { Army } from '@/types/army';
import { Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function ArmiesPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [armies, setArmies] = useState<Army[]>([]);
  const [coverPhotos, setCoverPhotos] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [factionFilter, setFactionFilter] = useState<string>('all');

  useEffect(() => {
    async function loadArmies() {
      if (!currentUser) return;

      try {
        setLoading(true);
        const userArmies = await getUserArmies(currentUser.uid);
        setArmies(userArmies);

        // Load cover photos for each army
        const photoMap = new Map<string, string>();
        await Promise.all(
          userArmies.map(async (army) => {
            try {
              // If army has a custom photo, use that
              if (army.customPhotoUrl) {
                photoMap.set(army.armyId, army.customPhotoUrl);
                return;
              }

              // Otherwise, try to get a photo from the featured project or first project
              if (army.projectIds.length > 0) {
                const projectId = army.featuredPhotoId
                  ? army.featuredPhotoId
                  : army.projectIds[0];

                const project = await getProject(projectId);
                if (project) {
                  const photos = await getProjectPhotos(projectId);
                  if (photos.length > 0) {
                    let coverPhoto = photos[0];
                    if (project.featuredPhotoId) {
                      const featuredPhoto = photos.find(p => p.photoId === project.featuredPhotoId);
                      if (featuredPhoto) {
                        coverPhoto = featuredPhoto;
                      }
                    }
                    photoMap.set(army.armyId, coverPhoto.thumbnailUrl || coverPhoto.url);
                  }
                }
              }
            } catch (err) {
              console.error(`Error loading photos for army ${army.armyId}:`, err);
            }
          })
        );
        setCoverPhotos(photoMap);
      } catch (error) {
        console.error('Error loading armies:', error);
      } finally {
        setLoading(false);
      }
    }

    loadArmies();
  }, [currentUser]);

  const filteredArmies = armies.filter((army) => {
    const matchesSearch =
      searchQuery === '' ||
      army.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      army.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      army.faction?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      army.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFaction = factionFilter === 'all' || army.faction === factionFilter;

    return matchesSearch && matchesFaction;
  });

  // Get unique factions for filtering
  const uniqueFactions = Array.from(new Set(armies.map(a => a.faction).filter(Boolean)));

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
              My Armies
            </h2>
            <p className="text-muted-foreground max-w-xl text-lg font-light">
              "Build your forces. Command your collections."
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
              placeholder="Search armies, factions..."
              className="pl-10 bg-card border-border/50 shadow-sm focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <Button
              variant={factionFilter === 'all' ? "default" : "outline"}
              onClick={() => setFactionFilter('all')}
              className="whitespace-nowrap"
            >
              All Factions
            </Button>
            {uniqueFactions.slice(0, 3).map((faction) => (
              <Button
                key={faction}
                variant={factionFilter === faction ? "default" : "outline"}
                onClick={() => setFactionFilter(faction!)}
                className="whitespace-nowrap"
              >
                {faction}
              </Button>
            ))}
            {uniqueFactions.length > 3 && (
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <ArmyList
              armies={filteredArmies}
              coverPhotos={coverPhotos}
              showCreateButton={false}
            />

            {/* New Army Card */}
            <Link href="/armies/new">
              <div className="block h-full min-h-[300px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-card/50 transition-all cursor-pointer p-6">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="text-4xl font-light">+</span>
                </div>
                <h3 className="font-display font-bold text-lg">New Army</h3>
                <p className="text-sm opacity-70">Build a new collection</p>
              </div>
            </Link>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredArmies.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">
              {searchQuery || factionFilter !== 'all'
                ? 'No armies match your filters.'
                : 'No armies yet. Start your first army!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
