import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';
import { signAppAccessToken, verifyAppRefreshToken } from '@/lib/app-jwt';
import crypto from 'crypto';

const bodySchema = z.object({
  refreshToken: z.string().min(10),
  deviceId: z.string().min(6).max(200),
});

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

  const payload = await verifyAppRefreshToken(parsed.data.refreshToken);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }

  const user = await prisma.appUser.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }

  const session = await prisma.appSession.findUnique({
    where: { userId_deviceId: { userId: user.id, deviceId: parsed.data.deviceId } },
  });
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 401 });
  }
  if (session.revokedAt) {
    return NextResponse.json({ error: 'Session revoked' }, { status: 401 });
  }
  if (session.expiresAt <= new Date()) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }
  if (session.refreshTokenHash !== hashToken(parsed.data.refreshToken)) {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }

  const accessToken = await signAppAccessToken({
    sub: user.id,
    phone: user.phone,
    email: user.email,
    name: user.name,
    deviceId: parsed.data.deviceId,
  });

  return NextResponse.json({ ok: true, accessToken });
}

