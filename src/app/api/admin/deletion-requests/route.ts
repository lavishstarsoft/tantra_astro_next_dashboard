import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

// GET: list all account-deletion requests (admin only). Optional ?status= filter.
export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const where = status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status) ? { status } : {};

  const requests = await prisma.accountDeletionRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    ok: true,
    requests: requests.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      userPhone: r.userPhone,
      status: r.status,
      adminNote: r.adminNote ?? null,
      reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
