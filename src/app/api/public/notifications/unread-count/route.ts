import { NextResponse } from 'next/server';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

// GET - unread count
export async function GET(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  const count = await prisma.notification.count({
    where: { userId: gate.user.id, read: false },
  });

  return NextResponse.json({ count });
}
