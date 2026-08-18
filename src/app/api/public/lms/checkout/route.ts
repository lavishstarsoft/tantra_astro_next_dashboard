import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { normalizePhone } from '@/lib/utils';

const bodySchema = z.object({
  phone: z.string().min(10).max(20),
  otp: z.string().min(4).max(10),
  kind: z.enum(['video', 'category']),
  targetId: z.string().min(1),
});

async function hashOtp(otp: string) {
  const data = new TextEncoder().encode(otp);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Verify OTP → find/create the account by phone → create a PaymentSession →
// hand off to the existing /pay page (which creates the Razorpay order and,
// on success, grants access via the existing webhook). No app token needed.
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const { otp, kind, targetId } = parsed.data;
  const phoneE164 = normalizePhone(parsed.data.phone);
  const now = new Date();

  // OTP verification (mirrors the app's proven logic).
  const testPhones = process.env.TEST_PHONE_NUMBERS?.split(',') ?? [];
  const testOtp = process.env.TEST_OTP || '123456';
  const isTestBypass = testPhones.includes(phoneE164) && otp === testOtp;

  if (!isTestBypass) {
    const unusedFilter = { OR: [{ usedAt: null }, { usedAt: { isSet: false } }] };
    const activeOtps = await prisma.appOtpCode.findMany({
      where: { phone: phoneE164, ...unusedFilter, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    if (activeOtps.length === 0) {
      return NextResponse.json({ error: 'OTP expired or not found. Request a new one.' }, { status: 401 });
    }
    const otpHash = await hashOtp(otp);
    const matched = activeOtps.find((e) => e.codeHash === otpHash);
    if (!matched) {
      return NextResponse.json({ error: 'Invalid OTP. Enter the latest code.' }, { status: 401 });
    }
    await prisma.appOtpCode.update({ where: { id: matched.id }, data: { usedAt: now } });
  }

  // Find or create the account by phone (phone-only; profile editable later in the app).
  const digits = phoneE164.replace(/[^0-9]/g, '');
  const user = await prisma.appUser.upsert({
    where: { phone: phoneE164 },
    update: {},
    create: { phone: phoneE164, name: 'Guest', email: `u${digits}@thantra.app` },
  });

  // Validate the purchasable target.
  const target =
    kind === 'video'
      ? await prisma.video.findUnique({ where: { id: targetId }, select: { id: true, isFree: true, checkoutAmountCents: true } })
      : await prisma.category.findUnique({ where: { id: targetId }, select: { id: true, checkoutAmountCents: true } });
  if (!target) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  if (kind === 'video' && 'isFree' in target && target.isFree) {
    return NextResponse.json({ error: 'This course is free' }, { status: 400 });
  }
  if (!target.checkoutAmountCents || target.checkoutAmountCents <= 0) {
    return NextResponse.json({ error: 'Price not configured' }, { status: 400 });
  }

  const token = crypto.randomBytes(24).toString('hex');
  await prisma.paymentSession.create({
    data: { token, userId: user.id, kind, targetId: target.id, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
  });

  return NextResponse.json({ ok: true, url: `/pay?token=${encodeURIComponent(token)}`, phone: phoneE164 });
}
