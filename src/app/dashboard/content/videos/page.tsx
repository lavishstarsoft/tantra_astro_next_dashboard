import { Suspense } from 'react';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';

import { prisma } from '@/lib/prisma';
import { VideoRowActions } from './video-row-actions';
import { VideosListToast } from './videos-list-toast';

export const dynamic = 'force-dynamic';

type VideosSearchParams = {
  page?: string;
  perPage?: string;
  q?: string;
  category?: string;
  type?: 'all' | 'individual' | 'pack';
  published?: 'all' | 'published' | 'draft';
  from?: string;
  to?: string;
  sort?: 'newest' | 'oldest' | 'title_asc' | 'title_desc';
};

function buildHref(basePath: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function parseDateInput(value?: string) {
  if (!value) return null;
  // expected yyyy-mm-dd
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default async function VideosListPage({
  searchParams,
}: {
  searchParams: Promise<VideosSearchParams>;
}) {
  noStore();
  const sp = await searchParams;
  const perPageRaw = Number(sp.perPage ?? '10') || 10;
  const perPage = perPageRaw === 25 || perPageRaw === 50 ? perPageRaw : 10;
  const currentPage = Math.max(1, Number(sp.page ?? '1') || 1);
  const q = (sp.q ?? '').trim();
  const category = (sp.category ?? '').trim();
  const type = sp.type ?? 'all';
  const published = sp.published ?? 'all';
  const sort = sp.sort ?? 'newest';
  const fromDate = parseDateInput(sp.from);
  const toDate = parseDateInput(sp.to);
  const toDateExclusive = toDate ? new Date(toDate.getTime() + 24 * 60 * 60 * 1000) : null;

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { meta: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (category) {
    where.category = { name: category };
  }
  if (published === 'published') {
    where.published = true;
  } else if (published === 'draft') {
    where.published = false;
  }
  if (type === 'individual') {
    where.packItems = { none: {} };
  } else if (type === 'pack') {
    where.packItems = { some: {} };
  }
  if (fromDate || toDateExclusive) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDateExclusive ? { lt: toDateExclusive } : {}),
    };
  }

  const orderBy =
    sort === 'oldest'
      ? [{ createdAt: 'asc' as const }]
      : sort === 'title_asc'
        ? [{ title: 'asc' as const }]
        : sort === 'title_desc'
          ? [{ title: 'desc' as const }]
          : [{ createdAt: 'desc' as const }];

  const skip = (currentPage - 1) * perPage;

  const [videos, totalCount, categories] = await Promise.all([
    prisma.video.findMany({
      where: where as object,
      include: { category: true, packItems: true },
      orderBy,
      take: perPage,
      skip,
    }),
    prisma.video.count({ where: where as object }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const prevPage = safePage > 1 ? safePage - 1 : null;
  const nextPage = safePage < totalPages ? safePage + 1 : null;
  const activeFiltersCount =
    (q ? 1 : 0) +
    (category ? 1 : 0) +
    (type !== 'all' ? 1 : 0) +
    (published !== 'all' ? 1 : 0) +
    (sp.from ? 1 : 0) +
    (sp.to ? 1 : 0) +
    (sort !== 'newest' ? 1 : 0);

  const stringParams = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, typeof v === 'string' ? v : undefined])
  ) as Record<string, string | undefined>;

  const exportHref = buildHref('/api/admin/videos/export', {
    ...stringParams,
    // export should not depend on current pagination
    page: undefined,
  });

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <VideosListToast />
      </Suspense>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Videos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Edit stream URLs, thumbnails, and publish state. Pack membership controls in-app individual purchase
            rules.
          </p>
          {activeFiltersCount ? (
            <p className="mt-2 text-xs font-semibold text-sky-700">Filters applied: {activeFiltersCount}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={exportHref}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Export CSV
          </Link>
          <Link
            href="/dashboard/content/videos/new"
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">
            New video
          </Link>
        </div>
      </div>

      <form method="get" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-end gap-2">
          <label className="text-xs font-medium text-slate-600">Rows</label>
          <select
            name="perPage"
            defaultValue={String(perPage)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="text-xs font-medium text-slate-600">Search</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search title, subtitle, meta…"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Type</label>
            <select
              name="type"
              defaultValue={type}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="all">All</option>
              <option value="individual">Individual</option>
              <option value="pack">Category pack</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Published</label>
            <select
              name="published"
              defaultValue={published}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Category</label>
            <select
              name="category"
              defaultValue={category}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Sort</label>
            <select
              name="sort"
              defaultValue={sort}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="title_asc">Title A→Z</option>
              <option value="title_desc">Title Z→A</option>
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-medium text-slate-600">From</label>
            <input
              type="date"
              name="from"
              defaultValue={sp.from ?? ''}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div className="md:col-span-3">
            <label className="text-xs font-medium text-slate-600">To</label>
            <input
              type="date"
              name="to"
              defaultValue={sp.to ?? ''}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div className="flex items-end gap-2 md:col-span-6">
            <button
              type="submit"
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">
              Apply
            </button>
            <Link
              href="/dashboard/content/videos"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Reset
            </Link>
          </div>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {videos.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{v.title}</td>
                <td className="px-4 py-3 text-slate-600">{v.category.name}</td>
                <td className="px-4 py-3">
                  {v.packItems.length > 0 ? (
                    <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                      Category pack
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      Individual
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{v.priceLabel}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      v.published
                        ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600'
                        : 'rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600'
                    }>
                    {v.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/content/videos/${v.id}`}
                      title="Edit"
                      aria-label="Edit"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-300 text-sm text-sky-600 hover:bg-sky-50 hover:text-sky-700">
                      ✏️
                    </Link>
                    <VideoRowActions id={v.id} published={v.published} />
                  </div>
                </td>
              </tr>
            ))}
            {videos.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No videos match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Page <span className="font-semibold text-slate-700">{safePage}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalPages}</span>
        </p>
        <div className="flex items-center gap-2">
          <Link
            aria-disabled={!prevPage}
            href={
              prevPage
                ? buildHref('/dashboard/content/videos', {
                    ...stringParams,
                    page: String(prevPage),
                  })
                : '#'
            }
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
              prevPage
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
            }`}>
            Prev
          </Link>
          <Link
            aria-disabled={!nextPage}
            href={
              nextPage
                ? buildHref('/dashboard/content/videos', {
                    ...stringParams,
                    page: String(nextPage),
                  })
                : '#'
            }
            className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
              nextPage
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
            }`}>
            Next
          </Link>
        </div>
      </div>
    </div>
  );
}
