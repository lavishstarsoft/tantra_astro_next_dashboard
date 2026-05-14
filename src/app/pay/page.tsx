import { Suspense } from 'react';
import CheckoutForm from './checkout-form';

export const dynamic = 'force-dynamic';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function PayPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] font-sans selection:bg-rose-500/30 overflow-auto">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-rose-500" />
        </div>
      }>
        <CheckoutForm />
      </Suspense>
    </div>
  );
}
