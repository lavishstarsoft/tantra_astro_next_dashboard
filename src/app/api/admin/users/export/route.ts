import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

function csvEscape(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.appUser.findMany({
    where: where as object,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { purchases: true } } },
    take: 10_000,
  });

  const header = ['name', 'email', 'phone', 'purchaseCount', 'createdAt', 'updatedAt'];
  const lines = [header.join(',')];

  for (const user of rows) {
    lines.push(
      [
        csvEscape(user.name),
        csvEscape(user.email),
        csvEscape(user.phone),
        String(user._count.purchases),
        user.createdAt.toISOString(),
        user.updatedAt.toISOString(),
      ].join(',')
    );
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="registered-users-export.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
