import { NextResponse } from 'next/server';

import { prisma } from '@/lib/prisma';
import { verifyAppAccessToken } from '@/lib/app-jwt';

export async function requireAppUser(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : null;
  if (!token) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  const payload = await verifyAppAccessToken(token);
  if (!payload) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  // Enforce single-device login: access token must match a non-revoked session.
  const session = await prisma.appSession.findUnique({
    where: { userId_deviceId: { userId: payload.sub, deviceId: payload.deviceId } },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  const user = await prisma.appUser.findUnique({ where: { id: payload.sub } });
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { ok: true as const, payload, user };
}

