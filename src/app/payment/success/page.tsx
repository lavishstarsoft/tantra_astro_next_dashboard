import { Suspense } from 'react';

import { PaymentReturnClient } from './payment-return-client';

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F172A] font-sans selection:bg-rose-500/30">
          <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 pt-24 pb-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E293B] border border-slate-700 shadow-xl">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-500/40 border-t-slate-200" />
            </div>
            <h1 className="text-xl font-semibold text-white">Preparing redirect…</h1>
          </div>
        </div>
      }>
      <PaymentReturnClient />
    </Suspense>
  );
}
