import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Providers } from '@/providers/providers';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { latitude: true, longitude: true },
  });

  // Pass session user data safely
  const userData = {
    id: session.user.id || '',
    email: session.user.email || '',
    name: session.user.name || '',
  };

  return (
    <Providers>
      <DashboardShell user={userData} hasLocation={!!(dbUser?.latitude && dbUser?.longitude)}>
        {children}
      </DashboardShell>
    </Providers>
  );
}
