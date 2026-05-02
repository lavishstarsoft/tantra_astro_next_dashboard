import { NextResponse } from 'next/server';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

// DELETE - clear all notifications for a user
export async function DELETE(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  await prisma.notification.deleteMany({
    where: { userId: gate.user.id },
  });

  return NextResponse.json({ ok: true });
}
