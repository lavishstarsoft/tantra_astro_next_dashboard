import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function ShortsLandingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const short = id ? await prisma.shortLesson.findFirst({ where: { id, published: true } }) : null;
  const appDeepLink = id ? `astrolearn://shorts?id=${encodeURIComponent(id)}` : 'astrolearn://';
  const appStore = 'https://apps.apple.com/app/id6780034802';
  const playStore = 'https://play.google.com/store/apps/details?id=com.lavish.astrolearn';

  return (
    <main style={{ minHeight: '100dvh', background: '#1c0410', color: '#fdefe4', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: '#FFD700', color: '#2a0512', fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>✦</div>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 6px' }}>Thantra Astro</h1>
        <p style={{ fontSize: 13, color: 'rgba(253,239,228,0.6)', margin: '0 0 20px' }}>Quick Vedic astrology lessons</p>

        {short ? (
          <div style={{ background: '#2a0512', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ height: 200, background: '#3a0a1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {short.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={short.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 44, color: '#FFD700' }}>▶</span>
              )}
            </div>
            <div style={{ padding: 14, textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{short.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(253,239,228,0.6)', marginTop: 4 }}>{short.teacher} · {short.topic}</div>
            </div>
          </div>
        ) : null}

        <a href={appDeepLink} style={{ display: 'block', background: '#FFD700', color: '#2a0512', fontWeight: 600, fontSize: 15, padding: '13px', borderRadius: 12, textDecoration: 'none', marginBottom: 12 }}>
          ▶ Watch in the app
        </a>
        <div style={{ display: 'flex', gap: 10 }}>
          <a href={appStore} style={{ flex: 1, border: '1px solid rgba(255,215,0,0.3)', color: '#fdefe4', fontSize: 13, padding: '11px', borderRadius: 12, textDecoration: 'none' }}>App Store</a>
          <a href={playStore} style={{ flex: 1, border: '1px solid rgba(255,215,0,0.3)', color: '#fdefe4', fontSize: 13, padding: '11px', borderRadius: 12, textDecoration: 'none' }}>Google Play</a>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(253,239,228,0.45)', marginTop: 20 }}>Open on your phone with the Thantra Astro app installed to watch instantly.</p>
      </div>
    </main>
  );
}
