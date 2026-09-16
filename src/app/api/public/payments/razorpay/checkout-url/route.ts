import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

const bodySchema = z
  .object({
    kind: z.enum(['video', 'category']),
    videoTitle: z.string().min(1).optional(),
    categoryName: z.string().min(1).optional(),
  })
  .refine((v) => (v.kind === 'video' ? Boolean(v.videoTitle) : Boolean(v.categoryName)), {
    message: 'Missing target',
  });

function randomToken() {
  return crypto.randomBytes(24).toString('hex');
}

export async function POST(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { kind } = parsed.data;
  const target =
    kind === 'video'
      ? await prisma.video.findUnique({
          where: { title: parsed.data.videoTitle! },
          select: { id: true, title: true, checkoutAmountCents: true, isFree: true },
        })
      : await prisma.category.findUnique({
          where: { name: parsed.data.categoryName! },
          select: { id: true, name: true, checkoutAmountCents: true },
        });

  if (!target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (kind === 'video' && 'isFree' in target && target.isFree) {
    return NextResponse.json({ error: 'This video is free' }, { status: 400 });
  }
  if ('checkoutAmountCents' in target && Number(target.checkoutAmountCents) <= 0) {
    return NextResponse.json({ error: 'Payment amount is invalid' }, { status: 400 });
  }

  const token = randomToken();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await prisma.paymentSession.create({
    data: {
      token,
      userId: gate.user.id,
      kind,
      targetId: target.id,
      expiresAt,
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
  const url = `${base}/pay?token=${encodeURIComponent(token)}`;
  return NextResponse.json({ ok: true, url });
}

