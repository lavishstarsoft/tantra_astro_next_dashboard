'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export function PaymentReturnClient() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? 'success';
  const target = searchParams.get('target') ?? '';
  const kind = searchParams.get('kind') ?? '';
  const isSuccess = status === 'success';
  const [countdown, setCountdown] = useState(3);

  const appScheme = 'astrolearn';

  const deepLink = useMemo(
    () =>
      appScheme
        ? `${appScheme}://payment/success?status=${encodeURIComponent(status)}&target=${encodeURIComponent(target)}&kind=${encodeURIComponent(kind)}`
        : '',
    [appScheme, status, target, kind]
  );

  // Automatic redirect logic
  useEffect(() => {
    if (!deepLink || !isSuccess) return;

    // Countdown timer for UI
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    // Redirect after 3 seconds
    const redirectTimer = setTimeout(() => {
      window.location.replace(deepLink);
      
      // Attempt to close window as a fallback after redirect
      setTimeout(() => {
        try {
          window.close();
        } catch (e) {
          console.log('Auto-close failed', e);
        }
      }, 1000);
    }, 3000);

    return () => {
      clearInterval(countdownTimer);
      clearTimeout(redirectTimer);
    };
  }, [deepLink, isSuccess]);

  return (
    <div className="min-h-screen bg-[#0F172A] font-sans selection:bg-rose-500/30">
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 pt-16 pb-10 text-center">
        {/* Logo */}
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E293B] border border-slate-700 shadow-xl overflow-hidden">
           <img src="/logo.png" alt="Logo" className="h-full w-full object-contain p-2" />
        </div>

        {/* Status Icon */}
        <div className="relative mb-8">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-full border shadow-2xl transition-all duration-700 ${
              isSuccess
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-500'
            }`}>
            {isSuccess ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            )}
          </div>
          {/* Decorative pulse */}
          <div
            className={`absolute inset-0 -z-10 animate-ping rounded-full opacity-20 ${
              isSuccess ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
        </div>

        {/* Text Content */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            {isSuccess ? 'Payment Successful' : 'Payment Failed'}
          </h1>
          <p className="text-base text-slate-400 leading-relaxed max-w-[320px] mx-auto">
            {isSuccess
              ? 'Your transaction was completed successfully. Your content is now available in the app.'
              : 'Something went wrong with your payment. Please try again or contact support.'}
          </p>
          
          {isSuccess && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 border border-emerald-500/20 mx-auto">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">
                Redirecting to app in {countdown}s
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex w-full flex-col gap-3">
          {deepLink ? (
            <a
              href={deepLink}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-[0.98] ${
                isSuccess ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-50'
              } ${!isSuccess && 'bg-slate-800 text-slate-200'}`}>
              Back to Thantra Astro
            </a>
          ) : (
             <div className="rounded-2xl border border-slate-800 bg-[#1E293B]/50 p-4">
                <p className="text-xs text-slate-400">Deep link not configured. Please close this window manually.</p>
             </div>
          )}
          
          {!isSuccess && (
            <button
              onClick={() => window.history.back()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-4 text-sm font-bold text-slate-300 transition-all hover:bg-white/10 active:scale-[0.98]">
              Try Again
            </button>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-10 rounded-2xl border border-slate-800/50 bg-[#1E293B]/30 p-6 w-full">
           <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
             <span>Order Status</span>
             <span className={isSuccess ? 'text-emerald-500' : 'text-rose-500'}>
               {isSuccess ? 'Verified' : 'Rejected'}
             </span>
           </div>
           <div className="mt-2 h-px bg-slate-800" />
           <p className="mt-3 text-xs text-slate-400">
             If you face any issues, please contact our support team with your transaction reference.
           </p>
        </div>
      </div>
    </div>
  );
}
