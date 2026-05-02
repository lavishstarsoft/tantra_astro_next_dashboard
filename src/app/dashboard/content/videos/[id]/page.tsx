'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

import { ToastMessage } from '@/components/ui/toast-message';

type CategoryRow = { id: string; name: string };
type VideoType = 'individual' | 'categoryPack';
const LANGUAGE_OPTIONS = ['Telugu', 'Tamil', 'Hindi', 'English'] as const;

type VideoRow = {
  id: string;
  title: string;
  meta: string;
  duration: string;
  language: string;
  priceLabel: string;
  individualPriceLabel: string | null;
  rating: number;
  description: string;
  thumbnailUrl: string;
  dashUrl: string;
  topicsJson: string;
  isFree: boolean;
  published: boolean;
  checkoutAmountCents: number;
  accessValidityDays: number;
  packItems: { id: string; categoryId: string; videoId: string }[];
  category: { name: string };
};

export default function EditVideoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [video, setVideo] = useState<VideoRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' | 'info' } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [videoType, setVideoType] = useState<VideoType>('individual');

  const [dashUrl, setDashUrl] = useState('');
  const [language, setLanguage] = useState('Telugu');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState('');
  const [published, setPublished] = useState(true);
  const [isFree, setIsFree] = useState(false);
  const [accessValidityDays, setAccessValidityDays] = useState(0);
  const [categoryName, setCategoryName] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [individualPriceLabel, setIndividualPriceLabel] = useState('');
  const showPricingFields = videoType === 'individual' && !isFree;

  async function uploadThumbnail(file: File) {
    setUploadingThumb(true);
    const fd = new FormData();
    try {
      fd.set('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd, credentials: 'include' });
      const data = (await res.json()) as { absoluteUrl?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Upload failed');
      }
      if (data.absoluteUrl) {
        setThumbnailUrl(data.absoluteUrl);
        setToast({ text: 'Thumbnail uploaded successfully', kind: 'success' });
      }
    } finally {
      setUploadingThumb(false);
    }
  }

  useEffect(() => {
    void (async () => {
      const catRes = await fetch('/api/admin/categories', { credentials: 'include' });
      if (catRes.ok) {
        const catData = (await catRes.json()) as { categories: CategoryRow[] };
        setCategories(catData.categories);
      }

      const res = await fetch(`/api/admin/videos/${id}`, { credentials: 'include' });
      if (!res.ok) {
        setMessage('Could not load video');
        return;
      }
      const data = (await res.json()) as { video: VideoRow };
      const v = data.video;
      setVideo(v);
      setDashUrl(v.dashUrl);
      setLanguage(v.language);
      setThumbnailUrl(v.thumbnailUrl);
      setDescription(v.description);
      setPriceLabel(v.priceLabel);
      setIndividualPriceLabel(v.individualPriceLabel ?? '');
      setIsFree(v.isFree);
      setAccessValidityDays(v.accessValidityDays ?? 0);
      setCategoryName(v.category.name);
      setVideoType(v.packItems.length > 0 ? 'categoryPack' : 'individual');
      try {
        const t = JSON.parse(v.topicsJson) as string[];
        setTopics(t.join(', '));
      } catch {
        setTopics('');
      }
      setPublished(v.published);
    })();
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!video) {
      return;
    }
    setMessage(null);
    setLoading(true);
    try {
      const parsedTopics = topics.split(',').map((s) => s.trim()).filter(Boolean);
      if (parsedTopics.length === 0) {
        setMessage('Add at least one topic.');
        setToast({ text: 'Please add at least one topic', kind: 'error' });
        return;
      }
      const res = await fetch(`/api/admin/videos/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dashUrl,
          language,
          thumbnailUrl,
          description,
          topics: parsedTopics,
          categoryName: videoType === 'categoryPack' ? categoryName : undefined,
          priceLabel: videoType === 'individual' && isFree ? 'Free' : priceLabel,
          individualPriceLabel:
            videoType === 'individual'
              ? isFree
                ? 'Free'
                : (individualPriceLabel || null)
              : null,
          isFree: videoType === 'individual' ? isFree : false,
          accessValidityDays: videoType === 'individual' && !isFree ? accessValidityDays : 0,
          addToCategoryPack: videoType === 'categoryPack',
          published,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: unknown };
        const errText =
          typeof data.error === 'string' ? data.error : 'Video update failed';
        setMessage(errText);
        setToast({ text: errText, kind: 'error' });
        console.error(data.error);
        return;
      }
      router.replace('/dashboard/content/videos?toast=updated');
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!confirm('Delete this video? Pack links will be removed.')) {
      return;
    }
    const res = await fetch(`/api/admin/videos/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      setToast({ text: 'Video deleted', kind: 'success' });
      router.replace('/dashboard/content/videos');
    }
  }

  async function copyCheckoutLink() {
    const res = await fetch('/api/admin/checkout-link', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'video', id }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (!res.ok) {
      setMessage(data.error ?? 'Checkout unavailable');
      setToast({ text: data.error ?? 'Checkout unavailable', kind: 'error' });
      return;
    }
    if (data.url) {
      await navigator.clipboard.writeText(data.url);
      setMessage('Checkout link copied to clipboard');
      setToast({ text: 'Checkout link copied', kind: 'success' });
    }
  }

  if (!video) {
    return <p className="text-slate-500">{message ?? 'Loading…'}</p>;
  }

  return (
    <div className="w-full space-y-6">
      <ToastMessage message={toast?.text ?? null} kind={toast?.kind} onClose={() => setToast(null)} />
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Edit video</h1>
        <p className="mt-1 text-lg text-sky-600">{video.title}</p>
        <p className="text-sm text-slate-500">
          Category: {video.category.name} · Free: {video.isFree ? 'yes' : 'no'}
        </p>
      </div>
      <form className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 xl:grid-cols-3" onSubmit={onSave}>
        <div className="xl:col-span-3">
          <label className="text-xs font-medium text-slate-600">Title</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
            value={video.title}
            readOnly
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 xl:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Video type</p>
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
              <p className="text-xs text-slate-500">Single video purchase flow.</p>
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
              <p className="text-xs text-slate-500">Video shows inside selected category pack.</p>
            </button>
          </div>
        </div>

        {videoType === 'categoryPack' ? (
          <div className="xl:col-span-3">
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

        {showPricingFields ? (
          <>
            <div className="xl:col-span-2">
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
        ) : videoType === 'categoryPack' ? (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
            This video stays in selected category pack.
          </div>
        ) : null}

        <div className="xl:col-span-3">
          <label className="text-xs font-medium text-slate-600">Thumbnail image</label>
          <input
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm text-slate-600"
            disabled={uploadingThumb}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                void uploadThumbnail(f).catch((err: Error) => setToast({ text: err.message, kind: 'error' }));
              }
            }}
          />
          {uploadingThumb ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
              Uploading thumbnail to cloud...
            </div>
          ) : null}
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt="Thumbnail preview"
              width={160}
              height={96}
              unoptimized
              className="mt-2 h-24 w-40 rounded-lg border border-slate-200 object-cover"
            />
          ) : (
            <p className="mt-2 text-xs text-slate-500">Upload an image to preview thumbnail.</p>
          )}
        </div>
        <div className="xl:col-span-3">
          <label className="text-xs font-medium text-slate-600">Stream URL</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            value={dashUrl}
            onChange={(e) => setDashUrl(e.target.value)}
          />
        </div>
        <div className="xl:col-span-3">
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
        <div className="xl:col-span-3">
          <label className="text-xs font-medium text-slate-600">Description</label>
          <textarea
            className="mt-1 min-h-[120px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="xl:col-span-3">
          <label className="text-xs font-medium text-slate-600">Topics (comma separated)</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
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
        ) : null}
        <label className="flex items-center gap-2 text-sm text-slate-600 xl:col-span-3">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          Published (visible in public catalog)
        </label>
        {message ? <p className="text-sm text-sky-600 xl:col-span-3">{message}</p> : null}
        <div className="flex flex-wrap gap-2 xl:col-span-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60">
            Save changes
          </button>
          <button
            type="button"
            onClick={() => void copyCheckoutLink()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Copy Stripe checkout link
          </button>
          <button
            type="button"
            onClick={() => void onDelete()}
            className="rounded-lg border border-rose-300 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
