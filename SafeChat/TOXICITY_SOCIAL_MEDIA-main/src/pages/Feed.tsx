import { useEffect, useState } from 'react';
import PostCard from '../components/PostCard';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import type { ApiFollow, ApiPost, Comment, Post, User } from '../types';
import { useNavigate } from 'react-router-dom';
import { avatarPlaceholder, postPlaceholder } from '../lib/placeholders';
import { useAuth } from '../contexts/AuthContext';

export default function Feed() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stories, setStories] = useState<{ username: string; avatar?: string | null }[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const PAGE_SIZE = 15;

  useEffect(() => {
    let mounted = true;
    const loadStories = async () => {
      if (!token) {
        setStories([]);
        return;
      }
      try {
        const data = (await api.myFollowing(token)) as ApiFollow[];
        if (!mounted) return;
        const items = data.map((f) => ({
          username: f.following.username,
          avatar: f.following.avatar_url || null,
        }));
        setStories(items);
      } catch {
        // keep stories empty if follows can't load
      }
    };

    const loadInitial = async () => {
      try {
        setError(null);
        const data = (await api.listPostsPaged({ skip: 0, limit: PAGE_SIZE })) as ApiPost[];
        if (!mounted) {
          return;
        }
        setPosts(data.map(mapPost));
        setSkip(data.length);
        setHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load feed');
        }
      }
    };
    const loadSaved = async () => {
      if (!token) {
        setSavedIds(new Set());
        return;
      }
      try {
        const data = (await api.listSavedPosts(token)) as ApiPost[];
        if (!mounted) return;
        setSavedIds(new Set(data.map((p) => String(p.id))));
      } catch {
        // ignore
      }
    };
    const loadLiked = async () => {
      if (!token) {
        setLikedIds(new Set());
        return;
      }
      try {
        const res = await api.myLikedPosts(token) as { post_ids: number[] };
        if (!mounted) return;
        setLikedIds(new Set(res.post_ids.map((id) => String(id))));
      } catch {
        // ignore
      }
    };
    loadStories();
    loadInitial();
    loadSaved();
    loadLiked();
    return () => {
      mounted = false;
    };
  }, [token]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const data = (await api.listPostsPaged({ skip, limit: PAGE_SIZE })) as ApiPost[];
      setPosts((prev) => [...prev, ...data.map(mapPost)]);
      setSkip((prev) => prev + data.length);
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex justify-center pt-4 md:pt-8">
      <div className="w-full max-w-[470px] px-4">
        {/* Stories */}
        {stories.length > 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex gap-4 overflow-x-auto hide-scrollbar mb-6">
            {stories.map((story) => (
            <motion.div 
              key={story.username}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex flex-col items-center gap-1 min-w-[74px] cursor-pointer"
              onClick={() => navigate(`/profile/${story.username}`)}
            >
              <div className="w-16 h-16 rounded-full brand-gradient p-[2px]">
                <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                  <img src={story.avatar || avatarPlaceholder(story.username)} alt={story.username} className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="text-[12px] truncate w-full text-center">{story.username}</span>
            </motion.div>
            ))}
          </div>
        )}

        {/* Feed */}
        {error && (
          <div className="mb-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg p-3">
            {error}
          </div>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            initialBookmarked={savedIds.has(post.id)}
            initialLiked={likedIds.has(post.id)}
            onSavedChange={(postId, saved) => {
              setSavedIds((prev) => {
                const next = new Set(prev);
                if (saved) next.add(postId);
                else next.delete(postId);
                return next;
              });
            }}
          />
        ))}

        {hasMore && (
          <div className="py-4 flex justify-center">
            <button
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="bg-surface-container-high border border-outline-variant rounded-lg px-4 py-2 text-sm font-bold hover:bg-surface-container disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function mapUser(user: ApiPost['author']): User {
  return {
    id: String(user.id),
    username: user.username,
    fullName: user.full_name || user.username,
    avatar: user.avatar_url || avatarPlaceholder(user.username),
    bio: user.bio || '',
    safetyScore: 92,
    stats: { posts: 0, followers: 0, following: 0 },
    safetyStats: { commentsFlagged: 0, messagesFlagged: 0 },
  };
}

function mapComment(comment: ApiPost['comments'][number]): Comment {
  return {
    id: String(comment.id),
    authorId: String(comment.author.id),
    username: comment.author.username,
    text: comment.content,
    createdAt: new Date(comment.created_at).toLocaleDateString(),
    isToxic: comment.is_toxic,
    toxicityScore: comment.toxicity_score || undefined,
    toxicityLabel: comment.toxicity_label || undefined,
  };
}

function mapPost(post: ApiPost): Post {
  const image = post.image_url || postPlaceholder(String(post.id));
  return {
    id: String(post.id),
    user: mapUser(post.author),
    image,
    caption: post.content,
    likes: post.likes_count || 0,
    createdAt: new Date(post.created_at).toLocaleDateString(),
    comments: post.comments.map(mapComment),
  };
}
