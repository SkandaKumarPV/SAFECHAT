import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

type ThemeMode = 'light' | 'dark';

function getInitialTheme(): ThemeMode {
  const stored = localStorage.getItem('theme_mode');
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return 'light';
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('theme_mode', theme);
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, token, logout, refreshMe } = useAuth();
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!token) {
        navigate('/auth/login');
        return;
      }
      try {
        const me = await api.me(token);
        if (!mounted) {
          return;
        }
        setFullName(me.full_name || '');
        setBio(me.bio || '');
        setAvatarUrl(me.avatar_url || '');
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load account settings');
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [navigate, token]);

  const saveProfile = async () => {
    if (!token) {
      return;
    }
    try {
      setError(null);
      setInfoMessage(null);
      await api.updateMe(
        {
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        },
        token,
      );
      await refreshMe();
      setInfoMessage('Personal info updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    }
  };

  const submitPasswordChange = async () => {
    if (!token) {
      return;
    }
    if (!currentPassword || !newPassword) {
      setError('Please fill current and new password.');
      return;
    }
    try {
      setError(null);
      setInfoMessage(null);
      const result = await api.changePassword(
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        token,
      );
      setCurrentPassword('');
      setNewPassword('');
      setInfoMessage(result.message || 'Password updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  };

  return (
    <div className="max-w-[680px] mx-auto px-4 pt-8 pb-10">
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Account Settings</h1>
          <div className="w-10 h-10 flex items-center justify-center">
            {user && <span className="text-sm text-on-surface-variant">@{user.username}</span>}
          </div>
        </div>

        {error && <div className="text-sm text-error bg-error/10 border border-error/20 rounded-lg p-3">{error}</div>}
        {infoMessage && <div className="text-sm text-green-700 bg-green-100 border border-green-200 rounded-lg p-3">{infoMessage}</div>}

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Personal Info</h2>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm" placeholder="Full name" />
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm" placeholder="Avatar URL" />
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm min-h-24" placeholder="Bio" />
          <button onClick={saveProfile} className="px-4 py-2 rounded-lg bg-primary-container text-white text-sm font-bold">
            Save personal info
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Change Password</h2>
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm" placeholder="Current password" />
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm" placeholder="New password" />
          <button onClick={submitPasswordChange} className="px-4 py-2 rounded-lg bg-surface-container-high text-sm font-bold">
            Change password
          </button>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Theme</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${theme === 'light' ? 'bg-primary-container text-white' : 'bg-surface-container-high'}`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${theme === 'dark' ? 'bg-primary-container text-white' : 'bg-surface-container-high'}`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
          </div>
        </section>

        <section className="pt-2">
          <button
            onClick={() => {
              logout();
              navigate('/auth/login');
            }}
            className="px-4 py-2 rounded-lg bg-error text-white text-sm font-bold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </section>
      </div>
    </div>
  );
}
