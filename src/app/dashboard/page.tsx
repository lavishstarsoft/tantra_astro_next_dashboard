import Link from 'next/link';

import { getOverviewMetrics, toRupees } from '@/lib/dashboard-metrics';
import { AreaChart, BarChart } from '@/components/dashboard/charts';
import { Avatar, LinkAction, List, Panel, StatCard } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';

function timeAgo(date: Date) {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default async function DashboardHomePage() {
  const m = await getOverviewMetrics();
  const revenueSpark = m.revenueSeries.map((p) => p.value);
  const signupSpark = m.signupSeries.map((p) => p.value);
  const totalRevenue6mo = m.revenueSeries.reduce((s, p) => s + p.value, 0);

  return (
    <div className="space-y-5">
      {/* Hero + KPIs */}
      <section className="grid gap-4 lg:grid-cols-[1.1fr_1.3fr]">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-600 to-violet-600 p-6 text-white shadow-glow">
          <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-6 h-40 w-40 rounded-full bg-violet-400/20 blur-2xl" />
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">Thantra LMS · Admin</p>
          <h2 className="mt-2 text-2xl font-bold leading-snug">Welcome back 👋</h2>
          <p className="mt-1 max-w-sm text-sm text-white/80">
            Meeru manage chestunna platform ki oka quick snapshot. Real-time data below.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/dashboard/content/videos/new" className="btn bg-white text-brand-700 hover:bg-white/90">
              + Create Course
            </Link>
            <Link href="/dashboard/analytics" className="btn border border-white/30 bg-white/10 text-white hover:bg-white/20">
              View Analytics
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Registered Students"
            value={m.totals.users.toLocaleString('en-IN')}
            tone="brand"
            pct={m.trends.users.pct}
            spark={signupSpark}
            hint={`+${m.trends.users.current} in last 30 days`}
            icon={<UsersIcon />}
          />
          <StatCard
            label="Total Revenue"
            value={toRupees(m.totals.revenueCents)}
            tone="emerald"
            pct={m.trends.revenue.pct}
            spark={revenueSpark}
            hint={`${toRupees(m.trends.revenue.current)} last 30 days`}
            icon={<RupeeIcon />}
          />
          <StatCard
            label="Published Courses"
            value={m.totals.published}
            tone="violet"
            hint={`${m.totals.drafts} drafts · ${m.totals.categories} categories`}
            icon={<PlayIcon />}
          />
          <StatCard
            label="Paid Orders"
            value={m.totals.orders.toLocaleString('en-IN')}
            tone="amber"
            pct={m.trends.orders.pct}
            hint={`${m.trends.orders.current} in last 30 days`}
            icon={<CartIcon />}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel
          title="Revenue Overview"
          action={<span className="chip bg-brand-50 text-brand-700">Last 6 months · {toRupees(totalRevenue6mo * 100)}</span>}>
          <AreaChart data={m.revenueSeries} height={240} formatValue={(v) => (v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`)} />
        </Panel>
        <Panel title="New Signups" action={<LinkAction href="/dashboard/users">Users</LinkAction>}>
          <BarChart data={m.signupSeries} height={240} color="#8b5cf6" />
        </Panel>
      </section>

      {/* Lists */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Recent Purchases" action={<LinkAction href="/dashboard/commerce/orders">All orders</LinkAction>} className="xl:col-span-1">
          <List
            items={m.recentPurchases}
            empty="No purchases yet."
            render={(p) => (
              <div className="flex items-center gap-3">
                <Avatar name={p.user?.name ?? '?'} tone="emerald" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{p.user?.name ?? 'Unknown'}</p>
                  <p className="truncate text-xs text-ink-soft">{p.kind} · {timeAgo(p.createdAt)}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">{toRupees(p.amountTotalCents)}</span>
              </div>
            )}
          />
        </Panel>

        <Panel title="Recent Signups" action={<LinkAction href="/dashboard/users">All users</LinkAction>}>
          <List
            items={m.recentUsers}
            empty="No users yet."
            render={(u) => (
              <div className="flex items-center gap-3">
                <Avatar name={u.name} tone="brand" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{u.name}</p>
                  <p className="truncate text-xs text-ink-soft">{u.email}</p>
                </div>
                <span className="chip bg-slate-100 text-slate-500">{timeAgo(u.createdAt)}</span>
              </div>
            )}
          />
        </Panel>

        <Panel title="Top Courses" action={<LinkAction href="/dashboard/content/videos">Manage</LinkAction>}>
          <List
            items={m.topVideos}
            empty="No courses yet."
            render={(v, i) => (
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-sm font-bold text-amber-600">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{v.title}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {v.category.name} · {v.published ? 'Published' : 'Draft'}
                  </p>
                </div>
                <span className="chip bg-amber-50 text-amber-600">★ {v.rating.toFixed(1)}</span>
              </div>
            )}
          />
        </Panel>
      </section>
    </div>
  );
}

/* --- inline icons --- */
function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0" /><circle cx="17.5" cy="9.5" r="2.2" /><path d="M15.5 19a4 4 0 0 1 6-3" />
    </svg>
  );
}
function RupeeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 5h10M7 9h10M15 5c0 4-3 5-6 5l6 8" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M10 9.5v5l4-2.5-4-2.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 7h12l-1 11H7L6 7Z" /><path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}
