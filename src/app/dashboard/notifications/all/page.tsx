import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function formatDateIST(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTimeIST(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getDateKeyIST(date: Date): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD
}

const TYPE_STYLES: Record<string, string> = {
  purchase: 'bg-emerald-100 text-emerald-700',
  offer: 'bg-amber-100 text-amber-700',
  new_content: 'bg-sky-100 text-sky-700',
  general: 'bg-slate-100 text-slate-700',
};

export default async function AllNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string; type?: string }>;
}) {
  const params = await searchParams;
  const filterUser = params.user ?? '';
  const filterType = params.type ?? '';

  // Build where clause
  const where: Record<string, unknown> = {};
  if (filterUser) where.userId = filterUser;
  if (filterType) where.type = filterType;

  const [notifications, users] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: { user: { select: { id: true, name: true, phone: true } } },
    }),
    prisma.appUser.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Group by date
  const grouped = new Map<string, typeof notifications>();
  for (const n of notifications) {
    const key = getDateKeyIST(n.createdAt);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(n);
  }

  const uniqueTypes = [...new Set(notifications.map((n) => n.type))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">All Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link
          href="/dashboard/notifications"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Filter by User
            </label>
            <select
              name="user"
              defaultValue={filterUser}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
              Filter by Type
            </label>
            <select
              name="type"
              defaultValue={filterType}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            >
              <option value="">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 transition-colors"
          >
            Apply
          </button>
          {(filterUser || filterType) && (
            <Link
              href="/dashboard/notifications/all"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Notifications grouped by date */}
      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-lg text-slate-400">No notifications found.</p>
          <p className="mt-1 text-sm text-slate-400">Try adjusting your filters.</p>
        </div>
      ) : (
        [...grouped.entries()].map(([dateKey, items]) => (
          <div key={dateKey} className="space-y-0">
            {/* Date header */}
            <div className="sticky top-0 z-10 rounded-t-2xl border border-b-0 border-slate-200 bg-slate-50 px-6 py-3">
              <h2 className="text-sm font-bold text-slate-700">
                📅 {formatDateIST(items[0].createdAt)}
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {items.length} notification{items.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Notification cards */}
            <div className="rounded-b-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100 overflow-hidden">
              {items.map((n) => (
                <div key={n.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
                      n.type === 'purchase' ? 'bg-emerald-100 text-emerald-600' :
                      n.type === 'offer' ? 'bg-amber-100 text-amber-600' :
                      n.type === 'new_content' ? 'bg-sky-100 text-sky-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {n.type === 'purchase' ? '💰' :
                       n.type === 'offer' ? '🎉' :
                       n.type === 'new_content' ? '🆕' : '🔔'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${TYPE_STYLES[n.type] ?? TYPE_STYLES.general}`}>
                          {n.type}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {formatTimeIST(n.createdAt)}
                        </span>
                      </div>
                      <h3 className="mt-1.5 font-bold text-slate-800 text-sm">{n.title}</h3>
                      <p className="mt-0.5 text-sm text-slate-600 leading-relaxed">{n.body}</p>
                    </div>

                    {/* User badge */}
                    <div className="shrink-0 text-right">
                      <Link
                        href={`/dashboard/notifications/all?user=${n.user.id}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        👤 {n.user.name}
                      </Link>
                      <p className="mt-1 text-[10px] text-slate-400">
                        {n.read ? '✓ Read' : '• Unread'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
