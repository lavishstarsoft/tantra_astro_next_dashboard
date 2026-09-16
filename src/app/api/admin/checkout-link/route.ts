import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAdmin } from '@/lib/admin-api';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

const bodySchema = z.object({
  kind: z.enum(['video', 'category']),
  id: z.string().min(1),
  customerEmail: z.string().email().optional(),
});

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return gate.response;
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured (set STRIPE_SECRET_KEY).' },
      { status: 501 }
    );
  }

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
  const { kind, id, customerEmail } = parsed.data;

  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

  let unitAmount = 0;
  let productName = 'Purchase';

  if (kind === 'video') {
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    if (video.isFree || video.checkoutAmountCents <= 0) {
      return NextResponse.json({ error: 'Free videos do not use Checkout' }, { status: 400 });
    }
    unitAmount = video.checkoutAmountCents;
    productName = `Video: ${video.title}`;
  } else {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    if (category.checkoutAmountCents <= 0) {
      return NextResponse.json({ error: 'Category pack amount is invalid. Update Pack label with a valid amount.' }, { status: 400 });
    }
    unitAmount = category.checkoutAmountCents;
    productName = `Category pack: ${category.name}`;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'inr',
          unit_amount: unitAmount,
          product_data: {
            name: productName,
          },
        },
      },
    ],
    success_url: `${base}/dashboard/commerce/orders?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/dashboard/commerce`,
    metadata: {
      kind,
      targetId: id,
    },
  });

  return NextResponse.json({ url: session.url, id: session.id });
}
