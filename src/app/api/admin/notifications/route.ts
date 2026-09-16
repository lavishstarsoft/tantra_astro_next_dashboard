import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';

// GET - list sent notifications (paginated)
export async function GET(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')));
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: { user: { select: { name: true, phone: true, email: true } } },
    }),
    prisma.notification.count(),
  ]);

  return NextResponse.json({ notifications, total, page, limit });
}

// POST - send notification to one user or broadcast to all
export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body = (await req.json()) as {
    title?: string;
    body?: string;
    type?: string;
    imageUrl?: string;
    data?: string;
    userId?: string;    // specific user
    categoryId?: string; // target category group
    broadcast?: boolean; // send to all users
  };

  if (!body.title || !body.body) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
  }

  if (body.broadcast) {
    const users = await prisma.appUser.findMany({ select: { id: true } });
    const created = await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title: body.title!,
        body: body.body!,
        type: body.type ?? 'general',
        imageUrl: body.imageUrl ?? null,
        data: body.data ?? null,
      })),
    });
    return NextResponse.json({ count: created.count, broadcast: true });
  }

  if (body.categoryId) {
    const users = await prisma.purchase.findMany({
      where: {
        kind: 'category',
        targetId: body.categoryId,
        status: 'completed',
      },
      select: { userId: true },
    });
    
    if (users.length === 0) {
      return NextResponse.json({ count: 0, categoryId: body.categoryId });
    }

    const created = await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.userId,
        title: body.title!,
        body: body.body!,
        type: body.type ?? 'general',
        imageUrl: body.imageUrl ?? null,
        data: body.data ?? null,
      })),
    });
    return NextResponse.json({ count: created.count, categoryId: body.categoryId });
  }

  if (!body.userId) {
    return NextResponse.json({ error: 'userId or broadcast flag required' }, { status: 400 });
  }

  const notification = await prisma.notification.create({
    data: {
      userId: body.userId,
      title: body.title,
      body: body.body,
      type: body.type ?? 'general',
      imageUrl: body.imageUrl ?? null,
      data: body.data ?? null,
    },
  });

  return NextResponse.json(notification);
}
