import Link from 'next/link';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type UsersSearchParams = {
  page?: string;
  perPage?: string;
  q?: string;
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

export default async function RegisteredUsersPage({
  searchParams,
}: {
  searchParams: Promise<UsersSearchParams>;
}) {
  const sp = await searchParams;
  const perPageRaw = Number(sp.perPage ?? '10') || 10;
  const perPage = perPageRaw === 25 || perPageRaw === 50 ? perPageRaw : 10;
  const currentPage = Math.max(1, Number(sp.page ?? '1') || 1);
  const q = (sp.q ?? '').trim();

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
    ];
  }

  const skip = (currentPage - 1) * perPage;
  const [users, totalCount] = await Promise.all([
    prisma.appUser.findMany({
      where: where as object,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { purchases: true } } },
      take: perPage,
      skip,
    }),
    prisma.appUser.count({ where: where as object }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const prevPage = safePage > 1 ? safePage - 1 : null;
  const nextPage = safePage < totalPages ? safePage + 1 : null;
  const stringParams = Object.fromEntries(
    Object.entries(sp).map(([k, v]) => [k, typeof v === 'string' ? v : undefined])
  ) as Record<string, string | undefined>;
  const exportHref = buildHref('/api/admin/users/export', {
    ...stringParams,
    page: undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Registered Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            Mobile app lo OTP verify chesi register ayina users list.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={exportHref}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Export CSV
          </Link>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
            Total users: {totalCount}
          </div>
        </div>
      </div>

      <form method="get" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-8">
            <label className="text-xs font-medium text-slate-600">Search</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Search name, email, or mobile..."
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-600">Rows</label>
            <select
              name="perPage"
              defaultValue={String(perPage)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
          <div className="flex items-end gap-2 md:col-span-2">
            <button
              type="submit"
              className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">
              Apply
            </button>
            <Link
              href="/dashboard/users"
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Purchases</th>
              <th className="px-4 py-3">Registered At</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-700">{user.name}</td>
                <td className="px-4 py-3 text-slate-600">{user.email}</td>
                <td className="px-4 py-3 text-slate-600">{user.phone}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {user._count.purchases}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{new Date(user.createdAt).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/users/${user.id}`} className="font-medium text-sky-600 hover:text-sky-700">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No registered users found.
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
                ? buildHref('/dashboard/users', {
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
                ? buildHref('/dashboard/users', {
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
