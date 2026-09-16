export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      {/* hero + kpis */}
      <div className="grid gap-4 lg:grid-cols-[1.1fr_1.3fr]">
        <div className="skeleton h-44 rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="skeleton mt-4 h-3 w-24" />
              <div className="skeleton mt-2 h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
      {/* charts */}
      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="card p-5"><div className="skeleton mb-4 h-4 w-40" /><div className="skeleton h-56 w-full" /></div>
        <div className="card p-5"><div className="skeleton mb-4 h-4 w-32" /><div className="skeleton h-56 w-full" /></div>
      </div>
      {/* lists */}
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-5">
            <div className="skeleton mb-4 h-4 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="skeleton h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5"><div className="skeleton h-3 w-2/3" /><div className="skeleton h-2.5 w-1/2" /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
