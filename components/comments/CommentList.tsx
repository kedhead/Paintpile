'use client';

import { useState, useEffect } from 'react';
import { Comment } from '@/types/social';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { Spinner } from '@/components/ui/Spinner';
import { getProjectComments, createComment, updateComment, deleteComment } from '@/lib/firestore/comments';
import { MessageSquare } from 'lucide-react';

interface CommentListProps {
  projectId: string;
  currentUserId?: string;
  currentUsername?: string;
  currentUserPhoto?: string;
  isPublic: boolean;
}

export function CommentList({
  projectId,
  currentUserId,
  currentUsername,
  currentUserPhoto,
  isPublic,
}: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [projectId]);

  async function loadComments() {
    try {
      setLoading(true);
      const projectComments = await getProjectComments(projectId);
      setComments(projectComments);
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
      await createComment(projectId, currentUserId, currentUsername, currentUserPhoto, content);
      await loadComments();
    } catch (err) {
      console.error('Error adding comment:', err);
      throw err;
    }
  }

  async function handleEditComment(commentId: string, newContent: string) {
    try {
      await updateComment(projectId, commentId, newContent);
      await loadComments();
    } catch (err) {
      console.error('Error editing comment:', err);
      throw err;
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!currentUserId) return;

    try {
      await deleteComment(projectId, commentId, currentUserId);
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
