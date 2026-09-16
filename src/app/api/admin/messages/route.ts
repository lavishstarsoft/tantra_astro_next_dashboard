import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-api';

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

const patchSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  imageUrl: z.string().optional(),
  kind: z.enum(['info', 'update', 'offer', 'warning']).optional(),
  actionKind: z.enum(['none', 'video', 'category', 'url']).optional(),
  actionTarget: z.string().optional(),
  buttonText: z.string().optional(),
  active: z.boolean().optional(),
  targetVersion: z.string().nullable().optional(),
  platform: z.enum(['ios', 'android', 'all']).optional(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  const messages = await prisma.inAppMessage.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ ok: true, messages });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const json: unknown = await req.json();
    const data = messageSchema.parse(json);

    const message = await prisma.inAppMessage.create({ data });
    return NextResponse.json({ ok: true, message });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid data' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return admin.response;

  try {
    const json: unknown = await req.json();
    const parsed = patchSchema.parse(json);
    const { id, ...updates } = parsed;

    const message = await prisma.inAppMessage.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json({ ok: true, message });
  } catch {
    return NextResponse.json({ ok: false, error: 'Update failed' }, { status: 400 });
  }
}
