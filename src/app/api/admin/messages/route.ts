import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth-utils';

const messageSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  imageUrl: z.string().optional(),
  kind: z.enum(['info', 'update', 'offer', 'warning']).default('info'),
  actionKind: z.enum(['none', 'video', 'category', 'url']).default('none'),
  actionTarget: z.string().optional(),
  buttonText: z.string().default('Dismiss'),
  active: z.boolean().default(true),
  targetVersion: z.string().optional(),
  platform: z.enum(['ios', 'android', 'all']).default('all'),
});

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const messages = await prisma.inAppMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ ok: true, messages });
}

export async function POST(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const json = await req.json();
    const data = messageSchema.parse(json);

    const message = await prisma.inAppMessage.create({ data });
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Invalid data' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const json = await req.json();
    const { id, ...updates } = json;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const message = await prisma.inAppMessage.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json({ ok: true, message });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 400 });
  }
}
