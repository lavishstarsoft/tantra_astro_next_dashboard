import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { generateOtp, sendOtpSms } from '@/lib/msg91';
import { normalizePhone } from '@/lib/utils';

const bodySchema = z.object({ phone: z.string().min(10).max(20) });

async function hashOtp(otp: string) {
  const data = new TextEncoder().encode(otp);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Web LMS checkout: send OTP to any phone (no login/register gate — the buyer
// may be a new or existing customer). Reuses the same OTP store as the app.
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Enter a valid mobile number' }, { status: 400 });

  const phoneE164 = normalizePhone(parsed.data.phone);

  const lastMinute = new Date(Date.now() - 60 * 1000);
  const recent = await prisma.appOtpCode.findFirst({ where: { phone: phoneE164, createdAt: { gte: lastMinute } } });
  if (recent) {
    return NextResponse.json({ error: 'Please wait 60 seconds before requesting another OTP.' }, { status: 429 });
  }

  const testPhones = process.env.TEST_PHONE_NUMBERS?.split(',') ?? [];
  if (testPhones.includes(phoneE164)) {
    return NextResponse.json({ ok: true });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
  try {
    await sendOtpSms(phoneE164, otp);
    await prisma.appOtpCode.create({ data: { phone: phoneE164, codeHash: await hashOtp(otp), expiresAt, usedAt: null } });
  } catch (e) {
    const detail = e instanceof Error ? e.message : 'provider error';
    return NextResponse.json({ error: 'Could not send OTP', detail }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
