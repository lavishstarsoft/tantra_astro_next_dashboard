import { prisma } from '@/lib/prisma';

/* Shared metric helpers for the admin dashboard. All aggregation that MongoDB
 * cannot express cheaply is done in JS on bounded result sets. */

export type MonthPoint = { label: string; value: number };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Returns the first day of the month, `n` months back from `from` (0 = current month start). */
function monthStart(from: Date, back: number) {
  return new Date(from.getFullYear(), from.getMonth() - back, 1);
}

/** Build `count` month buckets ending with the current month. */
export function monthBuckets(count: number, from = new Date()) {
  const buckets: { label: string; start: Date; end: Date; key: string }[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = monthStart(from, i);
    const end = monthStart(from, i - 1);
    buckets.push({ label: MONTHS[start.getMonth()], start, end, key: `${start.getFullYear()}-${start.getMonth()}` });
  }
  return buckets;
}

export function toRupees(cents: number) {
  return (cents / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

/** % change of `current` vs `previous`, clamped to a readable range. */
export function trend(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export type OverviewMetrics = Awaited<ReturnType<typeof getOverviewMetrics>>;

export async function getOverviewMetrics() {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 864e5);
  const d60 = new Date(now.getTime() - 60 * 864e5);
  const sixMonths = monthStart(now, 5);

  const [
    userCount,
    videoCount,
    publishedCount,
    categoryCount,
    purchaseAgg,
    usersLast30,
    usersPrev30,
    revLast30,
    revPrev30,
    ordersLast30,
    ordersPrev30,
    recentUsers,
    recentPurchases,
    monthlyPurchases,
    monthlyUsers,
    topVideos,
  ] = await Promise.all([
    prisma.appUser.count(),
    prisma.video.count(),
    prisma.video.count({ where: { published: true } }),
    prisma.category.count(),
    prisma.purchase.aggregate({ where: { status: 'completed' }, _sum: { amountTotalCents: true }, _count: true }),
    prisma.appUser.count({ where: { createdAt: { gte: d30 } } }),
    prisma.appUser.count({ where: { createdAt: { gte: d60, lt: d30 } } }),
    prisma.purchase.aggregate({ where: { status: 'completed', createdAt: { gte: d30 } }, _sum: { amountTotalCents: true } }),
    prisma.purchase.aggregate({ where: { status: 'completed', createdAt: { gte: d60, lt: d30 } }, _sum: { amountTotalCents: true } }),
    prisma.purchase.count({ where: { status: 'completed', createdAt: { gte: d30 } } }),
    prisma.purchase.count({ where: { status: 'completed', createdAt: { gte: d60, lt: d30 } } }),
    prisma.appUser.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: { name: true, email: true, createdAt: true, state: true } }),
    prisma.purchase.findMany({ where: { status: 'completed' }, orderBy: { createdAt: 'desc' }, take: 6, include: { user: { select: { name: true, email: true } } } }),
    prisma.purchase.findMany({ where: { status: 'completed', createdAt: { gte: sixMonths } }, select: { amountTotalCents: true, createdAt: true } }),
    prisma.appUser.findMany({ where: { createdAt: { gte: sixMonths } }, select: { createdAt: true } }),
    prisma.video.findMany({ orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }], take: 5, select: { id: true, title: true, rating: true, published: true, category: { select: { name: true } } } }),
  ]);

  const buckets = monthBuckets(6, now);
  const revenueSeries: MonthPoint[] = buckets.map((b) => ({
    label: b.label,
    value: Math.round(
      monthlyPurchases
        .filter((p) => p.createdAt >= b.start && p.createdAt < b.end)
        .reduce((s, p) => s + p.amountTotalCents, 0) / 100
    ),
  }));
  const signupSeries: MonthPoint[] = buckets.map((b) => ({
    label: b.label,
    value: monthlyUsers.filter((u) => u.createdAt >= b.start && u.createdAt < b.end).length,
  }));

  return {
    totals: {
      users: userCount,
      videos: videoCount,
      published: publishedCount,
      drafts: videoCount - publishedCount,
      categories: categoryCount,
      orders: purchaseAgg._count,
      revenueCents: purchaseAgg._sum.amountTotalCents ?? 0,
    },
    trends: {
      users: { current: usersLast30, previous: usersPrev30, pct: trend(usersLast30, usersPrev30) },
      revenue: {
        current: revLast30._sum.amountTotalCents ?? 0,
        previous: revPrev30._sum.amountTotalCents ?? 0,
        pct: trend(revLast30._sum.amountTotalCents ?? 0, revPrev30._sum.amountTotalCents ?? 0),
      },
      orders: { current: ordersLast30, previous: ordersPrev30, pct: trend(ordersLast30, ordersPrev30) },
    },
    revenueSeries,
    signupSeries,
    recentUsers,
    recentPurchases,
    topVideos,
  };
}

export type AnalyticsMetrics = Awaited<ReturnType<typeof getAnalyticsMetrics>>;

export async function getAnalyticsMetrics() {
  const now = new Date();
  const twelveMonths = monthStart(now, 11);

  const [
    userCount,
    payingUserIds,
    purchaseAgg,
    allUsers,
    monthlyPurchases,
    progress,
    quizAgg,
    quizCount,
    categories,
    completedByKind,
  ] = await Promise.all([
    prisma.appUser.count(),
    prisma.purchase.findMany({ where: { status: 'completed' }, distinct: ['userId'], select: { userId: true } }),
    prisma.purchase.aggregate({ where: { status: 'completed' }, _sum: { amountTotalCents: true }, _count: true }),
    prisma.appUser.findMany({ select: { gender: true, state: true, createdAt: true }, take: 5000 }),
    prisma.purchase.findMany({ where: { status: 'completed', createdAt: { gte: twelveMonths } }, select: { amountTotalCents: true, createdAt: true } }),
    prisma.userVideoProgress.findMany({ select: { currentTime: true, duration: true }, take: 5000 }),
    prisma.quizResult.aggregate({ _sum: { correct: true, total: true } }),
    prisma.quizResult.count(),
    prisma.category.findMany({ select: { name: true, _count: { select: { videos: true } } }, orderBy: { sortOrder: 'asc' } }),
    prisma.purchase.groupBy({ by: ['kind'], where: { status: 'completed' }, _sum: { amountTotalCents: true }, _count: true }),
  ]);

  const buckets12 = monthBuckets(12, now);
  const growthSeries: MonthPoint[] = buckets12.map((b) => ({
    label: b.label,
    value: allUsers.filter((u) => u.createdAt >= b.start && u.createdAt < b.end).length,
  }));
  const revenue12: MonthPoint[] = buckets12.map((b) => ({
    label: b.label,
    value: Math.round(
      monthlyPurchases.filter((p) => p.createdAt >= b.start && p.createdAt < b.end).reduce((s, p) => s + p.amountTotalCents, 0) / 100
    ),
  }));

  // Cumulative users over 12 months
  const startingUsers = allUsers.filter((u) => u.createdAt < buckets12[0].start).length;
  let running = startingUsers;
  const cumulativeUsers: MonthPoint[] = buckets12.map((b, i) => {
    running += growthSeries[i].value;
    return { label: b.label, value: running };
  });

  // Gender distribution
  const genderCounts = { Male: 0, Female: 0, Other: 0 };
  for (const u of allUsers) {
    const g = (u.gender ?? '').toLowerCase();
    if (g.startsWith('m')) genderCounts.Male++;
    else if (g.startsWith('f')) genderCounts.Female++;
    else genderCounts.Other++;
  }

  // Top states
  const stateMap = new Map<string, number>();
  for (const u of allUsers) {
    const s = (u.state ?? '').trim();
    if (!s) continue;
    stateMap.set(s, (stateMap.get(s) ?? 0) + 1);
  }
  const topStates: MonthPoint[] = [...stateMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value }));

  // Completion rate from progress (>=90% watched = completed)
  const withDuration = progress.filter((p) => p.duration > 0);
  const completed = withDuration.filter((p) => p.currentTime / p.duration >= 0.9).length;
  const inProgress = withDuration.length - completed;
  const completionRate = withDuration.length > 0 ? Math.round((completed / withDuration.length) * 100) : 0;

  // Quiz performance
  const quizAccuracy =
    (quizAgg._sum.total ?? 0) > 0 ? Math.round(((quizAgg._sum.correct ?? 0) / (quizAgg._sum.total ?? 1)) * 100) : 0;

  const payingUsers = payingUserIds.length;
  const conversionRate = userCount > 0 ? Math.round((payingUsers / userCount) * 100) : 0;
  const avgOrderCents = purchaseAgg._count > 0 ? Math.round((purchaseAgg._sum.amountTotalCents ?? 0) / purchaseAgg._count) : 0;

  return {
    userCount,
    payingUsers,
    conversionRate,
    revenueCents: purchaseAgg._sum.amountTotalCents ?? 0,
    orders: purchaseAgg._count,
    avgOrderCents,
    growthSeries,
    cumulativeUsers,
    revenue12,
    genderCounts,
    topStates,
    completion: { completed, inProgress, rate: completionRate, tracked: withDuration.length },
    quiz: { accuracy: quizAccuracy, attempts: quizCount },
    categories: categories.map((c) => ({ label: c.name, value: c._count.videos })),
    revenueByKind: completedByKind.map((k) => ({
      kind: k.kind,
      revenueCents: k._sum.amountTotalCents ?? 0,
      count: k._count,
    })),
  };
}
