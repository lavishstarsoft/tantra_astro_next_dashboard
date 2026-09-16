'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

export type ShortRow = {
  id: string;
  title: string;
  topic: string;
  teacher: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  caption: string;
  linkedVideoTitle: string | null;
  published: boolean;
  sortOrder: number;
};

type Draft = {
  title: string;
  topic: string;
  teacher: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  caption: string;
  linkedVideoTitle: string;
};

const emptyDraft = (): Draft => ({
  title: '', topic: '', teacher: '', videoUrl: '', thumbnailUrl: '', duration: '', caption: '', linkedVideoTitle: '',
});

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/admin/upload', { method: 'POST', credentials: 'include', body: fd });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error || 'Upload failed');
  return data.url as string;
}

export function ShortsManager({ initial, videoTitles }: { initial: ShortRow[]; videoTitles: string[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'video' | 'thumb' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const isEditing = editingId !== null;

  function startEdit(s: ShortRow) {
    setEditingId(s.id);
    setDraft({
      title: s.title,
      topic: s.topic,
      teacher: s.teacher,
      videoUrl: s.videoUrl,
      thumbnailUrl: s.thumbnailUrl,
      duration: String(s.duration || ''),
      caption: s.caption,
      linkedVideoTitle: s.linkedVideoTitle || '',
    });
    setError(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft());
    setError(null);
  }

  async function onPickVideo(file?: File) {
    if (!file) return;
    setError(null);
    setUploading('video');
    try {
      const url = await uploadFile(file);
      setDraft((d) => ({ ...d, videoUrl: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Video upload failed');
    } finally {
      setUploading(null);
    }
  }

  async function onPickThumb(file?: File) {
    if (!file) return;
    setError(null);
    setUploading('thumb');
    try {
      const url = await uploadFile(file);
      setDraft((d) => ({ ...d, thumbnailUrl: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Thumbnail upload failed');
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setError(null);
    if (!draft.title.trim()) return setError('Title is required');
    if (!draft.videoUrl) return setError('Please choose and upload a video first');
    setBusy(true);
    try {
      const body = {
        title: draft.title.trim(),
        topic: draft.topic.trim() || 'General',
        teacher: draft.teacher.trim(),
        videoUrl: draft.videoUrl,
        thumbnailUrl: draft.thumbnailUrl,
        duration: Number(draft.duration) || 0,
        caption: draft.caption.trim(),
        linkedVideoTitle: draft.linkedVideoTitle || null,
      };
      const url = isEditing ? `/api/admin/shorts/${editingId}` : '/api/admin/shorts';
      const method = isEditing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEditing ? body : { ...body, published: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === 'string' ? data.error : 'Save failed');
        return;
      }
      cancelEdit();
      router.refresh();
    } catch {
      setError('Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/shorts/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { alert('Update failed'); return; }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this short?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/shorts/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) { alert('Delete failed'); return; }
      if (editingId === id) cancelEdit();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= initial.length) return;
    const a = initial[index];
    const b = initial[target];
    await patch(a.id, { sortOrder: b.sortOrder });
    await patch(b.id, { sortOrder: a.sortOrder });
  }

  return (
    <div className="space-y-6">
      <div ref={formRef} className={`rounded-2xl border p-4 shadow-sm ${isEditing ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">{isEditing ? 'Edit short' : 'Add short'}</h2>
          {isEditing ? (
            <button onClick={cancelEdit} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel edit</button>
          ) : null}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">Video file (9:16 portrait){isEditing ? ' — choose to replace' : ''}</label>
            <input type="file" accept="video/*" onChange={(e) => onPickVideo(e.target.files?.[0])} className="mt-1 block w-full text-sm" />
            {uploading === 'video' ? <p className="mt-1 text-xs text-sky-600">Uploading video…</p> : null}
            {draft.videoUrl ? <p className="mt-1 truncate text-xs text-emerald-600">✓ Video: {draft.videoUrl.split('/').pop()}</p> : null}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Thumbnail (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => onPickThumb(e.target.files?.[0])} className="mt-1 block w-full text-sm" />
            {uploading === 'thumb' ? <p className="mt-1 text-xs text-sky-600">Uploading…</p> : null}
            {draft.thumbnailUrl ? <p className="mt-1 text-xs text-emerald-600">✓ Thumbnail set</p> : null}
          </div>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Title" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input value={draft.topic} onChange={(e) => setDraft({ ...draft, topic: e.target.value })} placeholder="Topic (e.g. Nakshatra)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input value={draft.teacher} onChange={(e) => setDraft({ ...draft, teacher: e.target.value })} placeholder="Teacher name" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
          <input value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value })} placeholder="Duration in seconds (e.g. 45)" inputMode="numeric" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </div>

        <input value={draft.caption} onChange={(e) => setDraft({ ...draft, caption: e.target.value })} placeholder="On-screen caption (optional)" className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />

        <div className="mt-3">
          <label className="text-xs font-medium text-slate-600">Link full course (optional)</label>
          <select value={draft.linkedVideoTitle} onChange={(e) => setDraft({ ...draft, linkedVideoTitle: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">— No linked course —</option>
            {draft.linkedVideoTitle && !videoTitles.includes(draft.linkedVideoTitle) ? (
              <option value={draft.linkedVideoTitle}>{draft.linkedVideoTitle} (current)</option>
            ) : null}
            {videoTitles.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button disabled={busy || uploading !== null} onClick={save} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50">
            {busy ? 'Saving…' : isEditing ? 'Update short' : 'Save short'}
          </button>
          {isEditing ? (
            <button disabled={busy} onClick={cancelEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          ) : null}
        </div>
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="space-y-3">
        {initial.length === 0 ? (
          <p className="text-sm text-slate-400">No shorts yet.</p>
        ) : (
          initial.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-3 rounded-2xl border bg-white p-3 shadow-sm ${editingId === s.id ? 'border-amber-300' : 'border-slate-200'}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{s.title}</p>
                <p className="text-xs text-slate-500">{s.duration}s</p>
              </div>
              <div className="flex gap-1">
                <button disabled={busy} onClick={() => move(i, -1)} className="rounded border px-2 py-1 text-xs">↑</button>
                <button disabled={busy} onClick={() => move(i, 1)} className="rounded border px-2 py-1 text-xs">↓</button>
                <button disabled={busy} onClick={() => startEdit(s)} className="rounded border border-sky-200 px-2 py-1 text-xs font-semibold text-sky-600">Edit</button>
                <button disabled={busy} onClick={() => patch(s.id, { published: !s.published })} className="rounded border px-2 py-1 text-xs">{s.published ? 'Hide' : 'Show'}</button>
                <button disabled={busy} onClick={() => remove(s.id)} className="rounded border border-rose-200 px-2 py-1 text-xs text-rose-600">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
