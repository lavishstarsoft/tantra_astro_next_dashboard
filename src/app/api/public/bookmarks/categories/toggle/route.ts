import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  categoryName: z.string().min(1),
});

export async function POST(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { name: parsed.data.categoryName },
    select: { id: true, name: true },
  });
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  const existing = await prisma.userCategoryBookmark.findUnique({
    where: {
      userId_categoryId: {
        userId: gate.user.id,
        categoryId: category.id,
      },
    },
    select: { id: true },
  });

  if (existing) {
    await prisma.userCategoryBookmark.delete({
      where: {
        userId_categoryId: {
          userId: gate.user.id,
          categoryId: category.id,
        },
      },
    });
    return NextResponse.json({ ok: true, bookmarked: false, categoryName: category.name });
  }

  await prisma.userCategoryBookmark.create({
    data: {
      userId: gate.user.id,
      categoryId: category.id,
    },
  });

  return NextResponse.json({ ok: true, bookmarked: true, categoryName: category.name });
}

