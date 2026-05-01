export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Analytics</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          2025 LMS admin trends emphasize real-time completion and engagement KPIs, cohort funnels, and role-based
          views (executive vs. instructor). This placeholder keeps the navigation complete; wire your warehouse
          (BigQuery, Snowflake) or product analytics (PostHog, Amplitude) behind server routes when you are ready.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700">Completion Health</h2>
          <p className="mt-2 text-sm text-slate-500">Track course completion rate and median time-on-content by cohort and category.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700">Revenue Conversion</h2>
          <p className="mt-2 text-sm text-slate-500">Measure pack vs single-title conversion, checkout drop-off, and refund rate.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700">Audience Signals</h2>
          <p className="mt-2 text-sm text-slate-500">Analyze geo/device usage patterns from app telemetry and campaign sources.</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-700">Engagement Events</h2>
          <p className="mt-2 text-sm text-slate-500">Monitor search, bookmark, lesson-complete, and watch-time events via API routes.</p>
        </article>
      </div>
    </div>
  );
}
