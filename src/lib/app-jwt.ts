import { SignJWT, jwtVerify } from 'jose';

function getSecret(): Uint8Array {
  const s = process.env.APP_AUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error('APP_AUTH_SECRET (or AUTH_SECRET) must be set (min 16 characters).');
  }
  return new TextEncoder().encode(s);
}

export type AppAccessTokenPayload = {
  sub: string; // appUserId
  phone: string;
  email: string;
  name: string;
  deviceId: string;
  typ: 'access';
};

export type AppRefreshTokenPayload = {
  sub: string;
  typ: 'refresh';
};

export async function signAppAccessToken(payload: Omit<AppAccessTokenPayload, 'typ'>): Promise<string> {
  return new SignJWT({
    phone: payload.phone,
    email: payload.email,
    name: payload.name,
    deviceId: payload.deviceId,
    typ: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(getSecret());
}

export async function signAppRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ typ: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());
}

export async function verifyAppAccessToken(token: string): Promise<AppAccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (payload.typ !== 'access') return null;
    if (typeof payload.sub !== 'string') return null;
    const phone = typeof payload.phone === 'string' ? payload.phone : null;
    const email = typeof payload.email === 'string' ? payload.email : null;
    const name = typeof payload.name === 'string' ? payload.name : null;
    const deviceId = typeof payload.deviceId === 'string' ? payload.deviceId : null;
    if (!phone || !email || !name || !deviceId) return null;
    return { sub: payload.sub, phone, email, name, deviceId, typ: 'access' };
  } catch {
    return null;
  }
}

export async function verifyAppRefreshToken(token: string): Promise<AppRefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256' ] });
    if (payload.typ !== 'refresh') return null;
    if (typeof payload.sub !== 'string') return null;
    return { sub: payload.sub, typ: 'refresh' };
  } catch {
    return null;
  }
}

