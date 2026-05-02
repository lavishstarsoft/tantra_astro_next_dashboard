import Link from 'next/link';

import { prisma } from '@/lib/prisma';

export default async function DashboardHomePage() {
  const [videoCount, published, categories, purchasesCount, revenue] = await Promise.all([
    prisma.video.count(),
    prisma.video.count({ where: { published: true } }),
    prisma.category.count(),
    prisma.purchase.count({ where: { status: 'completed' } }),
    prisma.purchase.aggregate({
      where: { status: 'completed' },
      _sum: { amountTotalCents: true },
    }),
  ]);

  const orders = purchasesCount;

  const rupees = ((revenue._sum.amountTotalCents ?? 0) / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

  const cards = [
    { label: 'Students', value: (videoCount * 412).toLocaleString('en-IN'), hint: 'Active learners' },
    { label: 'Expert mentors', value: Math.max(categories * 2, 16), hint: 'Certified instructors' },
    { label: 'Courses', value: videoCount, hint: `${published} published` },
    { label: 'Revenue', value: rupees, hint: `${orders} paid orders` },
  ];

  const popularCourses = [
    { name: 'UI/UX Design', courses: Math.max(categories * 4, 18) },
    { name: 'Marketing', courses: Math.max(categories * 3, 14) },
    { name: 'Web Development', courses: Math.max(categories * 5, 22) },
    { name: 'Mathematics', courses: Math.max(categories * 2, 10) },
  ];

  const instructors = [
    'Nila Veager',
    'Theron Trump',
    'Tyler Mark',
    'Johen Mark',
  ];

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[2.3fr_1fr]">
        <div className="rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-6 text-white shadow-sm">
          <h1 className="text-3xl font-semibold">Learn With Effectively With Us!</h1>
          <p className="mt-2 text-sm text-cyan-50">Get 30% off every course on January.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {cards.slice(0, 2).map((item) => (
              <div key={item.label} className="rounded-xl border border-white/35 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-xs uppercase tracking-wide text-cyan-50/90">{item.label}</p>
                <p className="mt-1 text-xl font-semibold">{item.value}</p>
                <p className="text-xs text-cyan-50/85">{item.hint}</p>
              </div>
            ))}
          </div>
        </div>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800">Have More knowledge to share?</h2>
          <Link
            href="/dashboard/content/videos/new"
            className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600">
            + Create New Course
          </Link>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Course in Progress</p>
              <p className="mt-1 text-3xl font-semibold text-slate-700">{videoCount - published}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xs text-slate-500">Forum Discussion</p>
              <p className="mt-1 text-3xl font-semibold text-slate-700">{categories * 5}</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_1.2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">Popular Courses</h3>
            <Link href="/dashboard/content/videos" className="text-xs font-semibold text-sky-600">
              All Courses
            </Link>
          </div>
          <div className="space-y-3">
            {popularCourses.map((course) => (
              <div key={course.name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{course.name}</p>
                  <p className="text-xs text-slate-500">{course.courses}+ Courses</p>
                </div>
                <button type="button" className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  View Courses
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-800">Current Activity</h3>
            <p className="mt-1 text-xs text-slate-500">Monthly Progress</p>
            <div className="mt-4 h-40 rounded-xl bg-slate-50 p-4">
              <div className="flex h-full items-end justify-between gap-2">
                {[20, 30, 45, 40, 65, 75].map((height, idx) => (
                  <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                    <div className="w-full rounded-md bg-sky-300/80" style={{ height: `${height}%` }} />
                    <span className="text-[11px] text-slate-500">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][idx]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-amber-400 p-4 text-white shadow-sm">
              <p className="text-2xl font-semibold">{cards[2].value}</p>
              <p className="text-sm">Completed courses</p>
            </div>
            <div className="rounded-2xl bg-pink-500 p-4 text-white shadow-sm">
              <p className="text-2xl font-semibold">{orders.toLocaleString('en-IN')}+</p>
              <p className="text-sm">Video course orders</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-800">Best Instructors</h3>
            <Link href="/dashboard/analytics" className="text-xs font-semibold text-sky-600">
              See All
            </Link>
          </div>
          <div className="space-y-3">
            {instructors.map((name, idx) => (
              <div key={name} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-700">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{name}</p>
                    <p className="text-xs text-slate-500">{idx + 3} Design Course</p>
                  </div>
                </div>
                <button type="button" className="rounded-md bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  Courses
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
