import Link from 'next/link';
import { Sparkline } from '@/components/dashboard/charts';
import { cn } from '@/lib/utils';

/** Trend pill: green up / red down / neutral. */
export function TrendPill({ pct }: { pct: number }) {
  const up = pct > 0;
  const flat = pct === 0;
  return (
    <span
      className={cn(
        'chip',
        flat ? 'bg-slate-100 text-slate-500' : up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
      )}>
      {!flat && (
        <svg viewBox="0 0 24 24" className={cn('h-3 w-3', !up && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 15l6-6 6 6" />
        </svg>
      )}
      {up ? '+' : ''}
      {pct}%
    </span>
  );
}

const toneMap = {
  brand: { ring: 'bg-brand-50 text-brand-600', spark: '#6366f1' },
  emerald: { ring: 'bg-emerald-50 text-emerald-600', spark: '#10b981' },
  amber: { ring: 'bg-amber-50 text-amber-600', spark: '#f59e0b' },
  violet: { ring: 'bg-violet-50 text-violet-600', spark: '#8b5cf6' },
  rose: { ring: 'bg-rose-50 text-rose-600', spark: '#f43f5e' },
} as const;

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  pct,
  spark,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
  tone?: keyof typeof toneMap;
  pct?: number;
  spark?: number[];
}) {
  const t = toneMap[tone];
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', t.ring)}>{icon}</div>
        {typeof pct === 'number' && <TrendPill pct={pct} />}
      </div>
      <p className="mt-4 text-[13px] font-medium text-ink-muted">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold tracking-tight text-ink">{value}</p>
        {spark && spark.length > 1 && <Sparkline values={spark} color={t.spark} width={92} height={32} />}
      </div>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('card p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="section-title">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function LinkAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} prefetch className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">
      {children}
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  );
}

export function Avatar({ name, tone = 'brand' }: { name: string; tone?: 'brand' | 'violet' | 'emerald' | 'amber' }) {
  const bg = {
    brand: 'bg-brand-100 text-brand-700',
    violet: 'bg-violet-100 text-violet-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
  }[tone];
  return (
    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold', bg)}>
      {(name || '?').slice(0, 2).toUpperCase()}
    </div>
  );
}

/** Compact rows separated by hairlines, with graceful empty state. */
export function List<T>({
  items,
  render,
  empty = 'Nothing here yet.',
}: {
  items: T[];
  render: (item: T, i: number) => React.ReactNode;
  empty?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface-2 py-8 text-center">
        <p className="text-sm text-ink-soft">{empty}</p>
      </div>
    );
  }
  return <div className="divide-y divide-line">{items.map((it, i) => <div key={i} className="py-2.5 first:pt-0 last:pb-0">{render(it, i)}</div>)}</div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
