import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
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

  // Pass session user data safely
  const userData = {
    id: session.user.id || '',
    email: session.user.email || '',
    name: session.user.name || '',
  };

  return (
    <Providers>
      <DashboardShell user={userData}>
        {children}
      </DashboardShell>
    </Providers>
  );
}
