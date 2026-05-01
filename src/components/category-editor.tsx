'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ToastMessage } from '@/components/ui/toast-message';

type Cat = {
  id: string;
  name: string;
  packPriceLabel: string;
  thumbnailUrl?: string;
  _count: { videos: number; packItems: number };
};

export function CategoryEditor({ category }: { category: Cat }) {
  const router = useRouter();
  const [name, setName] = useState(category.name);
  const [packPriceLabel, setPackPriceLabel] = useState(category.packPriceLabel);
  const [thumbnailUrl, setThumbnailUrl] = useState(category.thumbnailUrl ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.set('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' });
    const data = (await res.json()) as { absoluteUrl?: string; proxyUrl?: string; error?: string };
    if (!res.ok) throw new Error(data.error ?? 'Upload failed');
    return data.absoluteUrl ?? data.proxyUrl ?? '';
  }

  async function save() {
    setStatus(null);
    setLoading(true);
    try {
      let finalThumbnailUrl = thumbnailUrl;
      if (thumbnailFile) {
        try {
          finalThumbnailUrl = await uploadFile(thumbnailFile);
        } catch (err) {
          setStatus('Upload failed');
          setToast({ text: 'Thumbnail upload failed', kind: 'error' });
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, packPriceLabel, thumbnailUrl: finalThumbnailUrl }),
      });
      if (!res.ok) {
        setStatus('Save failed');
        setToast({ text: 'Category update failed', kind: 'error' });
        return;
      }
      setStatus('Saved');
      setToast({ text: 'Category updated', kind: 'success' });
      setThumbnailUrl(finalThumbnailUrl);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setIsEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeCategory() {
    setStatus(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        setStatus('Delete failed');
        setToast({ text: 'Category delete failed', kind: 'error' });
        return;
      }
      setStatus('Deleted');
      setToast({ text: 'Category deleted', kind: 'success' });
      setShowDeleteModal(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ToastMessage message={toast?.text ?? null} kind={toast?.kind} onClose={() => setToast(null)} />
      <tr className="hover:bg-slate-50">
        <td className="px-4 py-3">
          {isEditing ? (
            <input
              className="w-full min-w-[100px] rounded border border-slate-200 bg-white px-2 py-1 text-sm font-medium text-slate-700"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : (
            <span className="text-sm font-medium text-slate-700">{name}</span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="space-y-2">
            {isEditing ? (
              <>
                <input
                  className="w-full min-w-[100px] rounded border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700"
                  value={packPriceLabel}
                  onChange={(e) => setPackPriceLabel(e.target.value)}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-xs text-slate-600"
                  disabled={loading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setThumbnailFile(f);
                      setThumbnailPreview(URL.createObjectURL(f));
                    }
                  }}
                />
                {(thumbnailPreview || thumbnailUrl) ? (
                  <img
                    src={thumbnailPreview || thumbnailUrl}
                    alt={`${name} thumbnail`}
                    className="h-10 w-16 rounded object-cover border border-slate-200"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No thumbnail</span>
                )}
              </>
            ) : (
              <>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">{packPriceLabel}</span>
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={`${name} thumbnail`}
                    className="h-10 w-16 rounded object-cover border border-slate-200"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No thumbnail</span>
                )}
              </>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-slate-600">{category._count.videos}</td>
        <td className="px-4 py-3 text-slate-600">{category._count.packItems}</td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void save()}
                  className="rounded bg-sky-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-sky-600 disabled:opacity-50">
                  Save
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setName(category.name);
                    setPackPriceLabel(category.packPriceLabel);
                    setThumbnailUrl(category.thumbnailUrl ?? '');
                    setThumbnailFile(null);
                    setThumbnailPreview(null);
                    setIsEditing(false);
                    setStatus(null);
                  }}
                  className="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStatus(null);
                  setIsEditing(true);
                }}
                className="rounded border border-slate-300 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Edit
              </button>
            )}
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowDeleteModal(true)}
              className="rounded border border-rose-300 px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50">
              Delete
            </button>
            {status ? <span className="text-xs text-sky-600">{status}</span> : null}
          </div>
        </td>
      </tr>
      {showDeleteModal ? (
        <tr>
          <td colSpan={5}>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
                <h3 className="text-base font-semibold text-slate-800">Delete category?</h3>
                <p className="mt-2 text-sm text-slate-500">
                  If you delete <span className="font-semibold text-slate-700">{category.name}</span>, related videos and pack rows will also be removed.
                </p>
                <div className="mt-4 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => setShowDeleteModal(false)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => void removeCategory()}
                    className="rounded-lg bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50">
                    {loading ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
