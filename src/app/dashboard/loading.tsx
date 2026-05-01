export default function DashboardLoading() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
          <p className="text-sm font-semibold text-slate-700">Loading dashboard…</p>
        </div>
        <div className="mt-4 grid w-[320px] gap-2">
          <div className="h-3 w-11/12 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-9/12 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-10/12 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

