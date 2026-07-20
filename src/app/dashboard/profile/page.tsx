import { getStyleProfileData } from '@/actions/profile';
import ProfileDNA from '@/components/dashboard/ProfileDNA';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const res = await getStyleProfileData();

  if (!res.success || !res.profile) {
    return (
      <div className="space-y-4 animate-slide-up">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground">Style DNA</h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          We couldn't load your style profile right now. Try refreshing the page.
        </p>
      </div>
    );
  }

  return <ProfileDNA profile={res.profile} />;
}
