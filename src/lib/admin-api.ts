import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  const user = await prisma.adminUser.findUnique({ where: { id: session.sub } });
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true as const, session, user };
}
