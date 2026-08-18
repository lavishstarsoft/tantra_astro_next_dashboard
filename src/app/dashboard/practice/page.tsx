import { prisma } from '@/lib/prisma';
import { PracticeGlobalToggle } from '@/components/practice-global-toggle';
import { PracticeVideoActions } from '@/components/practice-video-actions';

export const dynamic = 'force-dynamic';

export default async function PracticePage() {
  const [cfg, videos] = await Promise.all([
    prisma.appHomeConfig.findUnique({ where: { key: 'default' } }),
    prisma.video.findMany({
      orderBy: [{ categoryId: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        title: true,
        topicsJson: true,
        practiceEnabled: true,
        _count: { select: { quizQuestions: true } },
      },
    }),
  ]);
  const globalOn = cfg?.practiceMasterEnabled ?? false;

  const parseTopic = (json: string): string => {
    try {
      const arr = JSON.parse(json) as string[];
      return arr[0] ?? '—';
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Practice &amp; Master</h1>
          <p className="mt-1 text-sm text-slate-500">
            iOS-only quizzes per lesson. Global switch controls the whole feature; per-lesson switch controls each video.
          </p>
        </div>
        <PracticeGlobalToggle enabled={globalOn} />
      </div>

      {!globalOn ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Global Practice &amp; Master is OFF — the feature is hidden in the app for every lesson.
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Lesson</th>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3">Practice</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {videos.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{v.title}</td>
                <td className="px-4 py-3 text-slate-600">{parseTopic(v.topicsJson)}</td>
                <td className="px-4 py-3 text-slate-600">{v._count.quizQuestions}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      v.practiceEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {v.practiceEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <PracticeVideoActions videoId={v.id} practiceEnabled={v.practiceEnabled} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
