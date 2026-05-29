import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function SignUp() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      await register({ username: username.trim(), email: email.trim(), password });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <header className="mb-8 text-center text-on-surface">
        <h1 className="text-5xl font-display tracking-tight font-black mb-2">Toxicity</h1>
        <p className="text-sm font-bold text-on-surface-variant text-center px-4">
          Sign up to see photos and videos from your verified community.
        </p>
      </header>

      <section className="w-full space-y-4">
        <div className="space-y-2">
          <input 
            className="w-full bg-surface-container-low border border-outline-variant h-11 px-4 rounded-lg text-sm focus:ring-1 focus:ring-outline outline-none" 
            placeholder="Username" 
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <input 
            className="w-full bg-surface-container-low border border-outline-variant h-11 px-4 rounded-lg text-sm focus:ring-1 focus:ring-outline outline-none" 
            placeholder="Email" 
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input 
            className="w-full bg-surface-container-low border border-outline-variant h-11 px-4 rounded-lg text-sm focus:ring-1 focus:ring-outline outline-none" 
            placeholder="Password" 
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          
          <p className="text-[10px] text-on-surface-variant text-center px-2 py-4">
            By signing up, you agree to our <span className="font-bold">Terms</span>, <span className="font-bold">Privacy Policy</span> and <span className="font-bold">Cookies Policy</span>.
          </p>

          {error && (
            <div className="text-xs text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button 
            onClick={handleSignup}
            disabled={loading}
            className="w-full bg-primary-container text-white font-bold h-11 rounded-lg active:scale-95 transition-transform disabled:opacity-60"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </div>
      </section>

      <section className="mt-12 w-full flex flex-col items-center pt-8 border-t border-outline-variant">
        <p className="text-sm">
          Have an account? <Link to="/auth/login" className="text-primary-container font-bold hover:underline">Log in</Link>
        </p>
      </section>
    </div>
  );
}
