import { getWardrobeGaps } from '@/actions/discover';
import DiscoverGrid from '@/components/dashboard/DiscoverGrid';

export const dynamic = 'force-dynamic';

export default async function DiscoverPage() {
  const res = await getWardrobeGaps();
  const gaps = res.success ? res.gaps || [] : [];

  return <DiscoverGrid gaps={gaps} />;
}
