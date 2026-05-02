import { NextResponse } from 'next/server';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

// PATCH - mark one or all as read
export async function PATCH(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  const body = (await req.json()) as { id?: string; all?: boolean };

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId: gate.user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: gate.user.id },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Provide id or all:true' }, { status: 400 });
}
