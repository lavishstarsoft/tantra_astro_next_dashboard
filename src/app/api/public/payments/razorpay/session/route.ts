import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { getRazorpayKeyId, createRazorpayOrder } from '@/lib/razorpay';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const session = await prisma.paymentSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 404 });
  }
  if (session.expiresAt <= new Date()) {
    return NextResponse.json({ error: 'Session expired' }, { status: 410 });
  }

  const [video, category] = await Promise.all([
    session.kind === 'video'
      ? prisma.video.findUnique({ where: { id: session.targetId }, select: { title: true, checkoutAmountCents: true, isFree: true } })
      : Promise.resolve(null),
    session.kind === 'category'
      ? prisma.category.findUnique({ where: { id: session.targetId }, select: { name: true, checkoutAmountCents: true } })
      : Promise.resolve(null),
  ]);

  const amountCents = session.kind === 'video' ? (video?.checkoutAmountCents ?? 0) : (category?.checkoutAmountCents ?? 0);
  if (!amountCents || amountCents <= 0) {
    return NextResponse.json({ error: 'Payment amount is invalid' }, { status: 400 });
  }
  if (session.kind === 'video' && video?.isFree) {
    return NextResponse.json({ error: 'This video is free' }, { status: 400 });
  }

  // Razorpay receipt length limit is 40 chars. 
  // Token is unique and enough for tracking.
  const receipt = `rcpt_${session.token.slice(0, 30)}`;
  const order = await createRazorpayOrder({
    amountCents,
    currency: 'INR',
    receipt,
    notes: {
      kind: session.kind,
      targetId: session.targetId,
      userId: session.userId,
    },
  });

  await prisma.purchase.create({
    data: {
      userId: session.userId,
      kind: session.kind,
      targetId: session.targetId,
      status: 'pending',
      provider: 'razorpay',
      amountTotalCents: amountCents,
      currency: 'INR',
      razorpayOrderId: order.id,
    },
  });

  return NextResponse.json({
    ok: true,
    keyId: getRazorpayKeyId(),
    orderId: order.id,
    amountCents,
    currency: 'INR',
    customer: {
      name: session.user.name,
      email: session.user.email,
      contact: session.user.phone.replace(/^\+/, ''),
    },
    description: session.kind === 'video' ? `Video: ${video?.title ?? 'Video'}` : `Category pack: ${category?.name ?? 'Category'}`,
  });
}

