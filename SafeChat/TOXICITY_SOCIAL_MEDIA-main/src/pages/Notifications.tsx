import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import type { ApiNotification } from '../types';
import { avatarPlaceholder } from '../lib/placeholders';

export default function Notifications() {
  const { token } = useAuth();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) {
        setItems([]);
        return;
      }
      try {
        const data = (await api.myNotifications(token)) as ApiNotification[];
        if (!mounted) return;
        setItems(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load notifications');
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <div className="max-w-[500px] mx-auto pt-8 px-4 pb-20 md:pb-8">
      <h1 className="text-2xl font-display mb-8">Notifications</h1>

      <section className="mb-8">
        <h2 className="text-xs font-bold text-outline uppercase tracking-widest mb-4">This Week</h2>
        {error && (
          <div className="mb-3 text-sm text-error bg-error/10 border border-error/20 rounded-lg p-3">{error}</div>
        )}
        {items.length === 0 ? (
          <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 text-sm text-on-surface-variant">
            No notifications yet.
          </div>
        ) : (
          <div className="bg-surface-container-low border border-outline-variant rounded-xl">
            {items.map((n) => (
              <div key={n.id} className="px-4 py-3 border-b border-outline-variant last:border-b-0 flex items-center gap-3">
                <img
                  src={n.actor?.avatar_url || avatarPlaceholder(n.actor?.username || 'user')}
                  alt={n.actor?.username || 'user'}
                  className="w-10 h-10 rounded-full border border-outline-variant object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{n.text}</p>
                  <p className="text-[11px] text-on-surface-variant">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xs font-bold text-outline uppercase tracking-widest mb-4">Earlier</h2>
        <div className="flex items-center gap-3 py-2 opacity-60">
           <div className="w-11 h-11 bg-surface-container rounded-full flex items-center justify-center border border-outline-variant">
             <Lock className="w-4 h-4 text-outline" />
           </div>
           <div className="flex-1">
             <p className="text-sm italic">Privacy restricted history items are locked.</p>
           </div>
        </div>
      </section>
    </div>
  );
}
