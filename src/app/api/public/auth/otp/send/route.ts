import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { generateOtp, sendOtpSms } from '@/lib/msg91';

export const runtime = 'edge';

const bodySchema = z.object({
  phone: z.string().min(10).max(20),
  purpose: z.enum(['login', 'register']).optional(),
});

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`;
  if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return `+${digits}`;
}

async function hashOtp(otp: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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

  const phoneE164 = normalizePhone(parsed.data.phone);
  const purpose = parsed.data.purpose ?? 'login';

  // Rate Limiting: Check if an OTP was sent to this phone in the last 60 seconds
  const lastMinute = new Date(Date.now() - 60 * 1000);
  const recentOtp = await prisma.appOtpCode.findFirst({
    where: {
      phone: phoneE164,
      createdAt: { gte: lastMinute },
    },
  });

  if (recentOtp) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait 60 seconds before requesting another OTP.' },
      { status: 429 }
    );
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

  // Razorpay Approval Bypass: Use environment variables instead of hardcoded numbers
  const testPhones = process.env.TEST_PHONE_NUMBERS?.split(',') || [];
  if (testPhones.includes(phoneE164)) {
    return NextResponse.json({ ok: true, debug: 'Static bypass active' });
  }

  const existingUser = await prisma.appUser.findUnique({ where: { phone: phoneE164 } });
  if (purpose === 'login' && !existingUser) {
    return NextResponse.json(
      { error: 'User not registered', requiresRegistration: true },
      { status: 409 }
    );
  }
  if (purpose === 'register' && existingUser) {
    return NextResponse.json(
      { error: 'User already exists', requiresLogin: true },
      { status: 409 }
    );
  }


  try {
    await sendOtpSms(phoneE164, otp);
    const created = await prisma.appOtpCode.create({
      data: {
        phone: phoneE164,
        codeHash: await hashOtp(otp),
        expiresAt,
        usedAt: null,
      },
    });
    if (process.env.NODE_ENV === 'development') {
      console.log('[otp.send] saved', {
        phone: phoneE164,
        id: created.id,
        expiresAt: created.expiresAt,
        createdAt: created.createdAt,
      });
    }
  } catch (e) {
    console.error(e);
    const detail = e instanceof Error ? e.message : 'Unknown provider error';
    return NextResponse.json({ error: 'Could not send OTP', detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

