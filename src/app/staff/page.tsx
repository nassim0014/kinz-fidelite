import { redirect } from 'next/navigation';
import { StaffConsole } from '@/components/staff/StaffConsole';
import { env } from '@/lib/env';
import { getPageSession } from '@/server/page-session';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Comptoir' };

export default async function StaffPage() {
  const session = await getPageSession();
  if (!session) redirect('/staff/login');
  return (
    <StaffConsole
      staffName={session.name}
      isOwner={session.role === 'owner'}
      appUrl={env().APP_URL}
    />
  );
}
