import { useEffect, useState } from 'react';
import { ShieldCheck, MessageCircle, UserPlus, Search } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { ApiFollow, User } from '../types';
import { useNavigate } from 'react-router-dom';
import { avatarPlaceholder } from '../lib/placeholders';

export default function Messages() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!token) {
          setUsers([]);
          return;
        }
        const data = (await api.myFollowing(token)) as ApiFollow[];
        if (!mounted) {
          return;
        }
        setUsers(data.map((f) => mapUser(f.following)).filter((u) => u.username !== user?.username));
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load users');
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token, user?.username]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface-container-lowest">
      {/* List */}
      <aside className="w-full md:w-[350px] lg:w-[400px] flex flex-col border-r border-outline-variant h-full">
        <header className="flex items-center justify-between px-6 h-16 shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg">{user?.username || 'account'}</h1>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <button onClick={() => navigate('/explore')} title="Find new people">
            <UserPlus className="w-5 h-5 text-on-surface cursor-pointer" />
          </button>
        </header>

        <div className="px-6 py-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-outline w-4 h-4" />
            <input 
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg py-2 pl-10 text-sm focus:outline-none" 
              placeholder="Search conversations" 
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {error && (
            <div className="mx-6 mb-3 text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          {users.filter((userItem) => userItem.username.toLowerCase().includes(query.toLowerCase()) || userItem.fullName.toLowerCase().includes(query.toLowerCase())).map((userItem) => (
            <button
              type="button"
              key={userItem.id}
              onClick={() => navigate(`/messages/${userItem.id}`)}
              className="w-full text-left flex items-center px-6 py-3 hover:bg-surface-container transition-colors group"
            >
              <div className="relative">
                <div className="w-14 h-14 rounded-full p-[2px] brand-gradient">
                  <div className="w-full h-full rounded-full border-2 border-white overflow-hidden">
                    <img src={userItem.avatar} alt={userItem.username} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="ml-4 flex-1 overflow-hidden">
                <div className="font-bold text-sm text-on-surface truncate">{userItem.username}</div>
                <div className="text-xs text-on-surface-variant truncate">Active now</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Empty State */}
      <section className="hidden md:flex flex-1 flex-col items-center justify-center p-10 text-center">
        <div className="w-24 h-24 rounded-full border-2 border-on-surface flex items-center justify-center mb-6">
          <MessageCircle className="w-12 h-12 stroke-[1px]" />
        </div>
        <h2 className="text-2xl font-display mb-2">Your Messages</h2>
        <p className="text-on-surface-variant max-w-[280px] mb-8 text-sm">
          Send private photos and messages to a friend or group.
        </p>
        <button className="bg-primary-container text-white px-6 py-2.5 rounded-lg font-bold hover:opacity-90">
          Send message
        </button>
      </section>
    </div>
  );
}

function mapUser(user: ApiFollow['following']): User {
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
