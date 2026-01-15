'use client';

import { DiaryEntry } from '@/types/diary';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Edit2, Trash2, Youtube, FileText, ImageIcon, Link as LinkIcon, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DiaryEntryCardProps {
    entry: DiaryEntry;
    onEdit: (entry: DiaryEntry) => void;
    onDelete: (entryId: string) => void;
}

export function DiaryEntryCard({ entry, onEdit, onDelete }: DiaryEntryCardProps) {
    const getLinkIcon = (type: string) => {
        switch (type) {
            case 'youtube': return <Youtube className="w-4 h-4 text-red-500" />;
            case 'article': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'image': return <ImageIcon className="w-4 h-4 text-green-500" />;
            default: return <LinkIcon className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Calendar className="w-3 h-3" />
                        {entry.createdAt ? formatDistanceToNow(entry.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(entry)} className="h-6 w-6 p-0">
                            <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(entry.entryId)} className="h-6 w-6 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                <h3 className="text-lg font-semibold mb-2 line-clamp-2" title={entry.title}>
                    {entry.title}
                </h3>

                <p className="text-sm text-muted-foreground line-clamp-4 mb-4 whitespace-pre-wrap">
                    {entry.content}
                </p>

                {entry.links.length > 0 && (
                    <div className="space-y-1 mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                            Resources ({entry.links.length})
                        </p>
                        {entry.links.slice(0, 3).map((link, i) => (
                            <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-primary hover:underline truncate"
                            >
                                {getLinkIcon(link.type)}
                                <span className="truncate">{link.description || link.url}</span>
                                <ExternalLink className="w-3 h-3 opacity-50" />
                            </a>
                        ))}
                        {entry.links.length > 3 && (
                            <span className="text-xs text-muted-foreground italic">+ {entry.links.length - 3} more</span>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 pt-0 mt-auto">
                <div className="flex flex-wrap gap-1">
                    {entry.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">
                            #{tag}
                        </Badge>
                    ))}
                </div>
            </div>
        </Card>
    );
}
