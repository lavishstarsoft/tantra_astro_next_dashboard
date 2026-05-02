'use client';

import Script from 'next/script';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';

export type SessionPayload = {
  ok: true;
  keyId: string;
  orderId: string;
  amountCents: number;
  currency: string;
  customer: { name: string; email: string; contact: string };
  description: string;
};

declare global {
  interface Window {
    Razorpay?: { new(options: unknown): { open(): void } };
  }
}

export default function CheckoutForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'ready' | 'processing' | 'done'>('idle');
  const [scriptReady, setScriptReady] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  const paymentReturnBase = useMemo(
    () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '',
    []
  );
  
  const deepLinkSuccess = useMemo(
    () => (paymentReturnBase ? `${paymentReturnBase}/payment/success?status=success` : ''),
    [paymentReturnBase]
  );
  const deepLinkFailed = useMemo(
    () => (paymentReturnBase ? `${paymentReturnBase}/payment/success?status=failed` : ''),
    [paymentReturnBase]
  );

  const brandColor = '#8F3D66'; 
  const isSessionLoading = !session && !error;

  useEffect(() => {
    if (!token) {
      setError('Missing payment token.');
      return;
    }
    
    let isMounted = true;
    
    void (async () => {
      try {
        const res = await fetch(`/api/public/payments/razorpay/session?token=${encodeURIComponent(token)}`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        
        if (!isMounted) return;
        
        const json = (await res.json()) as Record<string, unknown>;
        if (!res.ok) {
          setError(typeof json?.error === 'string' ? json.error : 'Could not start payment');
          return;
        }
        setSession(json as SessionPayload);
        setStatus('ready');
      } catch (e) {
        if (isMounted) {
          setError(e instanceof Error ? e.message : 'Could not start payment');
        }
      }
    })();
    
    return () => { isMounted = false; };
  }, [token]);

  const startPayment = useCallback(async () => {
    if (!session || !window.Razorpay) return;
    setStatus('processing');
    
    const options = {
      key: session.keyId,
      amount: session.amountCents,
      currency: session.currency,
      name: 'Thantra Astro',
      description: session.description,
      order_id: session.orderId,
      prefill: {
        name: session.customer?.name ?? '',
        email: session.customer?.email ?? '',
        contact: session.customer?.contact ?? '',
      },
      theme: {
        color: brandColor,
      },
      handler: async (response: Record<string, unknown>) => {
        try {
          setStatus('processing');
          const res = await fetch('/api/public/payments/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, ...response }),
          });
          const json = (await res.json()) as Record<string, unknown>;
          if (!res.ok) {
            setError(typeof json?.error === 'string' ? json.error : 'Payment verification failed');
            if (deepLinkFailed) window.location.href = deepLinkFailed;
            return;
          }
          setStatus('done');
          if (deepLinkSuccess) window.location.href = deepLinkSuccess;
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Payment verification failed');
          if (deepLinkFailed) window.location.href = deepLinkFailed;
        }
      },
      modal: {
        ondismiss: () => {
          if (deepLinkFailed) window.location.href = deepLinkFailed;
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }, [deepLinkFailed, deepLinkSuccess, session, token]);

  useEffect(() => {
    if (!session || error) return;
    if (!scriptReady || autoOpened) return;
    if (status !== 'ready') return;
    if (!window.Razorpay) return;
    
    setAutoOpened(true);
    void startPayment();
  }, [autoOpened, error, scriptReady, session, startPayment, status]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 pt-16 pb-10">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E293B] border border-slate-700 shadow-xl">
           <div className="h-10 w-10 rounded-full" style={{ backgroundColor: brandColor }} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Thantra Astro</h1>
        <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 border border-emerald-500/20">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Secure Encrypted Session</span>
        </div>
      </div>

      {isSessionLoading && !error ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E293B] border border-slate-700 shadow-xl">
             <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-500/40 border-t-rose-500" />
           </div>
           <p className="text-sm font-medium text-slate-400 animate-pulse">Securing payment session…</p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-[#1E293B]/50 backdrop-blur-xl shadow-2xl">
            <div className="h-1 w-full bg-slate-800">
              <div 
                className="h-full bg-rose-500 transition-all duration-1000 ease-out" 
                style={{ width: status === 'ready' ? '60%' : status === 'processing' ? '90%' : status === 'done' ? '100%' : '10%' }}
              />
            </div>

            <div className="p-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold text-slate-200">Checkout</h2>
                <p className="text-sm text-slate-400">Complete your secure transaction to continue.</p>
              </div>

              {error && (
                <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Transaction Error</span>
                  <p className="text-sm text-rose-200/80 leading-relaxed">{error}</p>
                </div>
              )}

              {!error && (
                <div className="mt-8 rounded-2xl border border-slate-700/50 bg-[#0F172A]/40 p-5">
                  <div className="flex items-center justify-between border-b border-slate-700/50 pb-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Item Details</span>
                      <p className="text-sm font-medium text-slate-200">
                        {session?.description ?? 'Loading session…'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4">
                     <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Amount</span>
                      <p className="text-2xl font-bold text-white">
                        ₹{session ? (session.amountCents / 100).toLocaleString('en-IN') : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!error && (
                <button
                  type="button"
                  onClick={() => void startPayment()}
                  disabled={!session || status !== 'ready'}
                  className="group relative mt-8 w-full overflow-hidden rounded-2xl py-4 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                >
                  <div className="absolute inset-0 bg-rose-600 transition-colors group-hover:bg-rose-500" />
                  <div className="relative flex items-center justify-center gap-3">
                    {status === 'processing' ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    )}
                    <span className="text-base font-bold text-white">
                      {status === 'processing' ? 'Processing…' : 'Proceed to Pay'}
                    </span>
                  </div>
                </button>
              )}

              <div className="mt-8 flex items-center justify-center gap-6 opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
                 <Image
                   src="https://razorpay.com/assets/razorpay-logo.svg"
                   alt="Razorpay"
                   width={80}
                   height={16}
                   unoptimized
                   className="h-4 w-auto"
                 />
                 <div className="h-4 w-px bg-slate-700" />
                 <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">PCI DSS</span>
                 </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => { if (deepLinkFailed) window.location.href = deepLinkFailed; }}
            className="text-center text-sm font-medium text-slate-500 hover:text-slate-300 transition-colors mt-6"
          >
            Cancel and return to app
          </button>
        </>
      )}
    </div>
  );
}
