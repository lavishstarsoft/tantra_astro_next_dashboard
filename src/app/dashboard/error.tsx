'use client';

import { useEffect } from 'react';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface to console for debugging; Sentry also captures it via instrumentation.
    console.error('[dashboard] render error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card w-full max-w-md p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-bold text-ink">Ee page load avvaledu</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Data teppించడంలో problem vachింది. Mostly database connection slow అయ్యింది. Malli try cheyandi.
        </p>
        {error?.digest && <p className="mt-2 text-[11px] text-ink-soft">Ref: {error.digest}</p>}
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={reset} className="btn-primary">
            Retry
          </button>
          <button type="button" onClick={() => window.location.reload()} className="btn-ghost">
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
