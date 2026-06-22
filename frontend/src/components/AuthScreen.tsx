import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';
    const endpoint = isLogin ? '/auth/login' : '/auth/signup';

    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAuth(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-4 relative overflow-hidden">
      {/* Editorial aesthetic background shapes */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-soft/30 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-soft/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-cardSurface border border-borderHairline p-8 md:p-10 shadow-lg rounded-xl z-10 transition-all">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent-soft text-accent mb-4">
            <Sparkles size={20} />
          </div>
          <h1 className="font-serif text-3xl tracking-wide text-ink-primary mb-2">MUSE</h1>
          <p className="text-ink-secondary text-sm font-sans tracking-tight">
            AI-Powered Personal Fashion Intelligence
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-sans">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-10 pr-4 py-3 bg-paper border border-borderHairline rounded-lg text-ink-primary placeholder-ink-tertiary focus:outline-none focus:border-accent text-sm font-sans transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-paper border border-borderHairline rounded-lg text-ink-primary placeholder-ink-tertiary focus:outline-none focus:border-accent text-sm font-sans transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-accent hover:bg-accent-text text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : isLogin ? 'Enter Platform' : 'Create Account'}</span>
            {!loading && <ArrowRight size={15} />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-borderHairline text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-xs text-ink-secondary hover:text-accent font-semibold transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already registered? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
