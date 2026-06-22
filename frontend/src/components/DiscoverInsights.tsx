import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { TrendingUp, ArrowUpRight, AlertCircle } from 'lucide-react';

interface Recommendation {
  name: string;
  brand: string;
  price: string;
  material: string;
  color: string;
  combos: string;
}

interface Gap {
  id: number;
  title: string;
  type: string;
  description: string;
  impact: string;
  recommendations: Recommendation[];
}

export default function DiscoverInsights() {
  const token = useStore((state) => state.token);
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

  const { data: gaps = [], isLoading, error } = useQuery<Gap[]>({
    queryKey: ['discoverGaps'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/discover/gaps`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch gaps');
      return res.json();
    },
    enabled: !!token
  });

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
      <p className="text-ink-secondary text-sm">Analysing wardrobe gaps...</p>
    </div>
  );

  if (error) return (
    <div className="text-center p-8 bg-red-50 border border-red-100 rounded-xl max-w-md mx-auto mt-10">
      <AlertCircle className="mx-auto text-red-600 mb-3" size={24} />
      <p className="text-red-600 text-xs">{(error as Error).message}</p>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-10">
        <h2 className="font-serif text-4xl text-ink-primary mb-3">Wardrobe Insights</h2>
        <p className="text-ink-secondary text-sm max-w-xl">
          MUSE analyses your closet structure to surface styling gaps. These suggestions maximise utility of what you already own — they are never a shopping funnel.
        </p>
      </div>

      <div className="space-y-8">
        {gaps.map((gap) => (
          <div key={gap.id} className="bg-cardSurface border border-borderHairline rounded-2xl p-8 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-accent bg-accent-soft px-2.5 py-1 rounded mb-3">
                  {gap.type}
                </span>
                <h3 className="font-serif text-2xl text-ink-primary">{gap.title}</h3>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-paper border border-borderHairline rounded-full text-xs text-ink-primary font-semibold flex-shrink-0">
                <TrendingUp size={13} className="text-accent" />
                <span>{gap.impact}</span>
              </div>
            </div>

            {/* Description — no urgency language */}
            <p className="text-ink-secondary text-sm leading-relaxed mb-8 max-w-2xl">{gap.description}</p>

            {/* Recommendation Cards */}
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-ink-tertiary mb-4">Curated Calibrations</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {gap.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-paper border border-borderHairline rounded-xl p-5 hover:border-borderStrong transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] text-ink-tertiary mb-1">{rec.brand}</p>
                        <h4 className="text-sm font-semibold text-ink-primary leading-tight flex items-start justify-between gap-2">
                          {rec.name}
                          <ArrowUpRight size={13} className="text-ink-tertiary group-hover:text-accent transition-colors flex-shrink-0 mt-0.5" />
                        </h4>
                      </div>
                      <span className="text-sm font-bold text-ink-primary ml-4">{rec.price}</span>
                    </div>
                    <p className="text-[10px] text-ink-secondary mb-3">{rec.material}</p>
                    <div className="flex items-center gap-2 pt-3 border-t border-borderHairline">
                      <div className="w-3.5 h-3.5 rounded-full border border-borderHairline flex-shrink-0" style={{ backgroundColor: rec.color }} />
                      <span className="text-[10px] text-ink-primary font-medium">{rec.combos}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
