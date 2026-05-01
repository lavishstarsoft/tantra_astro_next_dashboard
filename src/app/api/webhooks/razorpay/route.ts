import crypto from 'crypto';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Config error' }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('Invalid Razorpay Webhook Signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { order_id?: string; id?: string } } } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('Razorpay Webhook Event:', event.event);

  if (event.event === 'order.paid' || event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    if (!payment || !payment.order_id || !payment.id) return NextResponse.json({ ok: true });
    const orderId = payment.order_id;
    const paymentId = payment.id;

    const purchase = await prisma.purchase.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (purchase && purchase.status !== 'completed') {
      let accessExpiresAt: Date | null = null;
      if (purchase.kind === 'video') {
        const video = await prisma.video.findUnique({
          where: { id: purchase.targetId },
          select: { accessValidityDays: true },
        });
        const validityDays = Math.max(0, video?.accessValidityDays ?? 0);
        if (validityDays > 0) {
          accessExpiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
        }
      }

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          status: 'completed',
          razorpayPaymentId: paymentId,
          accessExpiresAt,
        },
      });
      console.log(`Purchase ${purchase.id} marked as completed via Webhook`);
    }
  }

  return NextResponse.json({ ok: true });
}
