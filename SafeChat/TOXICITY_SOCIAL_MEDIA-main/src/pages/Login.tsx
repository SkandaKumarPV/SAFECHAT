import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <header className="mb-10 text-center">
        <h1 className="text-5xl font-display tracking-tight font-black mb-2">Toxicity</h1>
        <p className="text-sm font-bold text-outline uppercase tracking-widest">Digital Integrity</p>
      </header>

      <section className="w-full space-y-4">
        <div className="space-y-2">
          <input 
            className="w-full bg-surface-container-low border border-outline-variant h-11 px-4 rounded-lg text-sm focus:ring-1 focus:ring-outline outline-none" 
            placeholder="Phone number, username, or email" 
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
          <input 
            className="w-full bg-surface-container-low border border-outline-variant h-11 px-4 rounded-lg text-sm focus:ring-1 focus:ring-outline outline-none" 
            placeholder="Password" 
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && (
            <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="text-[11px] text-on-surface-variant bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2">
            Demo account: <span className="font-bold">demo_user</span> / <span className="font-bold">demo1234</span>
          </div>
          <button 
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-primary-container text-white font-bold h-11 rounded-lg active:scale-95 transition-transform disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </div>

        <div className="flex items-center gap-4 py-4">
          <div className="flex-1 h-px bg-outline-variant"></div>
          <span className="text-xs font-bold text-outline uppercase">OR</span>
          <div className="flex-1 h-px bg-outline-variant"></div>
        </div>

        <div className="text-center">
          <button className="text-primary-container text-xs font-bold hover:underline">Forgot password?</button>
        </div>
      </section>

      <section className="mt-24 w-full flex flex-col items-center">
        <Link 
          to="/auth/signup"
          className="w-full max-w-[280px] h-11 border border-primary-container text-primary-container font-bold rounded-full flex items-center justify-center hover:bg-primary-container/5 transition-colors"
        >
          Sign up
        </Link>
      </section>
      
      <footer className="mt-12 text-center space-y-4">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {['About', 'Help', 'Press', 'API', 'Jobs', 'Privacy', 'Terms'].map(f => (
            <span key={f} className="text-[10px] text-outline font-bold uppercase hover:underline cursor-pointer">{f}</span>
          ))}
        </div>
        <p className="text-[10px] text-outline font-bold uppercase tracking-widest">© 2024 Toxicity from AI Studio</p>
      </footer>
    </div>
  );
}
