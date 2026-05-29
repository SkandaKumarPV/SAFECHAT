import { ShieldAlert, ShieldCheck, TrendingUp, MessageCircleWarning } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Safety() {
  const { user } = useAuth();
  const username = user?.username || 'guest';
  const safetyScore = null;

  return (
    <div className="max-w-[760px] mx-auto pt-8 px-4 pb-12 space-y-6">
      <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-display font-bold">Safety Center</h1>
        </div>
        <p className="text-sm text-on-surface-variant max-w-2xl">
          Toxicity moderation runs on every comment and message before the content is shown. Harmful content is flagged in the backend so the frontend can blur it, warn the user, and keep the social feed public but controlled.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="font-bold">Account score</h2>
          </div>
          <div className="text-4xl font-black">{safetyScore ?? '—'}</div>
          <p className="text-xs text-outline mt-2 uppercase tracking-widest">{username}</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircleWarning className="w-5 h-5 text-orange-500" />
            <h2 className="font-bold">Moderation rule</h2>
          </div>
          <p className="text-sm text-on-surface-variant">Comments are visible globally, but toxic ones are blurred and clearly labeled.</p>
        </div>
        <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-error" />
            <h2 className="font-bold">Messaging rule</h2>
          </div>
          <p className="text-sm text-on-surface-variant">Direct messages are allowed only when both users follow each other.</p>
        </div>
      </section>

      <section className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6">
        <h2 className="font-bold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link to={`/profile/${username}`} className="px-4 py-2 rounded-lg bg-primary-container text-white font-bold text-sm">
            View profile
          </Link>
          <Link to="/notifications" className="px-4 py-2 rounded-lg bg-surface-container-high font-bold text-sm">
            Open notifications
          </Link>
          <Link to="/" className="px-4 py-2 rounded-lg bg-surface-container-high font-bold text-sm">
            Back to feed
          </Link>
        </div>
      </section>
    </div>
  );
}