import { prisma } from '@/lib/prisma';
import { ArrangeClient, type ArrangeCategory, type ArrangeVideo } from './arrange-client';

export const dynamic = 'force-dynamic';

export default async function ArrangePage() {
  const [categories, videos] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.video.findMany({
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      select: { id: true, title: true, categoryId: true, published: true, thumbnailUrl: true },
    }),
  ]);

  const cats: ArrangeCategory[] = categories.map((c) => ({ id: c.id, name: c.name }));
  const videosByCategory: Record<string, ArrangeVideo[]> = {};
  for (const c of categories) videosByCategory[c.id] = [];
  for (const v of videos) {
    (videosByCategory[v.categoryId] ??= []).push({
      id: v.id,
      title: v.title,
      published: v.published,
      thumbnailUrl: v.thumbnailUrl,
    });
  }

  return <ArrangeClient categories={cats} videosByCategory={videosByCategory} />;
}
