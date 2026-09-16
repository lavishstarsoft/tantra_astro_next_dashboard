import { NextResponse } from 'next/server';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

// GET: current user's latest deletion-request status (server-derived, never trust client).
export async function GET(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  const latest = await prisma.accountDeletionRequest.findFirst({
    where: { userId: gate.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    ok: true,
    request: latest
      ? { id: latest.id, status: latest.status, createdAt: latest.createdAt.toISOString() }
      : null,
  });
}

// POST: submit a permanent-deletion request. No hard delete here. Duplicate PENDING blocked.
export async function POST(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;
  const { user } = gate;

  const existingPending = await prisma.accountDeletionRequest.findFirst({
    where: { userId: user.id, status: 'PENDING' },
  });
  if (existingPending) {
    return NextResponse.json(
      { ok: false, error: 'A deletion request is already pending review.', status: 'PENDING' },
      { status: 409 },
    );
  }

  const created = await prisma.accountDeletionRequest.create({
    data: {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone,
      status: 'PENDING',
    },
  });

  return NextResponse.json({ ok: true, status: created.status, id: created.id });
}
