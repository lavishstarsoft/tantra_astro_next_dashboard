'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

import { ToastMessage } from '@/components/ui/toast-message';
import { cn } from '@/lib/utils';

type CategoryRow = { id: string; name: string };
type VideoType = 'individual' | 'categoryPack';
const LANGUAGE_OPTIONS = ['Telugu', 'Tamil', 'Hindi', 'English'] as const;

/* Small presentational helpers (design only) */
function SectionCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5 md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
          {step}
        </span>
        <div>
          <h2 className="text-[15px] font-bold text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-ink-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>}
    </div>
  );
}

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
  const [hlsUrl, setHlsUrl] = useState('');
  const [topics, setTopics] = useState('Intro, Core, Practice, Summary');
  const [isFree, setIsFree] = useState(false);
  const [accessValidityDays, setAccessValidityDays] = useState(30);
  const [categoryName, setCategoryName] = useState('General');

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const showPricingFields = videoType === 'individual' && !isFree;
  const posterSrc = thumbnailPreview || thumbnailUrl;
  const parsedTopics = topics.split(',').map((s) => s.trim()).filter(Boolean);
  const previewPrice = videoType === 'individual' && isFree ? 'Free' : individualPriceLabel || priceLabel;

  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/categories', { credentials: 'include' });
      if (!res.ok) return;
      const data = (await res.json()) as { categories: CategoryRow[] };
      const filtered = (data.categories || []).filter((c) => c.name !== 'General');
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
      const normalizedCategory = videoType === 'categoryPack' ? categoryName : categories[0]?.name ?? categoryName;

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
          individualPriceLabel: videoType === 'individual' && isFree ? 'Free' : individualPriceLabel || undefined,
          rating,
          description,
          thumbnailUrl: finalThumbnailUrl,
          dashUrl,
          hlsUrl: hlsUrl.trim() ? hlsUrl.trim() : undefined,
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
    <div className="space-y-5">
      <ToastMessage message={toast?.text ?? null} kind={toast?.kind} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/content/videos" className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand-600">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m14 6-6 6 6 6" /></svg>
            Back to all courses
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-ink">Create New Course</h1>
          <p className="mt-1 text-sm text-ink-muted">Poster upload chేసి, stream URL paste chేసి, category assign chేయండి.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-[1fr_360px] xl:items-start">
        {/* ---------------- LEFT: form ---------------- */}
        <div className="space-y-5">
          {/* Step 1 — type */}
          <SectionCard step={1} title="Course Type" subtitle="Individual video or category pack lo add chేయాలా.">
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  { key: 'individual', title: 'Individual Course', desc: 'Single video with its own pricing / free option.', icon: <PlayIcon /> },
                  { key: 'categoryPack', title: 'Category Pack Video', desc: 'Auto-adds this video to the selected category pack.', icon: <PackIcon /> },
                ] as const
              ).map((opt) => {
                const active = videoType === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setVideoType(opt.key)}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-3.5 text-left transition',
                      active ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-400/20' : 'border-line bg-surface hover:border-brand-200 hover:bg-surface-2'
                    )}>
                    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-brand-500 text-white' : 'bg-surface-2 text-ink-muted')}>
                      {opt.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">{opt.title}</span>
                      <span className="mt-0.5 block text-xs text-ink-soft">{opt.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Step 2 — media */}
          <SectionCard step={2} title="Media & Streaming" subtitle="Poster image + stream URLs.">
            <Field label="Poster image" hint="16:9 image best. Cloud ki auto-upload avుతుంది.">
              <label
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
                  posterSrc ? 'border-brand-200 bg-brand-50/40' : 'border-line bg-surface-2 hover:border-brand-300 hover:bg-brand-50/30'
                )}>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={loading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setThumbnailFile(f);
                      setThumbnailPreview(URL.createObjectURL(f));
                    }
                  }}
                />
                {posterSrc ? (
                  <div className="flex flex-col items-center gap-2">
                    <Image src={posterSrc} alt="Poster preview" width={220} height={124} unoptimized className="h-28 w-48 rounded-lg border border-line object-cover shadow-card" />
                    <span className="text-xs font-semibold text-brand-600">Change poster</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-ink-soft">
                    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="m3 15 5-5 4 4 3-3 6 6" /><circle cx="8.5" cy="9" r="1.4" />
                    </svg>
                    <span className="text-sm font-semibold text-ink-muted">Click to upload poster</span>
                    <span className="text-[11px]">PNG / JPG / WEBP</span>
                  </div>
                )}
              </label>
              {uploadingThumb ? (
                <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
                  Uploading to cloud…
                </div>
              ) : null}
            </Field>

            <div className="mt-4 grid gap-4">
              <Field label="DASH stream URL (Android)">
                <input className="input" value={dashUrl} onChange={(e) => setDashUrl(e.target.value)} placeholder="https://.../output.mpd" required />
              </Field>
              <Field label="HLS stream URL (iOS / App Store)" hint="iPhone users ki .m3u8 (HLS) kavali. Android DASH (.mpd) vాడుతుంది.">
                <input className="input" value={hlsUrl} onChange={(e) => setHlsUrl(e.target.value)} placeholder="https://.../output.m3u8" />
              </Field>
            </div>
          </SectionCard>

          {/* Step 3 — details */}
          <SectionCard step={3} title="Course Details" subtitle="Title, category, and metadata.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" className="sm:col-span-2">
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Nakshatra Rahasyalu" required />
              </Field>
              {videoType === 'categoryPack' ? (
                <Field label="Category (required for pack)" className="sm:col-span-2">
                  <select className="input" value={categoryName} onChange={(e) => setCategoryName(e.target.value)}>
                    {categories.length === 0 && <option value="">No categories — create one first</option>}
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </Field>
              ) : null}
              <Field label="Duration label">
                <input className="input" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="1h 00m" />
              </Field>
              <Field label="Language">
                <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </Field>
              <Field label="Rating" hint="0 – 5">
                <input type="number" step="0.1" min={0} max={5} className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))} />
              </Field>
            </div>

            <Field label="Topics (comma separated)" className="mt-4" hint={`${parsedTopics.length} topic${parsedTopics.length === 1 ? '' : 's'} added`}>
              <input className="input" value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Intro, Core, Practice, Summary" />
            </Field>
            {parsedTopics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {parsedTopics.map((t, i) => (
                  <span key={`${t}-${i}`} className="chip bg-brand-50 text-brand-700">{t}</span>
                ))}
              </div>
            )}

            <Field label="Description" className="mt-4">
              <textarea className="input min-h-[110px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Course gurించి konni lines rasి…" required />
            </Field>
          </SectionCard>

          {/* Step 4 — pricing */}
          <SectionCard step={4} title="Pricing & Access" subtitle="Free course లేదా paid pricing.">
            {videoType === 'individual' ? (
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-surface-2 px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-ink">Free course</span>
                  <span className="text-xs text-ink-soft">On chేస్తే ee course anందరికీ free.</span>
                </span>
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-brand-600"
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
              </label>
            ) : (
              <div className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs font-medium text-brand-700">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
                Ee video select chేసిన category pack lo automatic ga add avుతుంది. Pricing pack level lo untది.
              </div>
            )}

            {showPricingFields ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Price label (UI)">
                  <input className="input" value={priceLabel} onChange={(e) => setPriceLabel(e.target.value)} placeholder="Premium" />
                </Field>
                <Field label="Individual price label" hint="Final payment amount ee label nుంచి auto-calculate avుతుంది.">
                  <input className="input" value={individualPriceLabel} onChange={(e) => setIndividualPriceLabel(e.target.value)} placeholder="₹999" />
                </Field>
                <Field label="Validity days after purchase" hint="0 pెడితే unlimited validity." className="sm:col-span-2">
                  <input type="number" min={0} className="input" value={accessValidityDays} onChange={(e) => setAccessValidityDays(Math.max(0, Number(e.target.value) || 0))} />
                </Field>
              </div>
            ) : null}
          </SectionCard>
        </div>

        {/* ---------------- RIGHT: sticky preview + submit ---------------- */}
        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Live Preview</p>
            </div>
            <div className="p-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-surface-2">
                {posterSrc ? (
                  <Image src={posterSrc} alt="preview" fill unoptimized className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-ink-soft">Poster preview</div>
                )}
                <span className="absolute left-2 top-2 chip bg-black/60 text-white">{duration || '—'}</span>
                {previewPrice && (
                  <span className={cn('absolute right-2 top-2 chip', isFree ? 'bg-emerald-500 text-white' : 'bg-white/90 text-ink')}>{previewPrice}</span>
                )}
              </div>
              <h3 className="mt-3 line-clamp-2 text-sm font-bold text-ink">{title || 'Untitled course'}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="chip bg-surface-2 text-ink-muted">{language}</span>
                <span className="chip bg-amber-50 text-amber-600">★ {rating.toFixed(1)}</span>
                <span className="chip bg-violet-50 text-violet-600">{videoType === 'individual' ? 'Individual' : categoryName || 'Pack'}</span>
              </div>
              {/* readiness checklist */}
              <ul className="mt-4 space-y-1.5 border-t border-line pt-3 text-xs">
                <Check ok={Boolean(title.trim())} label="Title added" />
                <Check ok={Boolean(posterSrc)} label="Poster image" />
                <Check ok={Boolean(dashUrl.trim())} label="DASH stream URL" />
                <Check ok={parsedTopics.length > 0} label="At least one topic" />
                <Check ok={Boolean(description.trim())} label="Description" />
              </ul>
            </div>
          </div>

          {message ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{message}</p>
          ) : null}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (thumbnailFile && uploadingThumb ? 'Uploading poster…' : 'Saving course…') : 'Create Course'}
          </button>
          <Link href="/dashboard/content/videos" className="btn-ghost w-full">Cancel</Link>
        </aside>
      </form>
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn('flex h-4 w-4 items-center justify-center rounded-full', ok ? 'bg-emerald-500 text-white' : 'bg-surface-2 text-ink-soft ring-1 ring-line')}>
        {ok ? (
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg>
        ) : null}
      </span>
      <span className={ok ? 'text-ink-muted' : 'text-ink-soft'}>{label}</span>
    </li>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M10 9.5v5l4-2.5-4-2.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function PackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  );
}
