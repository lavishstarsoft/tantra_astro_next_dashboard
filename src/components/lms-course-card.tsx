'use client';

import { useState } from 'react';

export type LmsCourse = {
  kind: 'video' | 'category';
  id: string;
  title: string;
  subtitle: string;
  priceRupees: number;
  thumbnailUrl: string;
};

export function LmsCourseCard({ course }: { course: LmsCourse }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp() {
    setError(null);
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/public/lms/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not send OTP');
        return;
      }
      setStep('otp');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndPay() {
    setError(null);
    if (otp.replace(/\D/g, '').length < 4) {
      setError('Enter the OTP');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/public/lms/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, kind: course.kind, targetId: course.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Verification failed');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-[#2a0512]">
      <div className="relative flex h-32 items-center justify-center bg-[#3a0a1c]">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl text-amber-300">✦</span>
        )}
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] text-amber-100">
          Watch in app
        </span>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-amber-50">{course.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-amber-100/60">{course.subtitle}</p>

        {!open ? (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-lg font-bold text-amber-50">₹{course.priceRupees.toLocaleString('en-IN')}</span>
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2a0512] hover:bg-amber-300">
              Buy now
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {step === 'phone' ? (
              <>
                <input
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your mobile number"
                  className="w-full rounded-lg border border-amber-500/30 bg-[#1c0410] px-3 py-2 text-sm text-amber-50 placeholder:text-amber-100/40"
                />
                <button
                  disabled={busy}
                  onClick={sendOtp}
                  className="w-full rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2a0512] hover:bg-amber-300 disabled:opacity-50">
                  {busy ? 'Sending…' : 'Send OTP'}
                </button>
              </>
            ) : (
              <>
                <input
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full rounded-lg border border-amber-500/30 bg-[#1c0410] px-3 py-2 text-sm text-amber-50 placeholder:text-amber-100/40"
                />
                <button
                  disabled={busy}
                  onClick={verifyAndPay}
                  className="w-full rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-[#2a0512] hover:bg-amber-300 disabled:opacity-50">
                  {busy ? 'Verifying…' : `Verify & pay ₹${course.priceRupees.toLocaleString('en-IN')}`}
                </button>
                <button onClick={() => setStep('phone')} className="w-full text-center text-xs text-amber-100/60">
                  Change number
                </button>
              </>
            )}
            {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
