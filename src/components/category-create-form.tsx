'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ToastMessage } from '@/components/ui/toast-message';

export function CategoryCreateForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [packPriceLabel, setPackPriceLabel] = useState('₹999');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' | 'info' } | null>(null);

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.set('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' });
    const data = (await res.json()) as { absoluteUrl?: string; proxyUrl?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? 'Upload failed');
    return data.absoluteUrl ?? data.proxyUrl ?? '';
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      let finalThumbnailUrl = thumbnailUrl;
      if (thumbnailFile) {
        try {
          finalThumbnailUrl = await uploadFile(thumbnailFile);
        } catch (err) {
          setMessage(err instanceof Error ? err.message : 'Upload failed');
          setToast({ text: 'Thumbnail upload failed', kind: 'error' });
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, packPriceLabel, thumbnailUrl: finalThumbnailUrl }),
      });
      const data = (await res.json()) as { error?: unknown };
      if (!res.ok) {
        setMessage(typeof data.error === 'string' ? data.error : 'Create failed');
        setToast({ text: 'Category create failed', kind: 'error' });
        return;
      }
      setName('');
      setPackPriceLabel('₹999');
      setThumbnailUrl('');
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setMessage('Category created');
      setToast({ text: 'Category created', kind: 'success' });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <ToastMessage message={toast?.text ?? null} kind={toast?.kind} onClose={() => setToast(null)} />
      <button
        type="button"
        onClick={() => {
          setMessage(null);
          setOpen(true);
        }}
        className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600">
        Add category
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800">Add category</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
                Close
              </button>
            </div>
            <form className="space-y-3" onSubmit={onCreate}>
              <div>
                <label className="text-xs font-medium text-slate-600">Category name</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Beginner"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Pack label</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={packPriceLabel}
                  onChange={(e) => setPackPriceLabel(e.target.value)}
                  placeholder="₹999"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Thumbnail upload</label>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-slate-600"
                  disabled={loading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setThumbnailFile(f);
                      setThumbnailPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>
              <div>
                {(thumbnailPreview || thumbnailUrl) ? (
                  <img
                    src={thumbnailPreview || thumbnailUrl}
                    alt="Category thumbnail preview"
                    className="mt-2 h-20 w-32 rounded-lg border border-slate-200 object-cover"
                  />
                ) : null}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60">
                {loading ? 'Processing…' : 'Add category'}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      {message ? <p className="mt-2 text-xs text-sky-600">{message}</p> : null}
    </div>
  );
}
