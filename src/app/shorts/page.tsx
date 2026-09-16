import type { Metadata } from 'next';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.thantraastro.in').replace(/\/$/, '');

async function getShort(id?: string) {
  if (!id) return null;
  try {
    return await prisma.shortLesson.findFirst({ where: { id, published: true } });
  } catch {
    return null;
  }
}

// Open Graph / Twitter tags so shared short links show a preview image + title
// on WhatsApp, Facebook, X, etc.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<Metadata> {
  const { id } = await searchParams;
  const short = await getShort(id);
  const title = short ? short.title : 'Thantra Astro — Quick lessons';
  const description =
    short?.caption ||
    (short ? `${short.teacher || 'Thantra Astro'} · Quick Vedic astrology lesson` : 'Learn Vedic astrology with quick video lessons.');
  const image = short?.thumbnailUrl || `${BASE}/thantra-logo.png`;
  const url = id ? `${BASE}/shorts?id=${encodeURIComponent(id)}` : `${BASE}/shorts`;

  return {
    title,
    description,
    metadataBase: new URL(BASE),
    openGraph: {
      type: 'video.other',
      title,
      description,
      url,
      siteName: 'Thantra Astro',
      images: [{ url: image, width: 1080, height: 1920, alt: title }],
      ...(short ? { videos: [{ url: short.videoUrl }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function ShortsLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const short = await getShort(id);
  const appDeepLink = id ? `astrolearn://shorts?id=${encodeURIComponent(id)}` : 'astrolearn://';
  const appStore = 'https://apps.apple.com/app/id6780034802';
  const playStore = 'https://play.google.com/store/apps/details?id=com.lavish.astrolearn';

  return (
    <main style={{ minHeight: '100dvh', background: '#1c0410', color: '#fdefe4', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#8F3D66', color: '#fff', fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>✦</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 6px' }}>Thantra Astro</h1>
        <p style={{ fontSize: 13, color: 'rgba(253,239,228,0.6)', margin: '0 0 20px' }}>Quick Vedic astrology lessons</p>

        {short ? (
          <div style={{ background: '#2a0512', border: '1px solid rgba(143,61,102,0.4)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ height: 220, background: '#3a0a1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {short.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={short.thumbnailUrl} alt={short.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 44, color: '#8F3D66' }}>▶</span>
              )}
            </div>
            <div style={{ padding: 14, textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{short.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(253,239,228,0.6)', marginTop: 4 }}>{short.teacher} · {short.topic}</div>
            </div>
          </div>
        ) : null}

        <a href={appDeepLink} style={{ display: 'block', background: '#8F3D66', color: '#fff', fontWeight: 600, fontSize: 15, padding: '13px', borderRadius: 12, textDecoration: 'none', marginBottom: 12 }}>
          ▶ Watch in the app
        </a>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={appStore} style={{ flex: 1, border: '1px solid rgba(143,61,102,0.5)', color: '#fdefe4', fontSize: 13, padding: '11px', borderRadius: 12, textDecoration: 'none' }}>App Store</a>
          <a href={playStore} style={{ flex: 1, border: '1px solid rgba(143,61,102,0.5)', color: '#fdefe4', fontSize: 13, padding: '11px', borderRadius: 12, textDecoration: 'none' }}>Google Play</a>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(253,239,228,0.45)', marginTop: 20 }}>Open with the Thantra Astro app installed to watch instantly.</p>
      </div>
    </main>
  );
}
