import { prisma } from '@/lib/prisma';

export default async function OrdersPage() {
  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: true },
  });

  // Resolve target names
  const videoIds = purchases.filter((p) => p.kind === 'video').map((p) => p.targetId);
  const categoryIds = purchases.filter((p) => p.kind === 'category').map((p) => p.targetId);

  const [videos, categories] = await Promise.all([
    prisma.video.findMany({
      where: { id: { in: videoIds } },
      select: { id: true, title: true },
    }),
    prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    }),
  ]);

  const nameMap = new Map<string, string>();
  videos.forEach((v) => nameMap.set(v.id, v.title));
  categories.forEach((c) => nameMap.set(c.id, c.name));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Purchases</h1>
        <p className="mt-1 text-sm text-slate-500">
          Razorpay payment completions appear here. Status updates happen via verification flow.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No purchases found yet.
                </td>
              </tr>
            ) : (
              purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600">
                    {p.createdAt instanceof Date ? p.createdAt.toISOString().slice(0, 10) : '—'}
                    <br />
                    <span className="text-[10px] opacity-50">
                      {p.createdAt instanceof Date ? p.createdAt.toISOString().slice(11, 19) : ''}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-700">{p.user?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-slate-500">{p.user?.email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-semibold">
                    {(p.amountTotalCents / 100).toLocaleString('en-IN', {
                      style: 'currency',
                      currency: (p.currency || 'INR').toUpperCase(),
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-600'
                          : p.status === 'pending'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-rose-50 text-rose-600'
                      }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-600 uppercase tracking-tight">{p.kind}</p>
                    <p className="text-xs font-semibold text-sky-700 truncate max-w-[150px]">
                      {nameMap.get(p.targetId) ?? 'Unknown Item'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.targetId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-[10px] text-slate-500 font-mono">{p.razorpayOrderId ?? '—'}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{p.razorpayPaymentId ?? ''}</p>
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
