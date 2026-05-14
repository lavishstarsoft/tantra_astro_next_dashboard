import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is missing');
      return NextResponse.json({ error: 'Internal configuration error' }, { status: 500 });
    }

    if (!signature) {
      console.warn('[Razorpay Webhook] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[Razorpay Webhook] Invalid signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;
    console.log(`[Razorpay Webhook] Processing event: ${eventType}`);

    if (eventType === 'order.paid' || eventType === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const paymentId = payment?.id;

      if (!orderId) {
        console.warn('[Razorpay Webhook] Event received without order_id');
        return NextResponse.json({ ok: true });
      }

      // Find the pending purchase record
      const purchase = await prisma.purchase.findUnique({
        where: { razorpayOrderId: orderId },
      });

      if (!purchase) {
        console.warn(`[Razorpay Webhook] No purchase record found for Order ID: ${orderId}`);
        return NextResponse.json({ ok: true });
      }

      if (purchase.status === 'completed') {
        console.log(`[Razorpay Webhook] Purchase ${purchase.id} already marked as completed.`);
        return NextResponse.json({ ok: true });
      }

      // Calculate access expiry based on content kind
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
      } else if (purchase.kind === 'category') {
        const category = await prisma.category.findUnique({
          where: { id: purchase.targetId },
          select: { accessValidityDays: true },
        });
        const validityDays = Math.max(0, category?.accessValidityDays ?? 0);
        if (validityDays > 0) {
          accessExpiresAt = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
        }
      }

      // Update purchase status
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          status: 'completed',
          razorpayPaymentId: paymentId,
          accessExpiresAt,
        },
      });

      console.log(`[Razorpay Webhook] Success: Purchase ${purchase.id} activated.`);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Razorpay Webhook] Global error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
