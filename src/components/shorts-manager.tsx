'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<'video' | 'thumb' | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const res = await fetch('/api/admin/shorts', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: draft.title.trim(),
          topic: draft.topic.trim() || 'General',
          teacher: draft.teacher.trim(),
          videoUrl: draft.videoUrl,
          thumbnailUrl: draft.thumbnailUrl,
          duration: Number(draft.duration) || 0,
          caption: draft.caption.trim(),
          linkedVideoTitle: draft.linkedVideoTitle || undefined,
          published: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(typeof data.error === 'string' ? data.error : 'Save failed');
        return;
      }
      setDraft(emptyDraft());
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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Add short</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">Video file (9:16 portrait)</label>
            <input type="file" accept="video/*" onChange={(e) => onPickVideo(e.target.files?.[0])} className="mt-1 block w-full text-sm" />
            {uploading === 'video' ? <p className="mt-1 text-xs text-sky-600">Uploading video…</p> : null}
            {draft.videoUrl ? <p className="mt-1 text-xs text-emerald-600">✓ Video uploaded</p> : null}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Thumbnail (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => onPickThumb(e.target.files?.[0])} className="mt-1 block w-full text-sm" />
            {uploading === 'thumb' ? <p className="mt-1 text-xs text-sky-600">Uploading…</p> : null}
            {draft.thumbnailUrl ? <p className="mt-1 text-xs text-emerald-600">✓ Thumbnail uploaded</p> : null}
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
            {videoTitles.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <button disabled={busy || uploading !== null} onClick={save} className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-50">
          {busy ? 'Saving…' : 'Save short'}
        </button>
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}
      </div>

      <div className="space-y-3">
        {initial.length === 0 ? (
          <p className="text-sm text-slate-400">No shorts yet.</p>
        ) : (
          initial.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex h-16 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                {s.thumbnailUrl ? <img src={s.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <span className="text-slate-400">▶</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{s.title}</p>
                <p className="truncate text-xs text-slate-500">{s.topic} · {s.duration}s{s.linkedVideoTitle ? ` · → ${s.linkedVideoTitle}` : ''}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.published ? 'Live' : 'Hidden'}</span>
              <div className="flex gap-1">
                <button disabled={busy} onClick={() => move(i, -1)} className="rounded border px-2 py-1 text-xs">↑</button>
                <button disabled={busy} onClick={() => move(i, 1)} className="rounded border px-2 py-1 text-xs">↓</button>
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
