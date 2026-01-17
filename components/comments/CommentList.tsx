'use client';

import { useState, useEffect } from 'react';
import { Comment } from '@/types/social';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { Spinner } from '@/components/ui/Spinner';
import { getEntityComments, createEntityComment, updateEntityComment, deleteEntityComment } from '@/lib/firestore/comments';
import { MessageSquare } from 'lucide-react';

interface CommentListProps {
  targetId: string;
  type?: 'project' | 'army' | 'recipe';
  projectId?: string; // Legacy
  currentUserId?: string;
  currentUsername?: string;
  currentUserPhoto?: string;
  isPublic: boolean;
}

export function CommentList({
  targetId: propTargetId,
  type = 'project',
  projectId, // Legacy
  currentUserId,
  currentUsername,
  currentUserPhoto,
  isPublic,
}: CommentListProps) {
  const targetId = projectId || propTargetId;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [targetId, type]);

  async function loadComments() {
    try {
      setLoading(true);
      const entityComments = await getEntityComments(targetId, type);
      setComments(entityComments);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddComment(content: string) {
    if (!currentUserId || !currentUsername) {
      alert('You must be logged in to comment');
      return;
    }

    try {
      await createEntityComment(targetId, type, currentUserId, currentUsername, currentUserPhoto, content);
      await loadComments();
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  }

  async function handleEditComment(commentId: string, newContent: string) {
    try {
      await updateEntityComment(targetId, type, commentId, newContent);
      await loadComments();
    } catch (err) {
      console.error('Error editing comment:', err);
      throw err;
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!currentUserId) return;

    try {
      await deleteEntityComment(targetId, type, commentId, currentUserId);
      await loadComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
      throw err;
    }
  }

  if (!isPublic) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">
          Comments ({comments.length})
        </h3>
      </div>

      {currentUserId && (
        <CommentForm onSubmit={handleAddComment} />
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-0">
          {comments.map((comment) => (
            <CommentItem
              key={comment.commentId}
              comment={comment}
              currentUserId={currentUserId}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
