import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 501 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email ?? session.customer_email ?? 'unknown';
    const amount = session.amount_total ?? 0;
    const currency = session.currency ?? 'inr';
    const lineDescription = JSON.stringify({
      metadata: session.metadata,
      display: session.custom_fields,
    });

    await prisma.order.upsert({
      where: { stripeSessionId: session.id },
      create: {
        stripeSessionId: session.id,
        stripePaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        customerEmail: email,
        amountTotalCents: amount,
        currency,
        status: 'completed',
        lineDescription,
      },
      update: {
        stripePaymentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        status: 'completed',
        amountTotalCents: amount,
        lineDescription,
      },
    });
  }

  return NextResponse.json({ received: true });
}
