import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }
  const orders = await prisma.purchase.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: true },
    take: 200,
  });
  return NextResponse.json({ orders });
}
