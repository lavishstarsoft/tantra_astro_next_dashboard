'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PracticeGlobalToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/practice/config', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ practiceMasterEnabled: !enabled }),
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
    <button
      disabled={loading}
      onClick={toggle}
      className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
        enabled ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-400 hover:bg-slate-500'
      }`}>
      {enabled ? 'Practice & Master: ON' : 'Practice & Master: OFF'}
    </button>
  );
}
