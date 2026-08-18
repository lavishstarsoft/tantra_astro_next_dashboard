import { prisma } from '@/lib/prisma';
import { DeletionRequestActions } from '@/components/deletion-request-actions';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-rose-100 text-rose-700',
  REJECTED: 'bg-slate-100 text-slate-600',
};

export default async function DeletionRequestsPage() {
  const requests = await prisma.accountDeletionRequest.findMany({
    orderBy: { createdAt: 'desc' },
  });
  const pending = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Account Deletion Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            App users requesting permanent account deletion. Approve to run final deletion, Reject to preserve.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          Pending: {pending}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email / Mobile</th>
              <th className="px-4 py-3">User ID</th>
              <th className="px-4 py-3">Requested At</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  No deletion requests.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.userName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{r.userEmail}</div>
                    <div className="text-xs text-slate-400">{r.userPhone}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.userId}</td>
                  <td className="px-4 py-3 text-slate-600">{r.createdAt.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[r.status] ?? ''}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'PENDING' ? (
                      <DeletionRequestActions id={r.id} />
                    ) : (
                      <span className="text-xs text-slate-400">
                        {r.reviewedAt ? r.reviewedAt.toLocaleString('en-IN') : '—'}
                      </span>
                    )}
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
