'use client';

import { Activity, ACTIVITY_MESSAGES } from '@/types/activity';
import { Heart, MessageCircle, UserPlus, Shield, Palette, BookOpen, CheckCircle, Globe, MoreHorizontal, Share2, ArrowUpRight, Copy, Eye, Flag, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { saveProject } from '@/lib/firestore/projects';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const { currentUser } = useAuth();

  // Get the target URL
  const getTargetUrl = () => {
    switch (activity.targetType) {
      case 'project':
        return `/projects/${activity.targetId}`;
      case 'army':
        return `/armies/${activity.targetId}`;
      case 'recipe':
        return `/recipes/${activity.targetId}`;
      case 'user':
        // Safe username fallback
        const username = activity.metadata?.targetUsername;
        const safeUsername = (username && !username.includes(' ')) ? username : activity.targetId;
        return `/users/${safeUsername}`;
      default:
        return '#';
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${getTargetUrl()}`;
    navigator.clipboard.writeText(url);
    // Could add toast here
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser) return;

    try {
      if (activity.targetType === 'project') {
        await saveProject(currentUser.uid, activity.targetId);
        // Replace with a nicer toast if available
        // alert('Project saved to your list!'); 
        // Silent success is fine if no toast, or change icon state?
        // For now, let's mostly assume it works.
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const timeAgo = activity.createdAt
    ? formatDistanceToNow(activity.createdAt.toDate(), { addSuffix: true })
    : '';

  // Activity context message (e.g. "created a project")
  const actionText = ACTIVITY_MESSAGES[activity.type](activity.metadata).split(':')[0]; // Get just the action part

  const isRichActivity = ['project_created', 'army_created', 'recipe_created', 'project_critique_shared'].includes(activity.type);
  const heroImage = activity.metadata.projectPhotoUrl || activity.metadata.armyPhotoUrl || (activity.type === 'recipe_created' ? activity.metadata.targetPhotoUrl : null); // Recipe might have one too
  const title = activity.metadata.projectName || activity.metadata.armyName || activity.metadata.recipeName;
  const description = activity.metadata.description || ''; // We might not have this in metadata yet, but good to fallback

  // If it's a "Follow" or simple "Like", use a compact card
  if (!isRichActivity && activity.type !== 'comment_created') {
    return (
      <div className="mb-4 p-4 rounded-xl bg-card/50 border border-border flex items-center gap-4">
        {/* Avatar */}
        <Link href={`/users/${activity.username}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border">
            {activity.userPhotoUrl ? (
              <img src={activity.userPhotoUrl} alt={activity.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400 font-bold">
                {activity.username[0]?.toUpperCase()}
              </div>
            )}
          </div>
        </Link>
        <div className="flex-1">
          <p className="text-sm text-foreground">
            <Link href={`/users/${activity.username}`} className="font-bold hover:text-orange-500 transition-colors">{activity.username}</Link>
            {' '}<span className="text-muted-foreground">{actionText}</span>
            {' '}<Link href={getTargetUrl()} className="font-bold hover:text-orange-500 transition-colors">
              {activity.metadata.targetUsername || 'something'}
            </Link>
          </p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>
    )
  }

  // RICH CARD (Grimdark Style)
  return (
    <div className="mb-6 bg-[#0f1115] border border-border/40 rounded-xl overflow-hidden shadow-sm hover:shadow-orange-500/5 transition-all duration-300 group">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/users/${activity.username}`}>
            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden border border-border group-hover:border-orange-500/30 transition-colors">
              {activity.userPhotoUrl ? (
                <img src={activity.userPhotoUrl} alt={activity.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400 font-bold">
                  {activity.username[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link href={`/users/${activity.username}`} className="text-sm font-bold text-foreground hover:text-orange-500 transition-colors text-transform uppercase tracking-wide">
                {activity.username}
              </Link>
              <span className="text-xs text-muted-foreground uppercase">{timeAgo}</span>
            </div>
            <p className="text-xs text-muted-foreground/60 uppercase tracking-widest font-bold">
              {(activity.metadata as any).faction || 'Hobbyist'}
            </p>
          </div>
        </div>

        {/* Action Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground outline-none transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-[#1a1d24] border-border text-foreground">
            <DropdownMenuItem asChild className="focus:bg-muted/10 cursor-pointer">
              <Link href={getTargetUrl()} className="flex items-center w-full">
                <Eye className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>View Project</span>
              </Link>
            </DropdownMenuItem>

            {activity.targetType === 'project' && currentUser && (
              <DropdownMenuItem onClick={handleSave} className="focus:bg-muted/10 cursor-pointer">
                <Bookmark className="w-4 h-4 mr-2 text-muted-foreground" />
                <span>Save Project</span>
              </DropdownMenuItem>
            )}


            <DropdownMenuItem onClick={handleShare} className="focus:bg-muted/10 cursor-pointer">
              <Copy className="w-4 h-4 mr-2 text-muted-foreground" />
              <span>Share Link</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer">
              <Flag className="w-4 h-4 mr-2" />
              <span>Report Content</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hero Image or Fallback */}
      {
        isRichActivity && (
          <Link href={getTargetUrl()} className="block relative aspect-video w-full overflow-hidden bg-black group-image">
            {heroImage ? (
              <img
                src={heroImage}
                alt={title || 'Project Image'}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-zinc-700 via-zinc-900 to-black flex items-center justify-center group-hover:scale-105 transition-all duration-700">
                <div className="text-white/20">
                  {activity.targetType === 'army' ? <Shield className="w-20 h-20" /> : <Palette className="w-20 h-20" />}
                </div>
              </div>
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent opacity-60" />
          </Link>
        )
      }

      {/* Content */}
      <div className="p-5 relative">
        {/* Title */}
        {title && (
          <Link href={getTargetUrl()} className="block mb-2">
            <h3 className="text-2xl font-display font-black text-foreground uppercase leading-none hover:text-orange-500 transition-colors">
              {title}
            </h3>
          </Link>
        )}

        {/* Description / Metadata */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {description || `Updated their ${activity.targetType} with new progress. Check out the latest photos and painting recipes.`}
        </p>

        {/* Comment Preview (if comment type) */}
        {activity.type === 'comment_created' && activity.metadata.commentPreview && (
          <div className="mb-4 p-3 bg-muted/20 border-l-2 border-orange-500/50 text-sm text-muted-foreground italic">
            "{activity.metadata.commentPreview}"
            {title && <div className="mt-1 text-xs not-italic text-muted-foreground/50">on <span className="text-foreground">{title}</span></div>}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-red-500 transition-colors group/like">
              <Heart className="w-4 h-4 group-hover/like:fill-current" />
              <span>{(activity.metadata as any).likeCount || 0}</span>
            </button>
            <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-blue-500 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>{(activity.metadata as any).commentCount || 0}</span>
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          <Link href={getTargetUrl()}>
            <Button size="sm" className="bg-orange-600/90 hover:bg-orange-500 text-white font-bold uppercase tracking-wider text-[10px] h-8 px-4">
              View Project <ArrowUpRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div >
  );
}
