import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Heart, User, ShieldCheck, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const username = user?.username || 'guest';
  const safetyScore = null;

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/explore' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: Mail, label: 'Messages', path: '/messages' },
    { icon: Heart, label: 'Notifications', path: '/notifications' },
    { icon: ShieldCheck, label: 'Safety', path: '/safety' },
    { icon: User, label: 'Profile', path: user ? `/profile/${username}` : '/auth/login' },
  ];

  return (
    <nav className="fixed left-0 top-0 h-full w-64 border-r border-outline-variant bg-surface-container-lowest hidden md:flex flex-col p-4 z-50">
      <div className="text-2xl font-bold tracking-tighter mb-8 px-4 font-display">
        Toxicity Social
      </div>
      
      <div className="flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95 group",
                isActive 
                  ? "bg-surface-container-high text-on-surface font-bold" 
                  : "text-on-surface-variant hover:bg-surface-container"
              )}
            >
              <item.icon className={cn("w-6 h-6", isActive && "text-primary")} />
              <span className="text-body-main">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {user && (
        <div className="mt-auto px-4">
          <div className="p-4 bg-surface-container rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-outline uppercase tracking-wider">Safety Score</span>
              <span className="text-xs font-bold text-green-600">{safetyScore ?? '—'}</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-1000" 
                style={{ width: `${safetyScore ?? 0}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
