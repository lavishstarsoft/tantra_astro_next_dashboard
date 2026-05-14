import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Razorpay Webhook Handler
 * 
 * This endpoint receives server-to-server callbacks from Razorpay
 * when a payment is captured/completed. This ensures purchases are
 * marked as completed even if the user closes the app before the
 * client-side verify call happens.
 * 
 * Configure in Razorpay Dashboard:
 *   URL: https://your-domain.com/api/public/payments/razorpay/webhook
 *   Events: payment.captured
 *   Secret: Set RAZORPAY_WEBHOOK_SECRET in .env
 */

export async function POST(req: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // 1. Read raw body for signature verification
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  // 2. Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (expectedSignature !== signature) {
    console.error('[Webhook] Signature mismatch');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 3. Parse the event
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType = String(event?.event ?? '');
  console.log(`[Webhook] Received event: ${eventType}`);

  // 4. Only handle payment.captured events
  if (eventType !== 'payment.captured') {
    return NextResponse.json({ ok: true, message: `Ignored event: ${eventType}` });
  }

  // Extract payment entity from nested payload safely
  const payload = event?.payload as Record<string, unknown> | undefined;
  const paymentWrapper = payload?.payment as Record<string, unknown> | undefined;
  const payment = paymentWrapper?.entity as Record<string, unknown> | undefined;
  if (!payment) {
    console.error('[Webhook] No payment entity in payload');
    return NextResponse.json({ error: 'No payment entity' }, { status: 400 });
  }

  const razorpayOrderId = String(payment.order_id ?? '');
  const razorpayPaymentId = String(payment.id ?? '');

  console.log(`[Webhook] Processing payment: orderId=${razorpayOrderId}, paymentId=${razorpayPaymentId}`);

  // 5. Find the matching purchase
  const purchase = await prisma.purchase.findUnique({
    where: { razorpayOrderId },
  });

  if (!purchase) {
    console.error(`[Webhook] No purchase found for orderId: ${razorpayOrderId}`);
    return NextResponse.json({ error: 'Purchase not found' }, { status: 404 });
  }

  // 6. Skip if already completed (idempotent)
  if (purchase.status === 'completed') {
    console.log(`[Webhook] Purchase already completed for orderId: ${razorpayOrderId}`);
    return NextResponse.json({ ok: true, message: 'Already completed' });
  }

  // 7. Calculate access expiry
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

  // 8. Mark purchase as completed
  await prisma.purchase.update({
    where: { id: purchase.id },
    data: {
      status: 'completed',
      razorpayPaymentId,
      accessExpiresAt,
    },
  });

  console.log(`[Webhook] Purchase marked as completed: orderId=${razorpayOrderId}`);

  // 9. Create notification for user
  try {
    let targetName = 'Content';
    if (purchase.kind === 'video') {
      const v = await prisma.video.findUnique({ where: { id: purchase.targetId }, select: { title: true } });
      if (v) targetName = v.title;
    } else {
      const c = await prisma.category.findUnique({ where: { id: purchase.targetId }, select: { name: true } });
      if (c) targetName = c.name;
    }

    await prisma.notification.create({
      data: {
        userId: purchase.userId,
        title: 'Enrollment Successful! 🎉',
        body: `You have successfully enrolled in "${targetName}". Start learning now!`,
        type: 'purchase',
        data: JSON.stringify({ kind: purchase.kind, targetId: purchase.targetId, targetName }),
      },
    });
  } catch (e) {
    console.error('[Webhook] Failed to create notification:', e);
  }

  // 10. Clean up the payment session
  try {
    await prisma.paymentSession.deleteMany({
      where: { userId: purchase.userId, targetId: purchase.targetId },
    });
  } catch {
    // ignore cleanup errors
  }

  return NextResponse.json({ ok: true });
}
