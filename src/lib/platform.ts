import { NextResponse } from 'next/server';

/**
 * Practice & Master is an iOS-only feature. The app sends `X-Client-Platform`.
 * This is enforced API-side so the Android app flow never receives quiz data.
 */
export function isIosRequest(req: Request): boolean {
  const platform = (req.headers.get('x-client-platform') ?? '').toLowerCase();
  return platform === 'ios';
}

export function requireIos(req: Request) {
  if (!isIosRequest(req)) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Not available on this platform' }, { status: 403 }),
    };
  }
  return { ok: true as const };
}
