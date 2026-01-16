import { format } from 'date-fns';
import { NewsPost, NewsType } from '@/types/news';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar, Megaphone, Zap, Info, Wrench } from 'lucide-react';

interface NewsCardProps {
    post: NewsPost;
}

const TYPE_CONFIG: Record<NewsType, { label: string; color: string; icon: any }> = {
    update: { label: 'Update', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: Zap },
    feature: { label: 'New Feature', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Megaphone },
    announcement: { label: 'Announcement', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Info },
    maintenance: { label: 'Maintenance', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Wrench },
};

export function NewsCard({ post }: NewsCardProps) {
    const config = TYPE_CONFIG[post.type] || TYPE_CONFIG.update;
    const Icon = config.icon;

    // Handle Firestore Timestamp or Date object
    const dateObj = post.date?.toDate ? post.date.toDate() : new Date(post.date);

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md border-l-4" style={{ borderLeftColor: getBorderColor(post.type) }}>
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`${config.color} gap-1.5 pl-1.5`}>
                                <Icon className="w-3.5 h-3.5" />
                                {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(dateObj, 'MMM d, yyyy')}
                            </span>
                        </div>
                        <CardTitle className="text-xl leading-tight">{post.title}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                    {post.content}
                </div>
            </CardContent>
        </Card>
    );
}

function getBorderColor(type: NewsType): string {
    switch (type) {
        case 'feature': return '#3b82f6'; // blue-500
        case 'update': return '#10b981'; // emerald-500
        case 'announcement': return '#a855f7'; // purple-500
        case 'maintenance': return '#f59e0b'; // amber-500
        default: return '#64748b'; // slate-500
    }
}
