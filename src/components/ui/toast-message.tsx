'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ToastMessageProps = {
  message: string | null;
  kind?: 'success' | 'error' | 'info';
  onClose: () => void;
};

export function ToastMessage({ message, kind = 'info', onClose }: ToastMessageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!message) return;
    const id = setTimeout(onClose, 2400);
    return () => clearTimeout(id);
  }, [message, onClose]);

  if (!mounted || !message) return null;

  const tone =
    kind === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : kind === 'error'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : 'border-sky-200 bg-sky-50 text-sky-700';

  return createPortal(
    <div className="fixed right-4 top-4 z-[90]">
      <div className={`rounded-xl border px-4 py-2 text-sm font-medium shadow-md ${tone}`}>{message}</div>
    </div>,
    document.body
  );
}

