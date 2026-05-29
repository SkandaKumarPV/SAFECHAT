import { Heart, MessageCircle, Send, Bookmark, ShieldAlert, Trash2, Check } from 'lucide-react';
import { ApiComment, ApiFollow, Post, Comment } from '../types';
import { cn } from '../lib/utils';
import { useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: Post;
  key?: string | number;
  initialBookmarked?: boolean;
  initialLiked?: boolean;
  onSavedChange?: (postId: string, saved: boolean) => void;
}

export default function PostCard({ post, initialBookmarked = false, initialLiked = false, onSavedChange }: PostCardProps) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState(post.comments);
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const commentsSectionRef = useRef<HTMLDivElement | null>(null);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const [showSharePicker, setShowSharePicker] = useState(false);
  const [followingUsers, setFollowingUsers] = useState<ApiFollow['following'][]>([]);
  const [selectedReceivers, setSelectedReceivers] = useState<Set<number>>(new Set());
  const [isSharing, setIsSharing] = useState(false);

  const handleSubmit = async () => {
    if (!commentText.trim()) {
      return;
    }
    if (!token) {
      setCommentError('Please log in to comment.');
      return;
    }
    if (isSubmittingComment) {
      return;
    }
    try {
      setIsSubmittingComment(true);
      setCommentError(null);
      const created = (await api.createComment(Number(post.id), commentText.trim(), token)) as ApiComment;
      setLocalComments((prev) => [
        ...prev,
        {
          id: String(created.id),
          authorId: String(created.author?.id || user?.id || ''),
          username: created.author?.username || post.user.username || 'user',
          text: created.content,
          createdAt: new Date(created.created_at).toLocaleDateString(),
          isToxic: created.is_toxic,
          toxicityScore: created.toxicity_score || undefined,
          toxicityLabel: created.toxicity_label || undefined,
        },
      ]);
      setCommentText('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) {
      setCommentError('Please log in to manage comments.');
      return;
    }
    try {
      setDeletingCommentId(commentId);
      setCommentError(null);
      await api.deleteComment(Number(commentId), token);
      setLocalComments((prev) => prev.filter((comment) => comment.id !== commentId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment';
      if (message === 'Not Found') {
        setCommentError('Delete endpoint unavailable. Please restart backend server and try again.');
      } else {
        setCommentError(message);
      }
    } finally {
      setDeletingCommentId(null);
    }
  };

  const openComments = () => {
    commentsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    commentInputRef.current?.focus();
  };

  const toggleSave = async () => {
    if (!token) {
      setCommentError('Please log in to save posts.');
      return;
    }
    const next = !bookmarked;
    setBookmarked(next);
    try {
      if (next) {
        await api.savePost(Number(post.id), token);
      } else {
        await api.unsavePost(Number(post.id), token);
      }
      onSavedChange?.(post.id, next);
    } catch (err) {
      setBookmarked(!next);
      setCommentError(err instanceof Error ? err.message : 'Failed to update saved posts');
    }
  };

  const toggleLike = async () => {
    if (!token) {
      setCommentError('Please log in to like posts.');
      return;
    }
    const next = !liked;
    setLiked(next);
    setLikesCount((prev) => Math.max(0, prev + (next ? 1 : -1)));
    try {
      const result = next ? await api.likePost(Number(post.id), token) : await api.unlikePost(Number(post.id), token);
      setLiked(result.liked);
      setLikesCount(result.likes_count);
    } catch (err) {
      setLiked(!next);
      setLikesCount((prev) => Math.max(0, prev + (next ? -1 : 1)));
      setCommentError(err instanceof Error ? err.message : 'Failed to update like');
    }
  };

  const openSharePicker = async () => {
    if (!token) {
      setCommentError('Please log in to share posts.');
      return;
    }
    try {
      const rows = (await api.myFollowing(token)) as ApiFollow[];
      setFollowingUsers(rows.map((r) => r.following));
      setSelectedReceivers(new Set());
      setShowSharePicker(true);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to load following users');
    }
  };

  const submitShare = async () => {
    if (!token || selectedReceivers.size === 0) return;
    setIsSharing(true);
    try {
      const text = `Shared a post by @${postUsername}: "${post.caption}"`;
      await Promise.all(
        Array.from(selectedReceivers).map((receiverId) =>
          api.sendMessage({ receiver_id: receiverId, content: text }, token),
        ),
      );
      setShowSharePicker(false);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Failed to share post');
    } finally {
      setIsSharing(false);
    }
  };

  const isOwnPost = Boolean(user && post.user.id && String(post.user.id) === String(user.id));
  const postUsername = isOwnPost ? user!.username : post.user.username;
  const postAvatar = isOwnPost ? (user!.avatar_url || post.user.avatar) : post.user.avatar;

  return (
    <article className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <button
          type="button"
          className="flex items-center gap-3 text-left"
          onClick={() => navigate(`/profile/${postUsername}`)}
          title="Open profile"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant">
            <img src={postAvatar} alt={postUsername} className="w-full h-full object-cover" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold">{postUsername}</span>
            <span className="text-xs text-outline">• {post.createdAt}</span>
          </div>
        </button>
      </div>

      {/* Image */}
      <div className="aspect-square bg-surface-container">
        <img src={post.image} alt="Post content" className="w-full h-full object-cover" />
      </div>

      {/* Actions */}
      <div className="p-3">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-4">
            <button onClick={() => void toggleLike()} className={cn("hover:text-outline transition-colors", liked && "text-error")}>
              <Heart className={cn("w-6 h-6", liked && "fill-error")} />
            </button>
            <button onClick={openComments} className="hover:text-outline transition-colors" title="View comments">
              <MessageCircle className="w-6 h-6" />
            </button>
            <button onClick={() => void openSharePicker()} className="hover:text-outline transition-colors" title="Share to following">
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button onClick={() => void toggleSave()} className={cn(bookmarked && "text-primary")} title={bookmarked ? 'Saved' : 'Save'}>
            <Bookmark className={cn("w-6 h-6", bookmarked && "fill-primary")} />
          </button>
        </div>

        <div className="text-sm font-bold mb-1">{likesCount.toLocaleString()} likes</div>
        <div className="text-xs text-on-surface-variant mb-2">
          {likesCount.toLocaleString()} likes • {localComments.length.toLocaleString()} comments
        </div>
        <div className="text-sm">
          <span className="font-bold mr-2">{postUsername}</span>
          {post.caption}
        </div>

        {/* Comments */}
        <div ref={commentsSectionRef} className="mt-4 border-t border-surface-container pt-3 space-y-4">
          {localComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              canDelete={
                Boolean(
                  user &&
                    (comment.authorId === String(user.id) || String(post.user.id || '') === String(user.id)),
                )
              }
              deleting={deletingCommentId === comment.id}
              onDelete={() => {
                void handleDeleteComment(comment.id);
              }}
            />
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {commentError && (
            <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {commentError}
            </div>
          )}
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit();
            }}
          >
            <input
              ref={commentInputRef}
              className="flex-1 bg-surface-container-low border border-outline-variant rounded-full px-4 py-2 text-sm focus:outline-none"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
            />
            <button
              type="submit"
              disabled={isSubmittingComment || !commentText.trim()}
              className="text-primary font-bold text-sm px-3 py-2"
            >
              {isSubmittingComment ? 'Posting...' : 'Post'}
            </button>
          </form>
        </div>
      </div>
      {showSharePicker && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center p-3" onClick={() => setShowSharePicker(false)}>
          <div
            className="w-full max-w-[520px] bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 max-h-[60vh] mb-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-3" />
            <div className="max-w-[430px] mx-auto">
              <div className="text-xs font-bold mb-3 uppercase tracking-wider text-on-surface-variant">Share with following</div>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {followingUsers.length === 0 ? (
                <div className="text-xs text-on-surface-variant">You are not following anyone yet.</div>
              ) : (
                followingUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setSelectedReceivers((prev) => {
                        const next = new Set(prev);
                        if (next.has(u.id)) next.delete(u.id);
                        else next.add(u.id);
                        return next;
                      });
                    }}
                    className="w-full flex items-center gap-3 text-left text-sm py-1.5 rounded-lg hover:bg-surface-container transition-colors"
                    title={`Share to ${u.username}`}
                  >
                    <div className="relative w-9 h-9 rounded-full overflow-hidden border border-outline-variant shrink-0">
                      <img
                        src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.username}`}
                        alt={u.username}
                        className="w-full h-full object-cover"
                      />
                      {selectedReceivers.has(u.id) && (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="font-semibold">{u.username}</span>
                  </button>
                ))
              )}
            </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowSharePicker(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => void submitShare()}
                  disabled={isSharing || selectedReceivers.size === 0}
                  className="ml-auto px-6 py-2 rounded-lg bg-primary-container text-white text-sm font-semibold disabled:opacity-60"
                >
                  {isSharing ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function CommentItem({
  comment,
  canDelete,
  deleting,
  onDelete,
}: {
  comment: Comment;
  canDelete: boolean;
  deleting: boolean;
  onDelete: () => void;
  key?: string | number;
}) {
  const [revealed, setRevealed] = useState(!comment.isToxic);
  const { user } = useAuth();
  const isOwnComment = Boolean(user && comment.authorId && String(comment.authorId) === String(user.id));
  const displayUsername = isOwnComment ? user!.username : comment.username;

  return (
    <div className="relative group py-1">
      <div className={cn("transition-all duration-300", comment.isToxic && !revealed && "opacity-40")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="font-bold text-sm">{displayUsername}</span>
            <span className={cn("text-sm ml-2 transition-all duration-500", comment.isToxic && !revealed && "blur-md select-none")}>
              {comment.text}
            </span>
          </div>
          {canDelete && (
            <button
              onClick={onDelete}
              disabled={deleting}
              className="text-error hover:opacity-80 disabled:opacity-50 shrink-0"
              title="Delete comment"
              aria-label="Delete comment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {comment.isToxic && !revealed && (
        <div className="absolute inset-0 bg-surface-container-low/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 rounded border border-outline-variant z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-error/90 text-on-error text-[10px] font-bold rounded-full">
              <ShieldAlert className="w-3 h-3" />
              Flagged Content
            </div>
            <span className="text-[10px] font-medium text-error">
              {comment.toxicityLabel} • {(comment.toxicityScore! * 100).toFixed(0)}%
            </span>
          </div>
          <button 
            onClick={() => setRevealed(true)}
            className="px-4 py-1 border border-outline-variant bg-surface-container-high rounded-full text-[10px] font-bold hover:bg-surface-container transition-colors shadow-sm"
          >
            Reveal comment
          </button>
        </div>
      )}

      {comment.isToxic && revealed && (
        <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-error uppercase tracking-wider">
          <ShieldAlert className="w-3 h-3" />
          Moderated Content
        </div>
      )}
    </div>
  );
}
