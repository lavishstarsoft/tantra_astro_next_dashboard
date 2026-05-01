import { NextResponse } from 'next/server';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  const rows = await prisma.userCategoryBookmark.findMany({
    where: { userId: gate.user.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      category: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    bookmarkedCategoryNames: rows.map((row) => row.category.name),
  });
}

