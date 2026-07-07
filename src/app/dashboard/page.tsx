import { getTodayOutfits } from '@/actions/capsule';
import DailyCapsule from '@/components/dashboard/DailyCapsule';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const res = await getTodayOutfits();
  const outfits = res.success ? res.outfits || [] : [];

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground">Today's Capsule</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
          Context-aware combinations pre-compiled once daily to guarantee zero load latency.
        </p>
      </div>

      <DailyCapsule initialOutfits={outfits} />
    </div>
  );
}
