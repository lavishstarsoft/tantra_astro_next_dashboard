'use client';

import { useRouter } from 'next/navigation';

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50"
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        router.replace('/login');
        router.refresh();
      }}>
      Sign out
    </button>
  );
}
