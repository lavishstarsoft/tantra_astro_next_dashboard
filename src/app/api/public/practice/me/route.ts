import { NextResponse } from 'next/server';

import { requireAppUser } from '@/lib/app-auth';
import { requireIos } from '@/lib/platform';
import { prisma } from '@/lib/prisma';

// iOS-only. Deterministic topic mastery + a simple learning roadmap.
export async function GET(req: Request) {
  const ios = requireIos(req);
  if (!ios.ok) return ios.response;
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

  const cfg = await prisma.appHomeConfig.findUnique({ where: { key: 'default' } });
  if (!cfg?.practiceMasterEnabled) {
    return NextResponse.json({ ok: true, mastery: [], roadmap: [] });
  }

  const [results, videos] = await Promise.all([
    prisma.quizResult.findMany({ where: { userId: gate.user.id } }),
    prisma.video.findMany({
      where: { practiceEnabled: true, published: true },
      select: {
        id: true,
        title: true,
        quizQuestions: { where: { active: true }, select: { id: true, topic: true } },
      },
    }),
  ]);

  // Mastery per topic = sum(correct)/sum(total) across attempts.
  const agg = new Map<string, { correct: number; total: number }>();
  for (const r of results) {
    const key = r.topic ?? 'General';
    const cur = agg.get(key) ?? { correct: 0, total: 0 };
    cur.correct += r.correct;
    cur.total += r.total;
    agg.set(key, cur);
  }
  const mastery = Array.from(agg.entries())
    .map(([topic, v]) => ({ topic, percent: v.total ? Math.round((v.correct / v.total) * 100) : 0 }))
    .sort((a, b) => a.percent - b.percent);

  const passedVideoIds = new Set(
    results.filter((r) => r.total > 0 && r.correct / r.total >= 0.7).map((r) => r.videoId),
  );

  // Roadmap: practice videos not yet passed, weakest-topic first, deterministic.
  const topicRank = new Map(mastery.map((m) => [m.topic, m.percent]));
  const roadmap = videos
    .filter((v) => v.quizQuestions.length > 0 && !passedVideoIds.has(v.id))
    .map((v) => {
      const topic = v.quizQuestions.find((q) => q.topic)?.topic ?? 'General';
      return { title: v.title, topic, topicPercent: topicRank.get(topic) ?? 0 };
    })
    .sort((a, b) => a.topicPercent - b.topicPercent || a.title.localeCompare(b.title))
    .slice(0, 5);

  return NextResponse.json({ ok: true, mastery, roadmap });
}
