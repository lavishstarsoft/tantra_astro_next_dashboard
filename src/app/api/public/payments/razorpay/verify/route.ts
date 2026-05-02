import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { verifyRazorpaySignature } from '@/lib/razorpay';

const bodySchema = z.object({
  token: z.string().min(10),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(req: Request) {
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

  const { token, razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;
  const session = await prisma.paymentSession.findUnique({ where: { token } });
  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 404 });
  }

  const ok = verifyRazorpaySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!ok) {
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }

  const purchase = await prisma.purchase.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
  if (!purchase) {
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  let accessExpiresAt: Date | null = null;
  if (purchase.kind === 'video') {
    const video = await prisma.video.findUnique({
      where: { id: purchase.targetId },
      select: { accessValidityDays: true },
    });
    const validityDays = Math.max(0, video?.accessValidityDays ?? 0);
    if (validityDays > 0) {
      const now = Date.now();
      accessExpiresAt = new Date(now + validityDays * 24 * 60 * 60 * 1000);
    }
  } else if (purchase.kind === 'category') {
    const category = await prisma.category.findUnique({
      where: { id: purchase.targetId },
      select: { accessValidityDays: true },
    });
    const validityDays = Math.max(0, category?.accessValidityDays ?? 0);
    if (validityDays > 0) {
      const now = Date.now();
      accessExpiresAt = new Date(now + validityDays * 24 * 60 * 60 * 1000);
    }
  }

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      status: 'completed',
      razorpayPaymentId: razorpay_payment_id,
      accessExpiresAt,
    },
  });

  await prisma.paymentSession.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}

