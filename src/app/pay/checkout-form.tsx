'use client';

import Script from 'next/script';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const target = searchParams.get('target') ?? '';
  const kind = searchParams.get('kind') ?? '';
  
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [autoOpened, setAutoOpened] = useState(false);

  const paymentReturnBase = useMemo(
    () => process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '',
    []
  );
  
  const deepLinkSuccess = useMemo(
    () => (paymentReturnBase ? `${paymentReturnBase}/payment/success?status=success&target=${encodeURIComponent(target)}&kind=${encodeURIComponent(kind)}` : ''),
    [paymentReturnBase, target, kind]
  );
  const deepLinkFailed = useMemo(
    () => (paymentReturnBase ? `${paymentReturnBase}/payment/success?status=failed&target=${encodeURIComponent(target)}&kind=${encodeURIComponent(kind)}` : ''),
    [paymentReturnBase, target, kind]
  );

  useEffect(() => {
    if (!token) {
      setError('Missing token');
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
        const json = await res.json();
        if (!res.ok) {
          setError(json?.error ?? 'Error starting payment');
          return;
        }
        setSession(json as SessionPayload);
      } catch (e) {
        if (isMounted) setError('Network error');
      }
    })();
    return () => { isMounted = false; };
  }, [token]);

  const startPayment = useCallback(() => {
    if (!session || !window.Razorpay) return;
    
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
      theme: { color: '#8F3D66' },
      handler: async (response: any) => {
        try {
          const res = await fetch('/api/public/payments/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, ...response }),
          });
          if (!res.ok) {
            window.location.href = deepLinkFailed;
            return;
          }
          window.location.href = deepLinkSuccess;
        } catch {
          window.location.href = deepLinkFailed;
        }
      },
      modal: {
        ondismiss: () => {
          window.location.href = deepLinkFailed;
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    setAutoOpened(true);
  }, [deepLinkFailed, deepLinkSuccess, session, token]);

  useEffect(() => {
    if (session && scriptReady && !autoOpened) {
      startPayment();
    }
  }, [session, scriptReady, autoOpened, startPayment]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F172A] pb-24 text-center">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />

      {error ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 max-w-xs mx-auto">
          <p className="text-sm text-rose-200/80 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="text-xs font-bold text-white bg-rose-600 px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="animate-pulse">
           <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        </div>
      )}
    </div>
  );
}
