'use client';

import { useEffect, useMemo, useState } from 'react';

type OptionVideo = { id: string; title: string; published: boolean };
type OptionCategory = { id: string; name: string };

type HomeConfigResponse = {
  config: Partial<{
    recommendedVideoTitles: string[];
    featuredCategories: string[];
    showContinueWatching: boolean;
    isReviewMode: boolean;
    buyButtonText: string;
  }>;
  options: Partial<{
    videos: OptionVideo[];
    categories: OptionCategory[];
  }>;
};

export default function HomeConfigPage() {
  const [videos, setVideos] = useState<OptionVideo[]>([]);
  const [categories, setCategories] = useState<OptionCategory[]>([]);
  const [recommendedVideoTitles, setRecommendedVideoTitles] = useState<string[]>([]);
  const [featuredCategories, setFeaturedCategories] = useState<string[]>([]);
  const [showContinueWatching, setShowContinueWatching] = useState(true);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [buyButtonText, setBuyButtonText] = useState('Buy Now');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const videoSet = useMemo(() => new Set(recommendedVideoTitles), [recommendedVideoTitles]);
  const categorySet = useMemo(() => new Set(featuredCategories), [featuredCategories]);

  async function refresh() {
    const res = await fetch('/api/admin/home-config', { credentials: 'include' });
    if (!res.ok) return;
    const json = (await res.json()) as HomeConfigResponse;
    setVideos(json.options?.videos ?? []);
    setCategories(json.options?.categories ?? []);
    setRecommendedVideoTitles(json.config?.recommendedVideoTitles ?? []);
    setFeaturedCategories(json.config?.featuredCategories ?? []);
    setShowContinueWatching(json.config?.showContinueWatching ?? true);
    setIsReviewMode(json.config?.isReviewMode ?? false);
    setBuyButtonText(json.config?.buyButtonText ?? 'Buy Now');
  }

  useEffect(() => {
    void refresh();
  }, []);

  function toggleVideo(title: string) {
    setRecommendedVideoTitles((prev) =>
      prev.includes(title) ? prev.filter((v) => v !== title) : [...prev, title]
    );
  }

  function toggleCategory(name: string) {
    setFeaturedCategories((prev) =>
      prev.includes(name) ? prev.filter((v) => v !== name) : [...prev, name]
    );
  }

  async function saveConfig() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/home-config', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendedVideoTitles,
          featuredCategories,
          showContinueWatching,
          isReviewMode,
          buyButtonText,
        }),
      });
      const json = (await res.json()) as { error?: unknown };
      if (!res.ok) {
        setMessage(typeof json.error === 'string' ? json.error : 'Save failed');
        return;
      }
      setMessage('Home config saved');
      await refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Home Sections Control</h1>
          <p className="mt-1 text-sm text-slate-500">Control what appears on app home screen.</p>
        </div>
        
        {/* Review Mode Badge */}
        {isReviewMode && (
          <div className="flex items-center gap-2 rounded-full bg-rose-500 px-4 py-1.5 shadow-sm shadow-rose-500/20">
             <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
             <span className="text-xs font-bold uppercase tracking-wider text-white">Review Mode Active</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-8">
        {/* Play Store Review Controls */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center gap-3 mb-6">
             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
             </div>
             <div>
               <h2 className="text-base font-bold text-slate-800">App Store Review Settings</h2>
               <p className="text-xs text-slate-500">Use these to bypass 30% commission rules during review.</p>
             </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className={`rounded-xl border p-4 transition-colors ${isReviewMode ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-white'}`}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  checked={isReviewMode}
                  onChange={(e) => setIsReviewMode(e.target.checked)}
                />
                <div className="flex flex-col gap-0.5">
                  <span className={`text-sm font-bold ${isReviewMode ? 'text-rose-700' : 'text-slate-700'}`}>Review Mode</span>
                  <span className="text-[11px] text-slate-500">Hides all &apos;Buy&apos; buttons and payment flows in the app.</span>
                </div>
              </label>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-slate-700">Buy Button Text Override</label>
                <input
                  type="text"
                  value={buyButtonText}
                  onChange={(e) => setBuyButtonText(e.target.value)}
                  placeholder="e.g. Buy Now, Get Access..."
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <span className="text-[10px] text-slate-500 italic">Custom label for transaction buttons when Review Mode is OFF.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              checked={showContinueWatching}
              onChange={(e) => setShowContinueWatching(e.target.checked)}
            />
            Show Continue Watching section (only displays when user has history)
          </label>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-800">Recommended Videos</h2>
          <p className="mb-4 text-xs text-slate-500">Only selected videos appear in Recommended section.</p>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => {
              const selected = videoSet.has(v.title);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggleVideo(v.title)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                    selected
                      ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <span className="text-sm font-medium truncate pr-2">{v.title}</span>
                  {selected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-800">Category Sections on Home</h2>
          <p className="mb-4 text-xs text-slate-500">Only selected categories appear in Category Wise section.</p>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const selected = categorySet.has(c.name);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.name)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                    selected
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <span className="text-sm font-medium truncate pr-2">{c.name}</span>
                  {selected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {message ? (
              <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                {message}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void saveConfig()}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-8 py-3 text-sm font-bold text-white hover:bg-black disabled:opacity-60 transition-all shadow-lg shadow-slate-200 active:scale-[0.98]">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </div>
            ) : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}

