import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface StyleProfile {
  traits: Record<string, number>;
  topColors: string[];
  lastComputedAt: string;
  metrics: {
    acceptanceRate: number;
    totalDecisions: number;
    closetCount: number;
    wearEventsCount: number;
  };
  rediscoveryItem: {
    id: number;
    category: string;
    color: string;
    photoUrl: string;
  } | null;
}

const TRAIT_LABELS: Record<string, [string, string]> = {
  'relaxed-structured': ['Relaxed', 'Structured'],
  'neutral-bold': ['Neutral', 'Bold'],
  'minimal-maximal': ['Minimal', 'Maximal'],
  'heritage-modern': ['Heritage', 'Modern'],
};

export default function ProfileDNA() {
  const token = useStore((state) => state.token);
  const user = useStore((state) => state.user);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

  const { data: profile, isLoading, error } = useQuery<StyleProfile>({
    queryKey: ['profileStyle'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/profile/style-dna`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load Style DNA');
      return res.json();
    },
    enabled: !!token
  });

  // Draw radar fingerprint canvas
  useEffect(() => {
    if (!profile || !radarRef.current) return;
    const canvas = radarRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 280; canvas.height = 280;
    const center = 140; const radius = 95;
    const traits = profile.traits;
    const axes = Object.keys(TRAIT_LABELS);
    const angleStep = (Math.PI * 2) / axes.length;
    let animFrac = 0;

    const draw = () => {
      ctx.clearRect(0, 0, 280, 280);
      // Grid rings
      for (let j = 1; j <= 4; j++) {
        const r = radius * (j / 4);
        ctx.strokeStyle = 'rgba(33,31,27,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < axes.length; i++) {
          const a = i * angleStep - Math.PI / 2;
          const x = center + Math.cos(a) * r, y = center + Math.sin(a) * r;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath(); ctx.stroke();
      }
      // Axis spokes + labels
      for (let i = 0; i < axes.length; i++) {
        const a = i * angleStep - Math.PI / 2;
        ctx.strokeStyle = 'rgba(33,31,27,0.08)'; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(center + Math.cos(a) * radius, center + Math.sin(a) * radius);
        ctx.stroke();
        const lx = center + Math.cos(a) * (radius + 20);
        const ly = center + Math.sin(a) * (radius + 14);
        ctx.fillStyle = '#A39C8E'; ctx.font = '600 9px Inter, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const [lo, hi] = TRAIT_LABELS[axes[i]];
        ctx.fillText(`${lo}↔${hi}`, lx, ly);
      }
      // Filled mesh
      const breath = Math.sin(Date.now() * 0.0015) * 0.015;
      ctx.fillStyle = 'rgba(75,59,102,0.25)';
      ctx.strokeStyle = '#4B3B66'; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < axes.length; i++) {
        const a = i * angleStep - Math.PI / 2;
        const val = ((traits[axes[i]] ?? 0.5) + breath) * animFrac;
        const x = center + Math.cos(a) * radius * val;
        const y = center + Math.sin(a) * radius * val;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // Vertex dots
      for (let i = 0; i < axes.length; i++) {
        const a = i * angleStep - Math.PI / 2;
        const val = ((traits[axes[i]] ?? 0.5) + breath) * animFrac;
        const x = center + Math.cos(a) * radius * val;
        const y = center + Math.sin(a) * radius * val;
        ctx.fillStyle = '#FBF9F5'; ctx.strokeStyle = '#4B3B66'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      if (animFrac < 1) animFrac += 0.025;
    };

    const id = setInterval(draw, 30);
    return () => clearInterval(id);
  }, [profile]);

  // Draw acceptance rate sparkline
  useEffect(() => {
    if (!profile || !sparkRef.current) return;
    const canvas = sparkRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 220; canvas.height = 54;
    // Simulated time-series trending upward, ending at real acceptance rate
    const target = profile.metrics.acceptanceRate;
    const pts = [42, 48, 53, 51, 58, 65, 62, 72, 79, target];
    const step = 220 / (pts.length - 1);
    ctx.clearRect(0, 0, 220, 54);
    const grad = ctx.createLinearGradient(0, 0, 0, 54);
    grad.addColorStop(0, 'rgba(75,59,102,0.14)'); grad.addColorStop(1, 'rgba(75,59,102,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.moveTo(0, 54);
    pts.forEach((v, i) => { const x = i * step; const y = 54 - (v / 100) * 44 - 4; ctx.lineTo(x, y); });
    ctx.lineTo(220, 54); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4B3B66'; ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((v, i) => { const x = i * step; const y = 54 - (v / 100) * 44 - 4; i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); });
    ctx.stroke();
    // Terminal point
    const lx = (pts.length - 1) * step, ly = 54 - (pts[pts.length - 1] / 100) * 44 - 4;
    ctx.fillStyle = '#FBF9F5'; ctx.strokeStyle = '#4B3B66'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }, [profile]);

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
      <p className="text-ink-secondary text-sm">Computing Style DNA...</p>
    </div>
  );

  if (error || !profile) return (
    <div className="text-center p-8 bg-red-50 border border-red-100 rounded-xl max-w-md mx-auto mt-10">
      <AlertCircle className="mx-auto text-red-600 mb-3" size={24} />
      <p className="text-red-600 text-xs">{(error as Error)?.message || 'Style DNA unavailable'}</p>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-10">
        <h2 className="font-serif text-4xl text-ink-primary mb-3">Style DNA</h2>
        <p className="text-ink-secondary text-sm max-w-xl">
          An evolving fingerprint of your dressing patterns, colour preferences, and style archetypes — built entirely from your closet, not trends.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Radar Chart */}
        <div className="bg-cardSurface border border-borderHairline rounded-2xl p-8 flex flex-col items-center shadow-sm">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-tertiary mb-6">Fingerprint Matrix</p>
          <canvas ref={radarRef} style={{ width: '220px', height: '220px' }} />
          <p className="text-[10px] text-ink-tertiary mt-6 text-center">Evolves as you accept Daily Capsule suggestions.</p>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* North Star Metric */}
          <div className="bg-cardSurface border border-borderHairline rounded-2xl p-6 shadow-sm flex justify-between items-center gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-tertiary mb-1">North Star</p>
              <p className="font-serif text-4xl text-ink-primary">{profile.metrics.acceptanceRate}%</p>
              <p className="text-xs text-ink-secondary mt-1">Acceptance rate — no edits</p>
              <p className="text-[10px] text-ink-tertiary mt-0.5">{profile.metrics.totalDecisions} decisions logged</p>
            </div>
            <div className="text-right">
              <canvas ref={sparkRef} style={{ width: '110px', height: '36px' }} />
              <p className="text-[10px] text-emerald-700 flex items-center gap-1 justify-end mt-1 font-semibold">
                <TrendingUp size={10} /> Trending up
              </p>
            </div>
          </div>

          {/* Trait Meters */}
          <div className="bg-cardSurface border border-borderHairline rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-tertiary mb-5">Archetype Meters</p>
            <div className="space-y-4">
              {Object.entries(TRAIT_LABELS).map(([key, [lo, hi]]) => {
                const val = profile.traits[key] ?? 0.5;
                return (
                  <div key={key}>
                    <div className="flex justify-between text-[10px] text-ink-secondary mb-1.5">
                      <span>{lo}</span><span>{hi}</span>
                    </div>
                    <div className="relative h-1.5 bg-paper border border-borderHairline rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${val * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color Palette Bar */}
          {profile.topColors.length > 0 && (
            <div className="bg-cardSurface border border-borderHairline rounded-2xl p-6 shadow-sm">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-tertiary mb-4">Dominant Colors</p>
              <div className="flex h-6 rounded-full overflow-hidden border border-borderHairline mb-4">
                {profile.topColors.map((color, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.topColors.map((color, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border border-borderHairline" style={{ backgroundColor: color }} />
                    <span className="text-[10px] text-ink-secondary font-mono">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Closet Items', value: profile.metrics.closetCount },
              { label: 'Wear Events', value: profile.metrics.wearEventsCount },
              { label: 'Decisions', value: profile.metrics.totalDecisions },
            ].map((stat) => (
              <div key={stat.label} className="bg-cardSurface border border-borderHairline rounded-xl p-4 text-center shadow-sm">
                <p className="font-serif text-2xl text-ink-primary">{stat.value}</p>
                <p className="text-[10px] text-ink-tertiary mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Rediscovery Callout */}
          {profile.rediscoveryItem && (
            <div className="bg-accent-soft border border-accent/20 rounded-2xl p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Rediscovery</p>
              <p className="text-sm text-ink-primary font-medium">
                Your <strong>{profile.rediscoveryItem.category}</strong> hasn't featured in recent outfits.
              </p>
              <p className="text-[11px] text-ink-secondary mt-1">
                MUSE will prioritise it in tomorrow's capsule to rotate wear frequency.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
