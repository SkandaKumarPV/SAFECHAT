import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Grid, Bookmark, Settings, Shield, MoreHorizontal, Heart, MessageCircle, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { ApiPost, ApiUserProfile, Post, User } from '../types';
import { avatarPlaceholder, postPlaceholder } from '../lib/placeholders';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';

export default function Profile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: authUser, token, refreshMe } = useAuth();
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostCaption, setEditPostCaption] = useState('');
  const [postMenuId, setPostMenuId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!selectedPost) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPost(null);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [selectedPost]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const userData = await api.getUserByUsername(username || '');
        const profileData = (await api.getUserProfile(userData.id, token)) as ApiUserProfile;
        const postsData = (await api.listPosts()) as ApiPost[];
        if (!mounted) {
          return;
        }
        setProfile(profileData);
        setPosts(postsData.filter((p) => p.author.id === userData.id).map(mapPost));
        setEditFullName(profileData.user.full_name || profileData.user.username);
        setEditBio(profileData.user.bio || '');
        setEditAvatar(profileData.user.avatar_url || '');
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    if (username) {
      load();
    }
    return () => {
      mounted = false;
    };
  }, [username, token]);

  const currentUser = profile ? mapUser(profile.user, profile.stats) : null;
  const isSelf = Boolean(authUser && profile && authUser.id === profile.user.id);
  const followState = profile?.stats.is_following;

  useEffect(() => {
    let mounted = true;
    const loadSaved = async () => {
      if (!token || !isSelf || activeTab !== 'saved') return;
      try {
        const data = (await api.listSavedPosts(token)) as ApiPost[];
        if (!mounted) return;
        setSavedPosts(data.map(mapPost));
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load saved posts');
      }
    };
    loadSaved();
    return () => {
      mounted = false;
    };
  }, [activeTab, isSelf, token]);

  const toggleFollow = async () => {
    if (!profile || !token || isUpdatingFollow) {
      return;
    }
    setIsUpdatingFollow(true);
    try {
      if (followState) {
        await api.unfollowUser(profile.user.id, token);
      } else {
        await api.followUser(profile.user.id, token);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update follow state';
      // If relationship is already gone, treat as successful unfollow.
      if (!(followState && message === 'Follow relationship not found')) {
        setError(message);
      }
    } finally {
      try {
        const refreshed = (await api.getUserProfile(profile.user.id, token)) as ApiUserProfile;
        setProfile(refreshed);
      } catch (refreshErr) {
        setError(refreshErr instanceof Error ? refreshErr.message : 'Failed to refresh profile');
      }
      setIsUpdatingFollow(false);
    }
  };

  const saveProfile = async () => {
    if (!token) {
      return;
    }
    try {
      const updated = await api.updateMe(
        {
          full_name: editFullName.trim() || null,
          bio: editBio.trim() || null,
          avatar_url: editAvatar.trim() || null,
        },
        token,
      );
      await refreshMe();
      if (profile) {
        setProfile({
          ...profile,
          user: {
            ...profile.user,
            full_name: updated.full_name,
            bio: updated.bio,
            avatar_url: updated.avatar_url,
          },
        });
      }
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const openEditPost = (post: Post) => {
    setEditingPostId(post.id);
    setEditPostCaption(post.caption);
  };

  const savePostEdit = async () => {
    if (!token || !editingPostId) return;
    try {
      const updated = (await api.updatePost(Number(editingPostId), { content: editPostCaption.trim() }, token)) as ApiPost;
      setPosts((prev) =>
        prev.map((p) => (p.id === editingPostId ? mapPost(updated) : p)),
      );
      setEditingPostId(null);
      setEditPostCaption('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update post');
    }
  };

  const deletePost = async (postId: string) => {
    if (!token) return;
    try {
      await api.deletePost(Number(postId), token);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-[600px] mx-auto pt-8 px-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 text-sm text-on-surface-variant">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-[600px] mx-auto pt-8 px-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 text-sm text-on-surface-variant">
          Profile not available.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto pt-8 px-4">
      {/* Header */}
      <section className="mb-10">
        {error && (
          <div className="mb-4 text-sm text-error bg-error/10 border border-error/20 rounded-lg p-3">
            {error}
          </div>
        )}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12 mb-8 text-center md:text-left">
          <div className="relative">
            <div className="w-32 h-32 rounded-full p-1 border-2 border-primary-container overflow-hidden">
              <img src={currentUser.avatar} alt={currentUser.username} className="w-full h-full object-cover rounded-full" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h1 className="text-2xl font-display">{currentUser.username}</h1>
              <div className="flex gap-2">
                {isSelf ? (
                  <>
                    <button onClick={() => setIsEditing((value) => !value)} className="bg-surface-container-high rounded-lg px-4 py-1.5 text-sm font-bold">
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                    <button onClick={() => navigate('/settings')} className="bg-surface-container-high rounded-lg p-1.5" title="Account settings">
                      <Settings className="w-5 h-5" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={toggleFollow}
                    disabled={isUpdatingFollow}
                    className="bg-primary-container text-white rounded-lg px-4 py-1.5 text-sm font-bold"
                  >
                    {isUpdatingFollow ? 'Updating...' : followState ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2 justify-center md:justify-start">
              <span><b>{currentUser.stats.posts}</b> posts</span>
              <span><b>{currentUser.stats.followers}</b> followers</span>
              <span><b>{currentUser.stats.following}</b> following</span>
            </div>

            <div>
              <p className="font-bold">{currentUser.fullName}</p>
              <p className="text-sm whitespace-pre-line">{currentUser.bio}</p>
            </div>

            {isSelf && isEditing && (
              <div className="grid gap-3 pt-2">
                <input value={editFullName} onChange={(event) => setEditFullName(event.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm" placeholder="Full name" />
                <input value={editAvatar} onChange={(event) => setEditAvatar(event.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm" placeholder="Avatar URL" />
                <textarea value={editBio} onChange={(event) => setEditBio(event.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm min-h-24" placeholder="Bio" />
                <button onClick={saveProfile} className="self-start px-4 py-2 rounded-lg bg-primary-container text-white font-bold text-sm">
                  Save changes
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Safety Score Section */}
      <section className="mb-10">
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Account Safety Score</h3>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-700 rounded-full uppercase tracking-wider">
              Good Standing
            </span>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <div className="text-3xl font-black">{currentUser.safetyStats.commentsFlagged}</div>
              <div className="text-xs text-outline uppercase font-bold tracking-widest mt-1">Comments Flagged</div>
            </div>
            <div>
              <div className="text-3xl font-black">{currentUser.safetyStats.messagesFlagged}</div>
              <div className="text-xs text-outline uppercase font-bold tracking-widest mt-1">Messages Flagged</div>
            </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-end gap-2 h-16">
               <div className="flex-1 flex flex-col items-center gap-1 h-full">
                 <div className="w-full bg-green-400 rounded-sm h-[90%] opacity-90 shadow-sm" />
                 <span className="text-[8px] font-black text-outline">SAFE</span>
               </div>
               <div className="flex-1 flex flex-col items-center gap-1 h-full">
                 <div className="w-full bg-yellow-400 rounded-sm h-[40%] opacity-90" />
                 <span className="text-[8px] font-black text-outline">LOW</span>
               </div>
               <div className="flex-1 flex flex-col items-center gap-1 h-full">
                 <div className="w-full bg-orange-400 rounded-sm h-[20%] opacity-90" />
                 <span className="text-[8px] font-black text-outline">MOD</span>
               </div>
               <div className="flex-1 flex flex-col items-center gap-1 h-full">
                 <div className="w-full bg-red-400 rounded-sm h-[10%] opacity-90" />
                 <span className="text-[8px] font-black text-outline">HIGH</span>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex border-t border-outline-variant">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 flex items-center justify-center gap-2 h-12 ${activeTab === 'posts' ? 'border-t-2 border-on-surface' : 'text-outline'}`}
        >
          <Grid className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Posts</span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 flex items-center justify-center gap-2 h-12 ${activeTab === 'saved' ? 'border-t-2 border-on-surface' : 'text-outline'}`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest hidden md:inline">Saved</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-1 md:gap-4 mt-4">
        {(activeTab === 'posts' ? posts : savedPosts).map((post, i) => (
          <div key={i} className="aspect-square bg-surface-container overflow-hidden relative group">
            <button
              type="button"
              className="absolute inset-0"
              title="Open post"
              onClick={() => setSelectedPost(post)}
            >
              <img
                src={post.image}
                alt={`Post ${i}`}
                className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
              />
            </button>

            {/* Explore-style overlay (likes + comments) */}
            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 pointer-events-none">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Heart className="w-5 h-5 fill-white" />
                <span>{(post.likes || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <MessageCircle className="w-5 h-5" />
                <span>{(post.comments?.length || 0).toLocaleString()}</span>
              </div>
            </div>

            {isSelf && activeTab === 'posts' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPostMenuId((prev) => (prev === post.id ? null : post.id));
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/85 border border-outline-variant flex items-center justify-center"
                  title="Post options"
                >
                  <MoreHorizontal className="w-4 h-4 text-on-surface" />
                </button>
                {postMenuId === post.id && (
                  <div className="absolute top-11 right-2 z-10 bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-lg">
                    <button
                      onClick={() => {
                        setPostMenuId(null);
                        openEditPost(post);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-surface-container"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setPostMenuId(null);
                        void deletePost(post.id);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-container"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-[600px] max-h-[90vh] overflow-y-auto hide-scrollbar rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-surface-container-lowest/95 backdrop-blur border border-outline-variant border-b-0 rounded-t-2xl">
              <div className="h-12 px-2 flex items-center">
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
            <PostCard post={selectedPost} />
          </div>
        </div>
      )}
      {editingPostId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
            <h3 className="font-bold mb-2">Edit post</h3>
            <textarea
              value={editPostCaption}
              onChange={(e) => setEditPostCaption(e.target.value)}
              className="w-full min-h-24 bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2 justify-end">
              <button onClick={() => setEditingPostId(null)} className="px-3 py-1.5 rounded-lg bg-surface-container-high text-sm font-semibold">
                Cancel
              </button>
              <button onClick={() => void savePostEdit()} className="px-3 py-1.5 rounded-lg bg-primary-container text-white text-sm font-semibold">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function mapUser(profileUser: ApiUserProfile['user'], stats: ApiUserProfile['stats']): User {
  return {
    id: String(profileUser.id),
    username: profileUser.username,
    fullName: profileUser.full_name || profileUser.username,
    avatar: profileUser.avatar_url || avatarPlaceholder(profileUser.username),
    bio: profileUser.bio || '',
    safetyScore: 92,
    stats: {
      posts: stats.posts,
      followers: stats.followers,
      following: stats.following,
    },
    safetyStats: {
      commentsFlagged: stats.comments_flagged,
      messagesFlagged: stats.messages_flagged,
    },
  };
}

function mapPost(post: ApiPost): Post {
  return {
    id: String(post.id),
    user: { username: post.author.username, avatar: post.author.avatar_url || '' },
    image: post.image_url || postPlaceholder(String(post.id)),
    caption: post.content,
    likes: post.likes_count || 0,
    createdAt: new Date(post.created_at).toLocaleDateString(),
    comments: (post.comments || []).map((c) => ({
      id: String(c.id),
      authorId: String(c.author?.id ?? ''),
      username: c.author?.username || 'user',
      text: c.content,
      createdAt: new Date(c.created_at).toLocaleDateString(),
      isToxic: c.is_toxic,
      toxicityScore: c.toxicity_score ?? undefined,
      toxicityLabel: c.toxicity_label ?? undefined,
    })),
  };
}
