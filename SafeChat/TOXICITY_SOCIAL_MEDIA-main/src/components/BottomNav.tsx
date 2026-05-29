import { Link, useLocation } from 'react-router-dom';
import { Home, Search, PlusSquare, Heart, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const username = user?.username || 'guest';

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: PlusSquare, label: 'Create', path: '/create' },
    { icon: Heart, label: 'Notifications', path: '/notifications' },
    { icon: User, label: 'Profile', path: user ? `/profile/${username}` : '/auth/login' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full h-14 bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center px-4 z-50 md:hidden">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "p-2 transition-transform duration-150 active:scale-90",
              isActive ? "text-primary scale-110" : "text-on-surface-variant"
            )}
          >
            <item.icon className="w-6 h-6" />
          </Link>
        );
      })}
    </nav>
  );
}
