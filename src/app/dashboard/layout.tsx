import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/dashboard-shell';
import { getSession } from '@/lib/session';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  return <DashboardShell email={session.email}>{children}</DashboardShell>;
}
