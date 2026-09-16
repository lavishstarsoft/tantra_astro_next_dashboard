import { NextResponse } from 'next/server';

// Android App Links verification for the Thantra Astro app.
// package: com.lavish.astrolearn
// IMPORTANT: replace the fingerprint below with your app's SHA-256 signing
// certificate from Play Console → App integrity → "App signing key certificate".
const SHA256 = process.env.ANDROID_APP_CERT_SHA256 || 'REPLACE_WITH_SHA256_FROM_PLAY_CONSOLE';

export function GET() {
  return NextResponse.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.lavish.astrolearn',
        sha256_cert_fingerprints: [SHA256],
      },
    },
  ]);
}
