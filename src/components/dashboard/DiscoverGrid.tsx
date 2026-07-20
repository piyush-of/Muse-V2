import { Card } from '@/components/ui/Card';
import { Layers } from 'lucide-react';

interface Recommendation {
  name: string;
  brand: string;
  price: string;
  material: string;
  color: string;
  combos: string;
}

interface WardrobeGap {
  id: string;
  title: string;
  type: string;
  description: string;
  impact: string;
  recommendations: Recommendation[];
}

interface DiscoverGridProps {
  gaps: WardrobeGap[];
}

export default function DiscoverGrid({ gaps }: DiscoverGridProps) {
  return (
    <div className="space-y-8 animate-slide-up">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground">Discover</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          Wardrobe insight, not a shopping funnel — these are the gaps holding back combinations
          from the pieces you already own.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {gaps.map((gap) => (
          <Card key={gap.id} className="p-6 space-y-4 bg-card/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-accent">
                  {gap.type}
                </span>
                <h3 className="font-serif text-xl font-semibold text-foreground mt-1">{gap.title}</h3>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 rounded-full px-2 py-1 whitespace-nowrap">
                <Layers size={11} />
                {gap.impact}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">{gap.description}</p>

            {gap.recommendations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/40">
                {gap.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg border border-border flex-shrink-0"
                      style={{ backgroundColor: rec.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {rec.name} <span className="text-muted-foreground font-normal">— {rec.brand}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {rec.material} · {rec.price} · {rec.combos}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
