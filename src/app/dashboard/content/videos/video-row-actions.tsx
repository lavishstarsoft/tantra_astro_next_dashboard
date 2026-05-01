'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type VideoRowActionsProps = {
  id: string;
  published: boolean;
};

export function VideoRowActions({ id, published }: VideoRowActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updatePublished(nextPublished: boolean) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: nextPublished }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? 'Status update failed');
        return;
      }
      router.refresh();
    } catch {
      alert('Status update failed');
    } finally {
      setLoading(false);
    }
  }

  async function deleteVideo() {
    if (!confirm('Delete this video? This cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        alert(data.error ?? 'Delete failed');
        return;
      }
      router.refresh();
    } catch {
      alert('Delete failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        title={published ? 'Set Inactive' : 'Set Active'}
        aria-label={published ? 'Set Inactive' : 'Set Active'}
        disabled={loading}
        onClick={() => void updatePublished(!published)}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md border text-sm font-semibold ${
          published
            ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
            : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
        } disabled:cursor-not-allowed disabled:opacity-60`}>
        {published ? '⏸️' : '▶️'}
      </button>
      <button
        type="button"
        title="Delete"
        aria-label="Delete"
        disabled={loading}
        onClick={() => void deleteVideo()}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-300 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60">
        🗑️
      </button>
    </div>
  );
}
