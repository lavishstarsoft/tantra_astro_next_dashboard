'use client';

import { useEffect, useMemo, useState } from 'react';

type CarouselKind = 'custom' | 'video' | 'category' | 'url';

type CarouselItemRow = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  kind: CarouselKind;
  target: string;
  sortOrder: number;
  active: boolean;
  startAt: string | null;
  endAt: string | null;
};

type VideoOption = {
  id: string;
  title: string;
  published: boolean;
  thumbnailUrl: string;
  category: { name: string };
};

type CategoryOption = {
  id: string;
  name: string;
};

export default function CarouselPage() {
  const [items, setItems] = useState<CarouselItemRow[]>([]);
  const [videos, setVideos] = useState<VideoOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [kind, setKind] = useState<CarouselKind>('custom');
  const [target, setTarget] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title)),
    [items]
  );
  const categoryThumbByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of videos) {
      if (!v.published) continue;
      if (!v.category?.name) continue;
      if (!map.has(v.category.name)) {
        map.set(v.category.name, v.thumbnailUrl);
      }
    }
    return map;
  }, [videos]);

  async function refresh() {
    const [itemsRes, videosRes, categoriesRes] = await Promise.all([
      fetch('/api/admin/carousel-items', { credentials: 'include' }),
      fetch('/api/admin/videos', { credentials: 'include' }),
      fetch('/api/admin/categories', { credentials: 'include' }),
    ]);

    if (itemsRes.ok) {
      const json = (await itemsRes.json()) as { items: CarouselItemRow[] };
      setItems(Array.isArray(json.items) ? json.items : []);
    }
    if (videosRes.ok) {
      const json = (await videosRes.json()) as { videos: VideoOption[] };
      setVideos(Array.isArray(json.videos) ? json.videos : []);
    }
    if (categoriesRes.ok) {
      const json = (await categoriesRes.json()) as { categories: CategoryOption[] };
      setCategories(Array.isArray(json.categories) ? json.categories : []);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (kind === 'video' || kind === 'category') {
      setImageUrl('');
    }
  }, [kind]);

  async function uploadFile(file: File) {
    setUploadingImage(true);
    const fd = new FormData();
    try {
      fd.set('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' });
      const data = (await res.json()) as { absoluteUrl?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      if (data.absoluteUrl) setImageUrl(data.absoluteUrl);
    } finally {
      setUploadingImage(false);
    }
  }

  async function createItem(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const finalImageUrl =
        kind === 'video'
          ? videos.find((v) => v.title === target)?.thumbnailUrl ?? ''
          : kind === 'category'
            ? categoryThumbByName.get(target) ?? ''
            : imageUrl;
      if (!finalImageUrl) {
        setMessage('Selected target has no thumbnail image. Please upload/set one on that video first.');
        return;
      }

      const res = await fetch('/api/admin/carousel-items', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          imageUrl: finalImageUrl,
          kind,
          target,
          sortOrder,
          active,
        }),
      });
      const json = (await res.json()) as { error?: unknown };
      if (!res.ok) {
        setMessage(typeof json.error === 'string' ? json.error : 'Create failed');
        return;
      }
      setTitle('');
      setSubtitle('');
      setKind('custom');
      setTarget('');
      setSortOrder(0);
      setActive(true);
      setImageUrl('');
      await refresh();
      setMessage('Saved');
    } finally {
      setLoading(false);
    }
  }

  function startEdit(item: CarouselItemRow) {
    setEditingId(item.id);
    setTitle(item.title);
    setSubtitle(item.subtitle ?? '');
    setKind(item.kind);
    setTarget(item.target ?? '');
    setSortOrder(item.sortOrder ?? 0);
    setActive(Boolean(item.active));
    setImageUrl(item.imageUrl ?? '');
    setMessage(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setKind('custom');
    setTarget('');
    setSortOrder(0);
    setActive(true);
    setImageUrl('');
    setMessage(null);
  }

  async function updateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setMessage(null);
    setLoading(true);
    try {
      const finalImageUrl =
        kind === 'video'
          ? videos.find((v) => v.title === target)?.thumbnailUrl ?? ''
          : kind === 'category'
            ? categoryThumbByName.get(target) ?? ''
            : imageUrl;
      if (!finalImageUrl) {
        setMessage('Selected target has no thumbnail image. Please upload/set one on that video first.');
        return;
      }
      const res = await fetch(`/api/admin/carousel-items/${editingId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          imageUrl: finalImageUrl,
          kind,
          target,
          sortOrder,
          active,
        }),
      });
      const json = (await res.json()) as { error?: unknown };
      if (!res.ok) {
        setMessage(typeof json.error === 'string' ? json.error : 'Update failed');
        return;
      }
      await refresh();
      cancelEdit();
      setMessage('Updated');
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, next: boolean) {
    await fetch(`/api/admin/carousel-items/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: next }),
    });
    await refresh();
  }

  async function removeItem(id: string) {
    if (!confirm('Delete this carousel item?')) return;
    await fetch(`/api/admin/carousel-items/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Carousel</h1>
        <p className="mt-1 text-sm text-slate-500">Manage images/ads shown on the mobile app home carousel.</p>
      </div>

      <form onSubmit={editingId ? updateItem : createItem} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        {editingId ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            Editing carousel item. Update fields and click “Save changes”.
          </div>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-600">Title</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Subtitle (optional)</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Kind</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              value={kind}
              onChange={(e) => setKind(e.target.value as CarouselKind)}>
              <option value="custom">Custom</option>
              <option value="video">Video</option>
              <option value="category">Category</option>
              <option value="url">External URL</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">
              Target {kind === 'video' ? '(video title)' : kind === 'category' ? '(category name)' : kind === 'url' ? '(https://...)' : '(optional)'}
            </label>
            {kind === 'video' ? (
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={target}
                onChange={(e) => {
                  const next = e.target.value;
                  setTarget(next);
                  if (!title) setTitle(next);
                  const selected = videos.find((v) => v.title === next);
                  setImageUrl(selected?.thumbnailUrl ?? '');
                }}>
                <option value="">Select video</option>
                {videos
                  .filter((v) => v.published)
                  .map((v) => (
                    <option key={v.id} value={v.title}>
                      {v.title}
                    </option>
                  ))}
              </select>
            ) : kind === 'category' ? (
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={target}
                onChange={(e) => {
                  const next = e.target.value;
                  setTarget(next);
                  if (!title) setTitle(`${next} Category`);
                  setImageUrl(categoryThumbByName.get(next) ?? '');
                }}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={kind === 'url' ? 'https://...' : ''}
              />
            )}
            {kind === 'video' ? (
              <p className="mt-1 text-[11px] text-slate-500">Only published videos are listed.</p>
            ) : kind === 'category' ? (
              <p className="mt-1 text-[11px] text-slate-500">Category image is auto-picked from its first published video thumbnail.</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Sort order</label>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600 mt-6">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
        </div>

        {kind === 'custom' || kind === 'url' ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-slate-600">Image upload</label>
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm text-slate-600"
                disabled={uploadingImage}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadFile(f).catch((err: Error) => setMessage(err.message));
                }}
              />
              {uploadingImage ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
                  Uploading image to cloud...
                </div>
              ) : null}
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Image URL</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
              />
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Image is auto-selected from the chosen {kind === 'video' ? 'video' : 'category'}.
          </div>
        )}

        {message ? <p className="text-sm text-sky-600">{message}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            disabled={loading}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60">
            {loading ? 'Saving…' : editingId ? 'Save changes' : 'Add to carousel'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Kind</th>
              <th className="px-4 py-3">Target</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sorted.map((i) => (
              <tr key={i.id}>
                <td className="px-4 py-3 font-medium text-slate-700">{i.title}</td>
                <td className="px-4 py-3 text-slate-600">{i.kind}</td>
                <td className="px-4 py-3 text-slate-600">{i.target || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{i.sortOrder}</td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => void toggleActive(i.id, !i.active)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      i.active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                    {i.active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(i)}
                      className="text-sm font-semibold text-sky-600 hover:text-sky-700">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeItem(i.id)}
                      className="text-sm font-semibold text-rose-600 hover:text-rose-700">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No carousel items yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

