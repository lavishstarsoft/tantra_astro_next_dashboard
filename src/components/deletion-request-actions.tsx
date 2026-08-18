'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function DeletionRequestActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function act(action: 'APPROVE' | 'REJECT') {
    const msg =
      action === 'APPROVE'
        ? 'Approve deletion? This permanently deletes the user and their data.'
        : 'Reject this deletion request? The account will be preserved.';
    if (!confirm(msg)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/deletion-requests/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? 'Action failed');
        return;
      }
      router.refresh();
    } catch {
      alert('Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={() => act('APPROVE')}
        className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
        Approve
      </button>
      <button
        disabled={loading}
        onClick={() => act('REJECT')}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
        Reject
      </button>
    </div>
  );
}
