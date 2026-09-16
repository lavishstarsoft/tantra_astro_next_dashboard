import { prisma } from '@/lib/prisma';
import { ShortsManager, type ShortRow } from '@/components/shorts-manager';

export const dynamic = 'force-dynamic';

export default async function ShortsPage() {
  const [rows, videos] = await Promise.all([
    prisma.shortLesson.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] }),
    prisma.video.findMany({ where: { published: true }, select: { title: true }, orderBy: { title: 'asc' } }),
  ]);
  const shorts: ShortRow[] = rows.map((s) => ({
    id: s.id,
    title: s.title,
    topic: s.topic,
    teacher: s.teacher,
    videoUrl: s.videoUrl,
    thumbnailUrl: s.thumbnailUrl,
    duration: s.duration,
    caption: s.caption,
    linkedVideoTitle: s.linkedVideoTitle,
    published: s.published,
    sortOrder: s.sortOrder,
  }));
  const videoTitles = videos.map((v) => v.title);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Quick Lessons (Shorts)</h1>
        <p className="mt-1 text-sm text-slate-500">
          Short vertical clips (9:16, 15–60s) shown in the app&apos;s shorts feed and Home rail. Upload a clip, add a
          title, and optionally link a full course.
        </p>
      </div>

      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        <p className="font-semibold">సింపుల్ గా ఎలా:</p>
        <p className="mt-1">
          1) కింద &quot;Add short&quot; లో <b>video file</b> (9:16 portrait) choose చేయండి → auto upload అవుతుంది.
          2) Title, topic, teacher నింపండి. 3) కావాలంటే <b>Link full course</b> ఎంచుకోండి. 4) <b>Save</b>. అది వెంటనే app లో కనిపిస్తుంది.
        </p>
      </div>

      <ShortsManager initial={shorts} videoTitles={videoTitles} />
    </div>
  );
}
