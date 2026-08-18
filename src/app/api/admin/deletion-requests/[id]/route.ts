import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

const patchSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(500).optional(),
});

// PATCH: admin approves (final delete) or rejects (preserve) a deletion request.
// Status is decided server-side from `action`; client-sent status is never trusted.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const request = await prisma.accountDeletionRequest.findUnique({ where: { id } });
  if (!request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }
  if (request.status !== 'PENDING') {
    return NextResponse.json(
      { error: `Request already ${request.status.toLowerCase()}` },
      { status: 409 },
    );
  }

  if (parsed.data.action === 'APPROVE') {
    // Execute existing deletion policy: deleting AppUser cascades purchases,
    // sessions, otp, payment sessions, bookmarks, progress, notifications.
    try {
      await prisma.appUser.delete({ where: { id: request.userId } });
    } catch {
      // User may already be gone; proceed to mark request resolved.
    }
    const updated = await prisma.accountDeletionRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: gate.user.id,
        reviewedAt: new Date(),
        adminNote: parsed.data.note ?? null,
      },
    });
    console.log('[deletion] APPROVED', { requestId: id, userId: request.userId, admin: gate.user.id });
    return NextResponse.json({ ok: true, status: updated.status });
  }

  // REJECT: preserve account, just update status.
  const updated = await prisma.accountDeletionRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedBy: gate.user.id,
      reviewedAt: new Date(),
      adminNote: parsed.data.note ?? null,
    },
  });
  console.log('[deletion] REJECTED', { requestId: id, userId: request.userId, admin: gate.user.id });
  return NextResponse.json({ ok: true, status: updated.status });
}
