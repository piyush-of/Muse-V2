'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { registerUser } from '@/actions/auth';
import LivingBackground from '@/components/ui/LivingBackground';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);

    try {
      const res = await registerUser(null, formData);

      if (!res.success) {
        setError(res.error || 'Registration failed');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 1500);
      }
    } catch (err: any) {
      setError('An unexpected error occurred');
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
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Join MUSE for context-aware daily outfit compilation</CardDescription>
        </CardHeader>

        {error && (
          <div className="mb-6 p-4 bg-destructive/5 border border-destructive/10 text-destructive text-xs rounded-xl flex items-start gap-2.5">
            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5">
            <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-semibold">Registration successful!</p>
              <p className="text-[10px] mt-0.5">Redirecting to login platform...</p>
            </div>
          </div>
        )}

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-background/40 border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent text-xs font-sans transition-colors"
                />
              </div>
            </div>

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
              <span>{loading ? 'Registering...' : 'Create Account'}</span>
              {!loading && <ArrowRight size={14} />}
            </Button>
          </form>
        </CardContent>

        <div className="mt-8 pt-6 border-t border-border/40 text-center">
          <Link
            href="/auth/login"
            className="text-xs text-muted-foreground hover:text-accent font-semibold transition-colors"
          >
            Already registered? Log in
          </Link>
        </div>
      </Card>
    </div>
  );
}
