'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function UserRoleSwitcher({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) return;
    
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Failed to update role');
      }
      
      toast.success(`Role updated to ${newRole}`);
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not update role';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <select
        disabled={loading}
        value={currentRole}
        onChange={(e) => handleRoleChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none disabled:opacity-50"
      >
        <option value="USER">Standard User</option>
        <option value="SUPER_ADMIN">Super Admin</option>
      </select>
      {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />}
    </div>
  );
}
