import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

function parseDateInput(value?: string | null) {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

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
  const category = (url.searchParams.get('category') ?? '').trim();
  const type = (url.searchParams.get('type') ?? 'all') as 'all' | 'individual' | 'pack';
  const published = (url.searchParams.get('published') ?? 'all') as 'all' | 'published' | 'draft';
  const sort = (url.searchParams.get('sort') ?? 'newest') as
    | 'newest'
    | 'oldest'
    | 'title_asc'
    | 'title_desc';
  const fromDate = parseDateInput(url.searchParams.get('from'));
  const toDate = parseDateInput(url.searchParams.get('to'));
  const toDateExclusive = toDate ? new Date(toDate.getTime() + 24 * 60 * 60 * 1000) : null;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { subtitle: { contains: q, mode: 'insensitive' } },
      { meta: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (category) {
    where.category = { name: category };
  }
  if (published === 'published') {
    where.published = true;
  } else if (published === 'draft') {
    where.published = false;
  }
  if (type === 'individual') {
    where.packItems = { none: {} };
  } else if (type === 'pack') {
    where.packItems = { some: {} };
  }
  if (fromDate || toDateExclusive) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDateExclusive ? { lt: toDateExclusive } : {}),
    };
  }

  const orderBy =
    sort === 'oldest'
      ? [{ createdAt: 'asc' as const }]
      : sort === 'title_asc'
        ? [{ title: 'asc' as const }]
        : sort === 'title_desc'
          ? [{ title: 'desc' as const }]
          : [{ createdAt: 'desc' as const }];

  const rows = await prisma.video.findMany({
    where: where as object,
    include: { category: true, packItems: true },
    orderBy,
    take: 5_000,
  });

  const header = [
    'title',
    'category',
    'type',
    'priceLabel',
    'individualPriceLabel',
    'published',
    'isFree',
    'createdAt',
  ];
  const lines = [header.join(',')];

  for (const v of rows) {
    const typeLabel = v.packItems.length > 0 ? 'category_pack' : 'individual';
    lines.push(
      [
        csvEscape(v.title),
        csvEscape(v.category.name),
        typeLabel,
        csvEscape(v.priceLabel),
        csvEscape(v.individualPriceLabel ?? ''),
        v.published ? 'yes' : 'no',
        v.isFree ? 'yes' : 'no',
        v.createdAt.toISOString(),
      ].join(',')
    );
  }

  const csv = lines.join('\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="videos-export.csv"',
      'Cache-Control': 'no-store',
    },
  });
}

