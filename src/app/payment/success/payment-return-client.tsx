'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

export function PaymentReturnClient() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? 'success';
  const appScheme = useMemo(
    () => (process.env.NEXT_PUBLIC_APP_SCHEME ?? '').replace(/:\/\//, ''),
    []
  );
  const target = useMemo(
    () =>
      appScheme
        ? `${appScheme}://payment/success?status=${encodeURIComponent(status)}`
        : '',
    [appScheme, status]
  );

  useEffect(() => {
    if (!target) return;
    const timer = window.setTimeout(() => {
      window.location.href = target;
    }, 100);
    return () => window.clearTimeout(timer);
  }, [target]);

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans selection:bg-rose-500/30">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 pt-24 pb-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E293B] border border-slate-700 shadow-xl">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-500/40 border-t-slate-200" />
        </div>
        {target ? (
          <>
            <h1 className="text-xl font-semibold text-white">Redirecting to app…</h1>
            <p className="text-sm text-slate-400">If the app doesn’t open automatically, tap below.</p>
            <a
              href={target}
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white">
              Open Thantra Astro
            </a>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-white">App link not configured</h1>
            <p className="text-sm text-slate-400">
              Set <span className="font-semibold text-slate-200">NEXT_PUBLIC_APP_SCHEME</span> in the
              dashboard env and redeploy.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
