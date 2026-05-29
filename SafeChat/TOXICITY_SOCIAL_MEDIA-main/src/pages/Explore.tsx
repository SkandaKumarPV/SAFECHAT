import { motion } from 'motion/react';
import { Heart, MessageCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { ApiFollow, ApiPost, ApiUser } from '../types';
import { avatarPlaceholder, postPlaceholder } from '../lib/placeholders';

export default function Explore() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = (await api.listUsers()) as ApiUser[];
        if (!mounted) return;
        setUsers(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load users');
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadPosts = async () => {
      try {
        const data = (await api.listPosts()) as ApiPost[];
        if (!mounted) return;
        setPosts(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load posts');
      }
    };
    loadPosts();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadFollowing = async () => {
      if (!token) {
        setFollowingIds(new Set());
        return;
      }
      try {
        const data = (await api.myFollowing(token)) as ApiFollow[];
        if (!mounted) return;
        setFollowingIds(new Set(data.map((f) => f.following.id)));
      } catch {
        // ignore follow list errors on explore
      }
    };
    loadFollowing();
    return () => {
      mounted = false;
    };
  }, [token]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return users.filter((u) => u.username.toLowerCase().includes(q));
  }, [query, users]);

  const toggleFollow = async (userId: number) => {
    if (!token) {
      setError('Please log in to follow users.');
      return;
    }
    const isFollowing = followingIds.has(userId);
    try {
      setError(null);
      if (isFollowing) {
        await api.unfollowUser(userId, token);
      } else {
        await api.followUser(userId, token);
      }
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (isFollowing) next.delete(userId);
        else next.add(userId);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update follow state');
    }
  };

  return (
    <div className="max-w-[935px] mx-auto pt-4 md:pt-8 px-0 md:px-4">
      <div className="px-4 mb-6">
        <input
          className="w-full bg-surface-container-high border border-outline-variant rounded-lg py-2.5 px-4 text-sm focus:ring-1 focus:ring-outline h-11"
          placeholder="Search users by username"
          type="text"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            if (next) setSearchParams({ q: next });
            else setSearchParams({});
          }}
        />
      </div>

      {error && (
        <div className="px-4 mb-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg p-3">
          {error}
        </div>
      )}

      {query.trim() ? (
        <div className="px-4">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-sm text-on-surface-variant">No users found.</div>
            ) : (
              filteredUsers.map((u) => {
                const isFollowing = followingIds.has(u.id);
                return (
                  <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b border-outline-variant last:border-b-0">
                    <button
                      type="button"
                      className="flex items-center gap-3 min-w-0"
                      onClick={() => navigate(`/profile/${u.username}`)}
                    >
                      <img
                        src={u.avatar_url || avatarPlaceholder(u.username)}
                        className="w-10 h-10 rounded-full border border-outline-variant object-cover"
                        alt={u.username}
                      />
                      <div className="min-w-0 text-left">
                        <div className="font-bold text-sm truncate">{u.username}</div>
                        <div className="text-xs text-on-surface-variant truncate">{u.full_name || ''}</div>
                      </div>
                    </button>
                    <button
                      onClick={() => void toggleFollow(u.id)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold ${isFollowing ? 'bg-surface-container-high' : 'bg-primary-container text-white'}`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-4">
          {posts.map((p, i) => (
            <motion.div
              key={p.id}
              whileHover={{ scale: 1.02 }}
              className="aspect-square relative overflow-hidden cursor-pointer group"
            >
              <img src={p.image_url || postPlaceholder(String(p.id))} alt={`Explore ${i}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-6 text-white font-bold">
                  <span className="flex items-center gap-1"><Heart className="w-5 h-5 fill-white" /> {(p.likes_count || 0).toLocaleString()}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="w-5 h-5 fill-white" /> {(p.comments?.length || 0).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
