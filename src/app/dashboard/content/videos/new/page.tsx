'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';

import { ToastMessage } from '@/components/ui/toast-message';

type CategoryRow = { id: string; name: string };
type VideoType = 'individual' | 'categoryPack';
const LANGUAGE_OPTIONS = ['Telugu', 'Tamil', 'Hindi', 'English'] as const;

export default function NewVideoPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [videoType, setVideoType] = useState<VideoType>('individual');

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('1h 00m');
  const [language, setLanguage] = useState('Telugu');
  const [priceLabel, setPriceLabel] = useState('Premium');
  const [individualPriceLabel, setIndividualPriceLabel] = useState('₹999');
  const [rating, setRating] = useState(4.5);
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [dashUrl, setDashUrl] = useState('');
  const [topics, setTopics] = useState('Intro, Core, Practice, Summary');
  const [isFree, setIsFree] = useState(false);
  const [accessValidityDays, setAccessValidityDays] = useState(30);
  const [categoryName, setCategoryName] = useState('General');

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const showPricingFields = videoType === 'individual' && !isFree;

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/categories', { credentials: 'include' });
      if (!res.ok) return;
      const data = (await res.json()) as { categories: CategoryRow[] };
      const filtered = (data.categories || []).filter(c => c.name !== 'General');
      setCategories(filtered);
      if (filtered.length > 0) {
        setCategoryName(filtered[0].name);
      }
    })();
  }, []);

  async function uploadFile(file: File): Promise<string> {
    setUploadingThumb(true);
    const fd = new FormData();
    try {
      fd.set('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' });
      const data = (await res.json()) as { absoluteUrl?: string; proxyUrl?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Upload failed');
      }
      return data.absoluteUrl ?? data.proxyUrl ?? '';
    } finally {
      setUploadingThumb(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const normalizedCategory =
        videoType === 'categoryPack' ? categoryName : (categories[0]?.name ?? categoryName);
      
      const parsedTopics = topics.split(',').map((s) => s.trim()).filter(Boolean);
      if (parsedTopics.length === 0) {
        setMessage('Add at least one topic.');
        setToast({ text: 'Please add at least one topic', kind: 'error' });
        return;
      }

      let finalThumbnailUrl = thumbnailUrl;
      if (thumbnailFile) {
        try {
          finalThumbnailUrl = await uploadFile(thumbnailFile);
          setThumbnailUrl(finalThumbnailUrl);
        } catch (err) {
          setMessage(err instanceof Error ? err.message : 'Thumbnail upload failed');
          setToast({ text: 'Thumbnail upload failed', kind: 'error' });
          return;
        }
      }

      if (!finalThumbnailUrl) {
        setMessage('Poster image is required.');
        setToast({ text: 'Poster image is required', kind: 'error' });
        return;
      }

      const res = await fetch('/api/admin/videos', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle: '',
          meta: '',
          duration,
          language,
          lessons: 0,
          priceLabel: videoType === 'individual' && isFree ? 'Free' : priceLabel,
          individualPriceLabel:
            videoType === 'individual' && isFree ? 'Free' : individualPriceLabel || undefined,
          rating,
          description,
          thumbnailUrl: finalThumbnailUrl,
          dashUrl,
          topics: parsedTopics,
          isFree: videoType === 'individual' ? isFree : false,
          accessValidityDays: videoType === 'individual' && !isFree ? accessValidityDays : 0,
          published: true,
          categoryName: normalizedCategory,
          addToCategoryPack: videoType === 'categoryPack',
        }),
      });
      const data = (await res.json()) as { error?: unknown; video?: { id: string } };
      if (!res.ok) {
        setMessage(typeof data.error === 'string' ? data.error : 'Save failed');
        setToast({ text: 'Video create failed', kind: 'error' });
        return;
      }
      if (data.video?.id) {
        setToast({ text: 'Video created', kind: 'success' });
        router.replace(`/dashboard/content/videos/${data.video.id}`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Error');
      setToast({ text: err instanceof Error ? err.message : 'Unexpected error', kind: 'error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-6">
      <ToastMessage message={toast?.text ?? null} kind={toast?.kind} onClose={() => setToast(null)} />
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-800">New video</h1>
        <p className="mt-1 max-w-4xl text-sm text-slate-500">
          Upload a poster image, paste a DASH or HLS URL, and assign a category.
        </p>
      </div>
      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 xl:grid-cols-3" onSubmit={onSubmit}>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 xl:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upload type</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setVideoType('individual')}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                videoType === 'individual'
                  ? 'border-sky-300 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}>
              <p className="font-semibold">Individual video</p>
              <p className="text-xs text-slate-500">Single video pricing and optional free course.</p>
            </button>
            <button
              type="button"
              onClick={() => setVideoType('categoryPack')}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                videoType === 'categoryPack'
                  ? 'border-sky-300 bg-sky-50 text-sky-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}>
              <p className="font-semibold">Category pack video</p>
              <p className="text-xs text-slate-500">Automatically adds this video into selected category pack.</p>
            </button>
          </div>
        </div>

        <div className="xl:col-span-3">
          <label className="text-xs font-medium text-slate-600">Poster image</label>
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
          {uploadingThumb ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
              Uploading thumbnail to cloud...
            </div>
          ) : null}
        </div>
        <div className="xl:col-span-3">
          {(thumbnailPreview || thumbnailUrl) ? (
            <img
              src={thumbnailPreview || thumbnailUrl}
              alt="Thumbnail preview"
              className="mt-2 h-24 w-40 rounded-lg border border-slate-200 object-cover"
            />
          ) : (
            <p className="mt-2 text-xs text-slate-500">Select an image to preview poster.</p>
          )}
        </div>
        <div className="xl:col-span-3">
          <label className="text-xs font-medium text-slate-600">Stream URL (DASH / HLS)</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            value={dashUrl}
            onChange={(e) => setDashUrl(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-3 xl:grid-cols-3">
          <div className="md:col-span-2 xl:col-span-3">
            <label className="text-xs font-medium text-slate-600">Title</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          {videoType === 'categoryPack' ? (
            <div>
              <label className="text-xs font-medium text-slate-600">Category (Required for pack)</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="text-xs font-medium text-slate-600">Duration label</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600">Language</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
          {showPricingFields ? (
            <>
              <div>
                <label className="text-xs font-medium text-slate-600">Price label (UI)</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={priceLabel}
                  onChange={(e) => setPriceLabel(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Individual price label</label>
                <input
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={individualPriceLabel}
                  onChange={(e) => setIndividualPriceLabel(e.target.value)}
                />
                <p className="mt-1 text-[11px] text-slate-500">Final payment amount will be auto-calculated from this label.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Validity days after purchase</label>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={accessValidityDays}
                  onChange={(e) => setAccessValidityDays(Math.max(0, Number(e.target.value) || 0))}
                />
                <p className="mt-1 text-[11px] text-slate-500">Set 0 for unlimited validity.</p>
              </div>
            </>
          ) : null}
          <div>
            <label className="text-xs font-medium text-slate-600">Rating</label>
            <input
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
          {videoType === 'individual' ? (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => {
                  const next = e.target.checked;
                  setIsFree(next);
                  if (next) {
                    setPriceLabel('Free');
                    setIndividualPriceLabel('Free');
                  }
                }}
              />
              Free course
            </label>
          ) : (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
              This video will be added to selected category pack automatically.
            </div>
          )}
        </div>
        <div className="xl:col-span-3">
          <label className="text-xs font-medium text-slate-600">Topics (comma separated)</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
          />
        </div>
        <div className="xl:col-span-3">
          <label className="text-xs font-medium text-slate-600">Description</label>
          <textarea
            className="mt-1 min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        {message ? <p className="xl:col-span-3 text-sm text-rose-400">{message}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="xl:col-span-3 xl:justify-self-start rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60">
          {loading ? (thumbnailFile && uploadingThumb ? 'Uploading Poster…' : 'Saving Video…') : 'Create video'}
        </button>
      </form>
    </div>
  );
}
