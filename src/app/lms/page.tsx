import { prisma } from '@/lib/prisma';
import { LmsCourseCard, type LmsCourse } from '@/components/lms-course-card';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Thantra Astro — Learn Vedic astrology in Telugu',
  description: 'Buy structured Vedic astrology video courses. Watch them in the Thantra Astro iOS app.',
};

function toAbsolute(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  return url.startsWith('/') ? `${base}${url}` : url;
}

export default async function LmsPage() {
  const [categories, videos] = await Promise.all([
    prisma.category.findMany({
      where: { checkoutAmountCents: { gt: 0 } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, thumbnailUrl: true, checkoutAmountCents: true, _count: { select: { videos: true } } },
    }),
    prisma.video.findMany({
      where: { published: true, isFree: false, checkoutAmountCents: { gt: 0 } },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, subtitle: true, thumbnailUrl: true, checkoutAmountCents: true, language: true, lessons: true },
    }),
  ]);

  const packCourses: LmsCourse[] = categories.map((c) => ({
    kind: 'category',
    id: c.id,
    title: `${c.name} — full pack`,
    subtitle: `${c._count.videos} lessons · Telugu`,
    priceRupees: Math.round(c.checkoutAmountCents / 100),
    thumbnailUrl: toAbsolute(c.thumbnailUrl),
  }));

  const videoCourses: LmsCourse[] = videos.map((v) => ({
    kind: 'video',
    id: v.id,
    title: v.title,
    subtitle: `${v.lessons} lessons · ${v.language}`,
    priceRupees: Math.round(v.checkoutAmountCents / 100),
    thumbnailUrl: toAbsolute(v.thumbnailUrl),
  }));

  return (
    <main className="min-h-[100dvh] bg-[#1c0410] font-sans text-amber-50">
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-lg font-bold text-[#2a0512]">✦</div>
            <div>
              <div className="text-base font-semibold">Thantra Astro</div>
              <div className="text-xs text-amber-100/60">Learn Vedic astrology in Telugu</div>
            </div>
          </div>
          <span className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs text-amber-100/80">
            Download the app on iPhone
          </span>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ['1. Buy here', 'Pay for your course on this website.'],
            ['2. Open the app', 'Download Thantra Astro on iPhone.'],
            ['3. Sign in & watch', 'Log in with the same mobile number.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-amber-500/20 bg-[#2a0512] p-4">
              <div className="text-sm font-semibold text-amber-300">{t}</div>
              <div className="mt-1 text-xs text-amber-100/60">{d}</div>
            </div>
          ))}
        </section>

        {packCourses.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-sm text-amber-100/70">Course packs</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packCourses.map((c) => (
                <LmsCourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        ) : null}

        {videoCourses.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 text-sm text-amber-100/70">Individual courses</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videoCourses.map((c) => (
                <LmsCourseCard key={c.id} course={c} />
              ))}
            </div>
          </section>
        ) : null}

        {packCourses.length === 0 && videoCourses.length === 0 ? (
          <p className="mt-10 text-center text-sm text-amber-100/50">Courses will appear here soon.</p>
        ) : null}

        <div className="mt-8 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-[#2a0512] p-4 text-xs text-amber-100/70">
          <span>
            Videos don&apos;t play on this website. After payment, open the Thantra Astro app and sign in with the same
            mobile number to watch your course.
          </span>
        </div>
      </div>
    </main>
  );
}
