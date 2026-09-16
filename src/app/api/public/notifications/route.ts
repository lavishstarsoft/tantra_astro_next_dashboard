import { NextResponse } from 'next/server';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

// GET - fetch user's notifications
export async function GET(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  const notifications = await prisma.notification.findMany({
    where: { userId: gate.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(notifications);
}
