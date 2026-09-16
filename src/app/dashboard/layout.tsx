import { redirect } from 'next/navigation';

import { DashboardShell } from '@/components/dashboard-shell';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }

  const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  if (!user) {
    // If session is valid but user is missing from DB (e.g. DB reset), redirect to login
    redirect('/login');
  }

  return <DashboardShell email={session.email}>{children}</DashboardShell>;
}
