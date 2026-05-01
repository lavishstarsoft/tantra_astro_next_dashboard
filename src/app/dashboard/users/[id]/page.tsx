import Link from 'next/link';
import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function formatAmount(paise: number, currency: string) {
  return (paise / 100).toLocaleString('en-IN', {
    style: 'currency',
    currency: currency.toUpperCase(),
  });
}

function formatDateOnly(value: Date | null | undefined) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-IN');
}

export default async function RegisteredUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await prisma.appUser.findUnique({
    where: { id },
    include: {
      purchases: {
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
      paymentSessions: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!user) {
    notFound();
  }

  const completedCount = user.purchases.filter((p) => p.status === 'completed').length;
  const totalRevenuePaise = user.purchases
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amountTotalCents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{user.name}</h1>
          <p className="mt-1 text-sm text-slate-500">Registered app user profile and purchase history.</p>
        </div>
        <Link
          href="/dashboard/users"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          Back to users
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">User ID</p>
          <p className="mt-2 break-all font-mono text-xs text-slate-700">{user.id}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{user.phone}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
          <p className="mt-2 truncate text-sm font-semibold text-slate-700">{user.email}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed Purchases</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{completedCount}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Revenue</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{formatAmount(totalRevenuePaise, 'INR')}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date Of Birth</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{formatDateOnly(user.dateOfBirth)}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gender</p>
          <p className="mt-2 text-sm font-semibold capitalize text-slate-700">{user.gender ?? 'Not set'}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">State</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">{user.state ?? 'Not set'}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-700">Profile Timeline</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-700">Registered:</span>{' '}
            {new Date(user.createdAt).toLocaleString('en-IN')}
          </p>
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-700">Last updated:</span>{' '}
            {new Date(user.updatedAt).toLocaleString('en-IN')}
          </p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-700">Purchases</h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Target ID</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Provider</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {user.purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No purchases yet.
                </td>
              </tr>
            ) : (
              user.purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{new Date(purchase.createdAt).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-slate-700">{purchase.kind}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{purchase.targetId}</td>
                  <td className="px-4 py-3 text-slate-700">{formatAmount(purchase.amountTotalCents, purchase.currency)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        purchase.status === 'completed'
                          ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600'
                          : purchase.status === 'failed'
                            ? 'rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600'
                            : 'rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600'
                      }>
                      {purchase.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{purchase.provider}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-base font-semibold text-slate-700">Recent Payment Sessions</h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Target ID</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Token</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {user.paymentSessions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No payment sessions.
                </td>
              </tr>
            ) : (
              user.paymentSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{new Date(session.createdAt).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-slate-700">{session.kind}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{session.targetId}</td>
                  <td className="px-4 py-3 text-slate-600">{new Date(session.expiresAt).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{session.token.slice(0, 20)}...</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
