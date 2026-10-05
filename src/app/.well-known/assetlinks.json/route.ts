import { NextResponse } from 'next/server';

// Android App Links verification (Digital Asset Links) for the Thantra Astro app.
//
// package_name MUST match the app's applicationId exactly:
//   android/app/build.gradle.kts → applicationId = "com.lavish1.astrolearn"
//
// FINGERPRINTS: the SHA-256 of every certificate that signs a delivered build.
// With Play App Signing you need the "App signing key certificate" SHA-256
// (Play Console → Test and release → App integrity → App signing). Add the
// "Upload key certificate" SHA-256 too so debug/internal installs also verify.
// These are public values (not secrets), so they are safe to hardcode here;
// ANDROID_APP_CERT_SHA256 (comma-separated) overrides them if ever set.
const PACKAGE_NAME = 'com.lavish1.astrolearn';

const DEFAULT_FINGERPRINTS: string[] = [
  // Play App signing key (Play Console → App signing) — the cert Google re-signs
  // the delivered app with. REQUIRED for App Links on Play Store installs.
  'C8:F2:AA:44:68:6A:29:EC:85:D9:84:91:6C:C3:2C:AE:54:26:DA:2D:AC:74:06:6B:47:37:2B:F2:66:A7:62:88',
  // Upload key (android/app/upload-keystore.jks) — covers internal/sideload
  // builds signed with the upload key.
  '84:03:A6:B8:86:46:B7:B3:60:B8:02:D2:61:2F:41:17:32:16:44:34:0F:EF:7B:44:AA:44:3E:72:08:D6:19:B1',
];

const FINGERPRINTS = (process.env.ANDROID_APP_CERT_SHA256 ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const sha256CertFingerprints = FINGERPRINTS.length > 0 ? FINGERPRINTS : DEFAULT_FINGERPRINTS;

export function GET() {
  return NextResponse.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: PACKAGE_NAME,
        sha256_cert_fingerprints: sha256CertFingerprints,
      },
    },
  ]);
}
