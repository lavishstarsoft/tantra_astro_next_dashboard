'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { ToastMessage } from '@/components/ui/toast-message';

export function VideosListToast() {
  const sp = useSearchParams();
  const toast = sp.get('toast');
  const [dismissed, setDismissed] = useState(false);

  const message = useMemo(() => {
    if (dismissed) return null;
    if (toast === 'updated') return 'Video updated successfully';
    if (toast === 'created') return 'Video created successfully';
    if (toast === 'deleted') return 'Video deleted successfully';
    return null;
  }, [toast, dismissed]);

  return <ToastMessage message={message} kind="success" onClose={() => setDismissed(true)} />;
}

