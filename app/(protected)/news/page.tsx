'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNewsPosts } from '@/lib/firestore/news';
import { NewsPost } from '@/types/news';
import { NewsCard } from '@/components/news/NewsCard';
import { CreateNewsDialog } from '@/components/news/CreateNewsDialog';
import { Spinner } from '@/components/ui/Spinner';
import { Newspaper } from 'lucide-react';

export default function NewsPage() {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAdmin } = useAuth(); // Assuming useAuth exposes isAdmin boolean

    const fetchNews = async () => {
        try {
            setLoading(true);
            const data = await getNewsPosts();
            setPosts(data);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between pb-4 border-b">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Newspaper className="w-8 h-8 text-primary" />
                        What's New
                    </h1>
                    <p className="text-muted-foreground">
                        Latest updates, features, and announcements from the PaintPile team.
                    </p>
                </div>

                {/* Only show Add button for admins */}
                {isAdmin && (
                    <CreateNewsDialog onPostCreated={fetchNews} />
                )}
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Spinner size="lg" />
                </div>
            ) : posts.length > 0 ? (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <NewsCard key={post.id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">No news posts yet.</p>
                </div>
            )}
        </div>
    );
}
