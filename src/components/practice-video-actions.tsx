'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PracticeVideoActions({
  videoId,
  practiceEnabled,
}: {
  videoId: string;
  practiceEnabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/practice/videos/${videoId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practiceEnabled: !practiceEnabled }),
      });
      if (!res.ok) {
        alert('Update failed');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <button
        disabled={loading}
        onClick={toggle}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${
          practiceEnabled ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
        }`}>
        {practiceEnabled ? 'Disable' : 'Enable'}
      </button>
      <Link
        href={`/dashboard/practice/${videoId}`}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
        Manage Questions
      </Link>
    </div>
  );
}
