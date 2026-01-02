'use client';

import { useState } from 'react';
import { Comment } from '@/types/social';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { Edit2, Trash2, X, Check } from 'lucide-react';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onEdit: (commentId: string, newContent: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

export function CommentItem({ comment, currentUserId, onEdit, onDelete }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = currentUserId === comment.userId;

  async function handleSaveEdit() {
    if (!editedContent.trim()) return;

    try {
      setIsSubmitting(true);
      await onEdit(comment.commentId, editedContent.trim());
      setIsEditing(false);
    } catch (err) {
      console.error('Error editing comment:', err);
      alert('Failed to edit comment');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this comment?')) return;

    try {
      await onDelete(comment.commentId);
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment');
    }
  }

  function handleCancelEdit() {
    setEditedContent(comment.content);
    setIsEditing(false);
  }

  return (
    <div className="flex gap-3 py-4 border-b border-border last:border-0">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        {comment.userPhotoURL ? (
          <img
            src={comment.userPhotoURL}
            alt={comment.username}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span className="text-sm font-semibold text-primary">
            {comment.username[0]?.toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-card-foreground">
            {comment.username}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(comment.createdAt)}
            {comment.edited && ' (edited)'}
          </span>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editedContent.trim()}
              >
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-card-foreground whitespace-pre-wrap">
              {comment.content}
            </p>

            {isOwner && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
