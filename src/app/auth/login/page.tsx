'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import LivingBackground from '@/components/ui/LivingBackground';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError('An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="film-grain min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <LivingBackground isDark={false} />

      <Card className="w-full max-w-md relative z-10 p-8 md:p-10 shadow-editorial bg-card/60 backdrop-blur-md border border-border/80">
        <CardHeader className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/5 border border-accent/10 text-accent mb-4">
            <Sparkles size={20} />
          </div>
          <CardTitle>MUSE</CardTitle>
          <CardDescription>AI-Powered Personal Fashion Intelligence</CardDescription>
        </CardHeader>

        {error && (
          <div className="mb-6 p-4 bg-destructive/5 border border-destructive/10 text-destructive text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-3 bg-background/40 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent text-xs font-sans transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-background/40 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent text-xs font-sans transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full py-3.5 mt-4 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Authenticating...' : 'Enter Platform'}</span>
              {!loading && <ArrowRight size={14} />}
            </Button>
          </form>
        </CardContent>

        <div className="mt-8 pt-6 border-t border-border/40 text-center">
          <Link
            href="/auth/signup"
            className="text-xs text-muted-foreground hover:text-accent font-semibold transition-colors"
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
}
