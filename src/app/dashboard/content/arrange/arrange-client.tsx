'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ToastMessage } from '@/components/ui/toast-message';
import { cn } from '@/lib/utils';

export type ArrangeCategory = { id: string; name: string };
export type ArrangeVideo = { id: string; title: string; published: boolean; thumbnailUrl: string };

function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function ArrowBtn({ dir, disabled, onClick }: { dir: 'up' | 'down'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={dir === 'up' ? 'Move up' : 'Move down'}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-lg border transition',
        disabled ? 'cursor-not-allowed border-line bg-surface-2 text-ink-soft opacity-50' : 'border-line bg-surface text-ink-muted hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600'
      )}>
      <svg viewBox="0 0 24 24" className={cn('h-4 w-4', dir === 'down' && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 15 6-6 6 6" />
      </svg>
    </button>
  );
}

export function ArrangeClient({
  categories,
  videosByCategory,
}: {
  categories: ArrangeCategory[];
  videosByCategory: Record<string, ArrangeVideo[]>;
}) {
  const [cats, setCats] = useState<ArrangeCategory[]>(categories);
  const [vids, setVids] = useState<Record<string, ArrangeVideo[]>>(videosByCategory);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; kind: 'success' | 'error' | 'info' } | null>(null);

  function moveCategory(index: number, dir: -1 | 1) {
    setCats((prev) => move(prev, index, dir));
    setDirty(true);
  }
  function moveVideo(catId: string, index: number, dir: -1 | 1) {
    setVids((prev) => ({ ...prev, [catId]: move(prev[catId] ?? [], index, dir) }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    setToast(null);
    try {
      // Category order = index; video order = index within its category.
      const catItems = cats.map((c, i) => ({ id: c.id, sortOrder: i }));
      const videoItems = cats.flatMap((c) => (vids[c.id] ?? []).map((v, i) => ({ id: v.id, sortOrder: i })));

      const [catRes, vidRes] = await Promise.all([
        fetch('/api/admin/categories/reorder', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: catItems }),
        }),
        videoItems.length
          ? fetch('/api/admin/videos/reorder', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items: videoItems }),
            })
          : Promise.resolve(new Response(JSON.stringify({ ok: true }))),
      ]);

      if (!catRes.ok || !vidRes.ok) {
        setToast({ text: 'Save failed — malli try cheయండి', kind: 'error' });
        return;
      }
      setDirty(false);
      setToast({ text: 'Display order saved ✓ App lo reflect avుతుంది', kind: 'success' });
    } catch {
      setToast({ text: 'Network error', kind: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 pb-24">
      <ToastMessage message={toast?.text ?? null} kind={toast?.kind} onClose={() => setToast(null)} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/content/videos" className="mb-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-brand-600">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m14 6-6 6 6 6" /></svg>
            Back to courses
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-ink">Display Order</h1>
          <p className="mt-1 text-sm text-ink-muted">App lo courses ఏ order lo kనిపించాలో ఇక్కడ set chేయండి. Up/down tో move chేసి Save chేయండి.</p>
        </div>
        <button type="button" onClick={save} disabled={!dirty || saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save order'}
        </button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-xs text-brand-700">
        <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" /></svg>
        App lo courses mundు <b>category order</b> prakారం, aa taruvata prati category lopala <b>video order</b> prakారం display avుతాయi. Change chేసాక <b>Save order</b> nొక్కండి.
      </div>

      {/* Category order */}
      <section className="card p-5">
        <h2 className="mb-1 text-[15px] font-bold text-ink">1 · Category Order</h2>
        <p className="mb-4 text-xs text-ink-soft">Ee order lo category sections app lo kనిపిస్తాయి.</p>
        <div className="space-y-2">
          {cats.map((c, i) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
              <span className="flex-1 truncate text-sm font-semibold text-ink">{c.name}</span>
              <span className="chip bg-surface text-ink-soft">{(vids[c.id] ?? []).length} videos</span>
              <div className="flex gap-1">
                <ArrowBtn dir="up" disabled={i === 0} onClick={() => moveCategory(i, -1)} />
                <ArrowBtn dir="down" disabled={i === cats.length - 1} onClick={() => moveCategory(i, 1)} />
              </div>
            </div>
          ))}
          {cats.length === 0 && <p className="text-sm text-ink-soft">No categories.</p>}
        </div>
      </section>

      {/* Videos within each category */}
      <section className="space-y-4">
        <h2 className="text-[15px] font-bold text-ink">2 · Video Order (per category)</h2>
        {cats.map((c) => {
          const list = vids[c.id] ?? [];
          return (
            <div key={c.id} className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-sm font-bold text-ink">{c.name}</h3>
                <span className="chip bg-surface-2 text-ink-soft">{list.length}</span>
              </div>
              {list.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line bg-surface-2 py-6 text-center text-xs text-ink-soft">Ee category lo videos ledు.</p>
              ) : (
                <div className="space-y-2">
                  {list.map((v, i) => (
                    <div key={v.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-[11px] font-bold text-brand-600">{i + 1}</span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={v.thumbnailUrl} alt="" className="h-9 w-14 shrink-0 rounded-md border border-line object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />
                      <span className="flex-1 truncate text-sm font-medium text-ink">{v.title}</span>
                      {!v.published && <span className="chip bg-amber-50 text-amber-600">Draft</span>}
                      <div className="flex gap-1">
                        <ArrowBtn dir="up" disabled={i === 0} onClick={() => moveVideo(c.id, i, -1)} />
                        <ArrowBtn dir="down" disabled={i === list.length - 1} onClick={() => moveVideo(c.id, i, 1)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {/* Sticky save bar when dirty */}
      {dirty && (
        <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-pop">
          <span className="text-sm font-medium text-ink">Unsaved order changes</span>
          <button type="button" onClick={save} disabled={saving} className="btn-primary !py-2">
            {saving ? 'Saving…' : 'Save order'}
          </button>
        </div>
      )}
    </div>
  );
}
