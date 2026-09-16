import { getAnalyticsMetrics, toRupees } from '@/lib/dashboard-metrics';
import { AreaChart, BarChart, Donut } from '@/components/dashboard/charts';
import { List, Panel, PageHeader, StatCard } from '@/components/dashboard/ui';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const a = await getAnalyticsMetrics();

  const genderData = [
    { label: 'Male', value: a.genderCounts.Male, color: '#6366f1' },
    { label: 'Female', value: a.genderCounts.Female, color: '#ec4899' },
    { label: 'Other / NA', value: a.genderCounts.Other, color: '#cbd5e1' },
  ];
  const completionData = [
    { label: 'Completed', value: a.completion.completed, color: '#10b981' },
    { label: 'In progress', value: a.completion.inProgress, color: '#e2e8f0' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        subtitle="Real-time engagement, revenue, and audience insights across the platform."
        action={<span className="chip bg-brand-50 text-brand-700">Live data</span>}
      />

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Users" value={a.userCount.toLocaleString('en-IN')} tone="brand" icon={<Dot />} hint="All registered app users" />
        <StatCard label="Paying Users" value={a.payingUsers.toLocaleString('en-IN')} tone="emerald" icon={<Dot />} hint={`${a.conversionRate}% conversion`} />
        <StatCard label="Total Revenue" value={toRupees(a.revenueCents)} tone="violet" icon={<Dot />} hint={`${a.orders} completed orders`} />
        <StatCard label="Avg Order Value" value={toRupees(a.avgOrderCents)} tone="amber" icon={<Dot />} hint="Per completed order" />
      </section>

      {/* Growth + gender */}
      <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel title="User Growth" action={<span className="chip bg-slate-100 text-slate-500">Cumulative · 12 months</span>}>
          <AreaChart data={a.cumulativeUsers} height={250} stroke="#6366f1" fill="rgba(99,102,241,0.12)" />
        </Panel>
        <Panel title="Audience by Gender">
          <div className="flex h-full items-center justify-center py-4">
            <Donut data={genderData} />
          </div>
        </Panel>
      </section>

      {/* Revenue + states */}
      <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel title="Monthly Revenue" action={<span className="chip bg-emerald-50 text-emerald-600">12 months</span>}>
          <BarChart data={a.revenue12} height={230} color="#10b981" formatValue={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))} />
        </Panel>
        <Panel title="Top States">
          <List
            items={a.topStates}
            empty="No location data yet."
            render={(s) => {
              const max = Math.max(...a.topStates.map((x) => x.value), 1);
              return (
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{s.label}</span>
                    <span className="text-ink-soft">{s.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(s.value / max) * 100}%` }} />
                  </div>
                </div>
              );
            }}
          />
        </Panel>
      </section>

      {/* Completion + quiz + categories */}
      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Course Completion">
          {a.completion.tracked > 0 ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <Donut data={completionData} size={150} />
              <p className="text-xs text-ink-soft">{a.completion.rate}% of {a.completion.tracked} tracked sessions completed</p>
            </div>
          ) : (
            <Empty text="No watch progress recorded yet." />
          )}
        </Panel>

        <Panel title="Practice & Master">
          <div className="flex h-full flex-col items-center justify-center gap-3 py-6">
            <Radial value={a.quiz.attempts > 0 ? a.quiz.accuracy : 0} />
            <div className="text-center">
              <p className="text-sm font-semibold text-ink">Avg Quiz Accuracy</p>
              <p className="text-xs text-ink-soft">{a.quiz.attempts.toLocaleString('en-IN')} attempts recorded</p>
            </div>
          </div>
        </Panel>

        <Panel title="Courses per Category">
          {a.categories.length > 0 ? (
            <BarChart data={a.categories} height={200} color="#8b5cf6" />
          ) : (
            <Empty text="No categories yet." />
          )}
        </Panel>
      </section>

      {/* Revenue by kind */}
      <Panel title="Revenue by Product Type">
        <div className="grid gap-4 sm:grid-cols-2">
          {a.revenueByKind.length === 0 && <Empty text="No sales yet." />}
          {a.revenueByKind.map((k) => (
            <div key={k.kind} className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3">
              <div>
                <p className="text-sm font-semibold capitalize text-ink">{k.kind === 'video' ? 'Individual Courses' : 'Category Packs'}</p>
                <p className="text-xs text-ink-soft">{k.count} orders</p>
              </div>
              <p className="text-lg font-bold text-emerald-600">{toRupees(k.revenueCents)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-2 py-10 text-center">
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

function Dot() {
  return <span className="h-2.5 w-2.5 rounded-full bg-current" />;
}

/** Radial progress ring for a single percentage. */
function Radial({ value }: { value: number }) {
  const r = 46;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg viewBox="0 0 120 120" width={128} height={128}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#eef2f7" strokeWidth={12} />
      <circle
        cx="60"
        cy="60"
        r={r}
        fill="none"
        stroke="#6366f1"
        strokeWidth={12}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ - dash}`}
        transform="rotate(-90 60 60)"
      />
      <text x="60" y="58" textAnchor="middle" fontSize="26" fontWeight="700" fill="#0f172a">
        {value}%
      </text>
      <text x="60" y="76" textAnchor="middle" fontSize="10" fill="#94a3b8">
        accuracy
      </text>
    </svg>
  );
}
