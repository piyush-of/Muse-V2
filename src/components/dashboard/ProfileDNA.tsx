'use client';

import React, { useEffect, useRef } from 'react';
import { TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { TRAIT_LABELS } from '@/constants';

interface ClosetItem {
  id: string;
  category: string;
  color: string;
  thumbnailUrl: string;
}

interface ProfileDNAProps {
  profile: {
    traits: Record<string, number>;
    topColors: string[];
    lastComputedAt: string;
    metrics: {
      acceptanceRate: number;
      totalDecisions: number;
      closetCount: number;
      wearEventsCount: number;
    };
    rediscoveryItem: ClosetItem | null;
  };
}

export default function ProfileDNA({ profile }: ProfileDNAProps) {
  const radarRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  // Animated Radar Fingerprint Drawing
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 280;
    canvas.height = 280;
    const center = 140;
    const radius = 90;
    const traits = profile.traits;
    const axes = Object.keys(TRAIT_LABELS);
    const angleStep = (Math.PI * 2) / axes.length;
    let animFraction = 0;

    const drawRadar = () => {
      ctx.clearRect(0, 0, 280, 280);

      // 1. Draw web rings
      for (let j = 1; j <= 4; j++) {
        const r = radius * (j / 4);
        ctx.strokeStyle = 'rgba(75, 59, 102, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < axes.length; i++) {
          const a = i * angleStep - Math.PI / 2;
          const x = center + Math.cos(a) * r;
          const y = center + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // 2. Draw spokes & text tags
      for (let i = 0; i < axes.length; i++) {
        const a = i * angleStep - Math.PI / 2;
        ctx.strokeStyle = 'rgba(75, 59, 102, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(center + Math.cos(a) * radius, center + Math.sin(a) * radius);
        ctx.stroke();

        const labelX = center + Math.cos(a) * (radius + 24);
        const labelY = center + Math.sin(a) * (radius + 15);
        ctx.fillStyle = 'var(--muted-foreground)';
        ctx.font = '600 8px var(--font-sans)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const [low, high] = TRAIT_LABELS[axes[i]] || ['', ''];
        ctx.fillText(`${low}↔${high}`, labelX, labelY);
      }

      // 3. Draw style footprint polygon
      const breath = Math.sin(Date.now() * 0.0018) * 0.015; // subtle breathing effect
      ctx.fillStyle = 'rgba(75, 59, 102, 0.16)';
      ctx.strokeStyle = 'var(--accent)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      for (let i = 0; i < axes.length; i++) {
        const a = i * angleStep - Math.PI / 2;
        const val = ((traits[axes[i]] ?? 0.5) + breath) * animFraction;
        const x = center + Math.cos(a) * radius * val;
        const y = center + Math.sin(a) * radius * val;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Vertex dots
      for (let i = 0; i < axes.length; i++) {
        const a = i * angleStep - Math.PI / 2;
        const val = ((traits[axes[i]] ?? 0.5) + breath) * animFraction;
        const x = center + Math.cos(a) * radius * val;
        const y = center + Math.sin(a) * radius * val;
        ctx.fillStyle = 'var(--card)';
        ctx.strokeStyle = 'var(--accent)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (animFraction < 1) animFraction += 0.03;
    };

    const interval = setInterval(drawRadar, 30);
    return () => clearInterval(interval);
  }, [profile]);

  // Acceptance Rate Sparkline Graph
  useEffect(() => {
    const canvas = sparkRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 180;
    canvas.height = 45;
    const points = [40, 48, 55, 52, 60, 68, 65, 74, 80, profile.metrics.acceptanceRate];
    const step = 180 / (points.length - 1);
    
    ctx.clearRect(0, 0, 180, 45);

    // Gradient fill under path
    const grad = ctx.createLinearGradient(0, 0, 0, 45);
    grad.addColorStop(0, 'rgba(75, 59, 102, 0.12)');
    grad.addColorStop(1, 'rgba(75, 59, 102, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 45);
    points.forEach((val, i) => {
      const x = i * step;
      const y = 45 - (val / 100) * 35 - 4;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(180, 45);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = 'var(--accent)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((val, i) => {
      const x = i * step;
      const y = 45 - (val / 100) * 35 - 4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Terminal point dot
    const lastIdx = points.length - 1;
    const lx = lastIdx * step;
    const ly = 45 - (points[lastIdx] / 100) * 35 - 4;
    ctx.fillStyle = 'var(--card)';
    ctx.strokeStyle = 'var(--accent)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, [profile]);

  return (
    <div className="relative w-full space-y-8 animate-slide-up">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="font-serif text-4xl font-bold text-foreground">Style DNA</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          An evolving blueprint of your styling choices compiled directly from your wardrobe and decisions.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Web mesh frame */}
        <Card className="flex flex-col items-center p-8 bg-card/65 backdrop-blur-md">
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-6">Fingerprint Radar</p>
          <div className="relative flex items-center justify-center min-h-[240px]">
            <canvas ref={radarRef} style={{ width: '220px', height: '220px' }} />
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-4">
            Recalculates dynamically with every wardrobe update and outfit review.
          </p>
        </Card>

        {/* Dynamic metrics panel */}
        <div className="space-y-6">
          {/* North Star Card */}
          <Card className="p-6 bg-card/65 flex justify-between items-center gap-6">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">North Star Metric</p>
              <p className="font-serif text-4xl font-bold text-foreground">{profile.metrics.acceptanceRate}%</p>
              <p className="text-xs text-muted-foreground">Acceptance rate — no manual edits</p>
              <p className="text-[9px] text-muted-foreground font-semibold uppercase">{profile.metrics.totalDecisions} Decisions Logged</p>
            </div>
            <div className="text-right">
              <canvas ref={sparkRef} style={{ width: '100px', height: '30px' }} />
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end gap-1 mt-1">
                <TrendingUp size={11} /> Trending Up
              </p>
            </div>
          </Card>

          {/* Archetype traits bar */}
          <Card className="p-6 bg-card/65 space-y-4">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Style Trait Meters</p>
            <div className="space-y-4">
              {Object.entries(TRAIT_LABELS).map(([key, [lo, hi]]) => {
                const value = profile.traits[key] ?? 0.5;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                      <span>{lo}</span>
                      <span>{hi}</span>
                    </div>
                    <div className="relative h-1.5 bg-background border border-border rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-accent rounded-full transition-all duration-1000"
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Colors Card */}
          {profile.topColors.length > 0 && (
            <Card className="p-6 bg-card/65 space-y-4">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Dominant Color Palette</p>
              <div className="flex h-6 rounded-xl overflow-hidden border border-border">
                {profile.topColors.map((color, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: color }} title={color} />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {profile.topColors.map((color, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[9px] font-mono font-semibold text-muted-foreground">
                    <div className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: color }} />
                    <span>{color}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Rediscovery card */}
          {profile.rediscoveryItem && (
            <div className="p-5 rounded-2xl bg-accent/5 border border-accent/15 flex items-start gap-4">
              <div className="w-12 aspect-[3/4] bg-muted rounded-lg overflow-hidden border border-border flex-shrink-0">
                <img src={profile.rediscoveryItem.thumbnailUrl} alt="Garment" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] bg-accent/15 border border-accent/25 px-2 py-0.5 rounded text-accent font-bold uppercase tracking-wider">
                  Rediscovery Alert
                </span>
                <h4 className="text-xs font-semibold text-foreground mt-1">
                  Your {profile.rediscoveryItem.category} hasn't been worn in recently generated outfits.
                </h4>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  MUSE will prioritize this piece in tomorrow's combinations to ensure balanced wear-frequency across your wardrobe.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
