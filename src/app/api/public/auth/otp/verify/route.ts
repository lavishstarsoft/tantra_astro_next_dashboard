import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { signAppAccessToken, signAppRefreshToken } from '@/lib/app-jwt';

const bodySchema = z.object({
  phone: z.string().min(10).max(20),
  otp: z.string().min(4).max(10),
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  deviceId: z.string().min(6).max(200).optional(),
});

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 11) return `+91${digits.slice(1)}`;
  if (phone.startsWith('+') && digits.length >= 10) return `+${digits}`;
  return `+${digits}`;
}

function hashOtp(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
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

  const { otp } = parsed.data;
  const phoneE164 = normalizePhone(parsed.data.phone);
  const now = new Date();

  if (process.env.NODE_ENV === 'development') {
    console.log('[otp.verify] incoming', { phoneRaw: parsed.data.phone, phoneNormalized: phoneE164, now });
  }

  const unusedFilter = { OR: [{ usedAt: null }, { usedAt: { isSet: false } }] };

  const activeOtps = await prisma.appOtpCode.findMany({
    where: { phone: phoneE164, ...unusedFilter, expiresAt: { gt: now } },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  if (activeOtps.length === 0) {
    const latestUnused = await prisma.appOtpCode.findFirst({
      where: { phone: phoneE164, ...unusedFilter },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, expiresAt: true },
    });

    if (!latestUnused) {
      const anyCount = await prisma.appOtpCode.count({ where: { phone: phoneE164 } });
      if (process.env.NODE_ENV === 'development') {
        console.log('[otp.verify] not-found', { phoneNormalized: phoneE164, anyCount, now });
      }
      return NextResponse.json(
        {
          error:
            process.env.NODE_ENV === 'development'
              ? `No OTP found for this number. Please request a new OTP. (debug phone=${phoneE164} count=${anyCount})`
              : 'No OTP found for this number. Please request a new OTP.',
          debug:
            process.env.NODE_ENV === 'development'
              ? { phoneNormalized: phoneE164, now: now.toISOString(), anyCount }
              : undefined,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'OTP expired. Please request a new OTP.',
        debug: {
          now: now.toISOString(),
          latestOtpCreatedAt: latestUnused.createdAt.toISOString(),
          latestOtpExpiresAt: latestUnused.expiresAt.toISOString(),
        },
      },
      { status: 401 }
    );
  }

  const otpHash = hashOtp(otp);
  const matchedOtp = activeOtps.find((entry: { codeHash: string; id: string }) => entry.codeHash === otpHash);
  if (!matchedOtp) {
    return NextResponse.json(
      { error: 'Invalid OTP. Please enter the latest OTP sent to your mobile.' },
      { status: 401 }
    );
  }

  await prisma.appOtpCode.update({ where: { id: matchedOtp.id }, data: { usedAt: now } });

  const existing = await prisma.appUser.findUnique({ where: { phone: phoneE164 } });

  if (!existing) {
    if (!parsed.data.name || !parsed.data.email) {
      return NextResponse.json(
        { error: 'Name and email are required for new users', requiresRegistration: true },
        { status: 409 }
      );
    }
  }

  const user = await prisma.appUser.upsert({
    where: { phone: phoneE164 },
    update: {
      name: parsed.data.name ?? undefined,
      email: parsed.data.email?.toLowerCase() ?? undefined,
    },
    create: {
      phone: phoneE164,
      name: parsed.data.name ?? 'User',
      email: (parsed.data.email ?? `${phoneE164.replace(/[^0-9]/g, '')}@example.com`).toLowerCase(),
    },
  });

  const deviceId = parsed.data.deviceId?.trim() || 'unknown-device';
  const accessToken = await signAppAccessToken({
    sub: user.id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    deviceId,
  });
  const refreshToken = await signAppRefreshToken(user.id);
  const refreshTokenHash = hashToken(refreshToken);
  const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Enforce single-device login:
  // - Upsert session for (userId, deviceId)
  // - Revoke all other sessions for this user
  await prisma.$transaction([
    prisma.appSession.upsert({
      where: { userId_deviceId: { userId: user.id, deviceId } },
      update: { refreshTokenHash, expiresAt: refreshExpiresAt, revokedAt: null },
      create: { userId: user.id, deviceId, refreshTokenHash, expiresAt: refreshExpiresAt },
    }),
    prisma.appSession.updateMany({
      where: { userId: user.id, deviceId: { not: deviceId }, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, phone: user.phone, name: user.name, email: user.email },
    accessToken,
    refreshToken,
  });
}

