import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ClosetGrid from '@/components/dashboard/ClosetGrid';

export const dynamic = 'force-dynamic';

export default async function ClosetPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  const items = await prisma.closetItem.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  const serializedItems = items.map((item) => ({
    id: item.id,
    photoUrl: item.photoUrl,
    thumbnailUrl: item.thumbnailUrl,
    category: item.category,
    color: item.color,
    season: item.season,
    formality: item.formality,
    createdAt: item.createdAt.toISOString(),
  }));

  return <ClosetGrid items={serializedItems} />;
}
