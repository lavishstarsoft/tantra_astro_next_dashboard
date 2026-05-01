import { prisma } from '@/lib/prisma';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; session_id?: string }>;
}) {
  const sp = await searchParams;
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          Stripe Checkout completions appear here via webhook. Run{' '}
          <code className="rounded bg-slate-100 px-1 text-slate-700">stripe listen --forward-to localhost:3000/api/webhooks/stripe</code>{' '}
          while testing locally.
        </p>
        {sp.paid ? (
          <p className="mt-2 text-sm text-emerald-600">
            Payment flow returned. Session: {sp.session_id ?? '—'}
          </p>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Stripe session</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No orders yet. Use “Copy Stripe checkout link” on a video or category row after configuring{' '}
                  <code className="text-sky-600">STRIPE_SECRET_KEY</code>.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">{o.createdAt.toISOString().slice(0, 19)}</td>
                  <td className="px-4 py-3 text-slate-700">{o.customerEmail}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {(o.amountTotalCents / 100).toLocaleString('en-IN', {
                      style: 'currency',
                      currency: o.currency.toUpperCase(),
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {o.stripeSessionId ? `${o.stripeSessionId.slice(0, 18)}…` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
