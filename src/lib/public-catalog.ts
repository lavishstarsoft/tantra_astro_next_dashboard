import type { Category, CategoryPackItem, Video } from '@prisma/client';

import { prisma } from '@/lib/prisma';

export type PublicCatalogVideo = {
  title: string;
  subtitle: string;
  meta: string;
  duration: string;
  level: string;
  language: string;
  lessons: number;
  priceLabel: string;
  individualPriceLabel?: string;
  rating: number;
  description: string;
  thumbnailUrl: string;
  topics: string[];
  category?: string;
  isFree?: boolean;
  accessValidityDays?: number;
  dashUrl: string;
};

export type PublicCategoryRow = {
  title: string;
  subtitle: string;
  meta: string;
  priceLabel: string;
  rating: number;
  thumbnailUrl: string;
};

export type PublicCatalogPayload = {
  version: number;
  updatedAt: string;
  carouselItems: {
    title: string;
    subtitle?: string;
    imageUrl: string;
    kind: string;
    target: string;
  }[];
  catalog: Record<string, PublicCatalogVideo>;
  videosByCategory: Record<string, PublicCategoryRow[]>;
  categoryThumbnailUrlByName: Record<string, string>;
  categoryPackTotalPrice: Record<string, string>;
  videoAccessByTitle: Record<string, { category: string; isFree: boolean }>;
  homeConfig: {
    recommendedVideoTitles: string[];
    featuredCategories: string[];
    showContinueWatching: boolean;
    isReviewMode: boolean;
    buyButtonText: string;
  };
};

type VideoWithCategory = Video & { category: Category };
type PackWithVideo = CategoryPackItem & { video: VideoWithCategory };

function absoluteUrl(pathOrUrl: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? '';
  const bucket = process.env.R2_BUCKET_NAME?.replace(/^\/+|\/+$/g, '');

  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    let normalizedRemote = pathOrUrl;
    try {
      const parsed = new URL(pathOrUrl);
      // Unwrap existing proxy URLs saved in old rows:
      // http://<app>/api/public/image?url=<remote>
      if (parsed.pathname === '/api/public/image') {
        const embedded = parsed.searchParams.get('url');
        if (embedded) {
          normalizedRemote = embedded;
        }
      }
    } catch {
      normalizedRemote = pathOrUrl;
    }

    try {
      const parsed = new URL(normalizedRemote);
      // Some rows may have old URLs like https://<public>.r2.dev/<bucket>/uploads/...
      // when the public domain is already bucket-scoped. Strip the bucket prefix for r2.dev hosts.
      if (parsed.hostname.endsWith('.r2.dev') && bucket) {
        const prefixed = `/${bucket}/`;
        if (parsed.pathname.startsWith(prefixed)) {
          parsed.pathname = parsed.pathname.slice(bucket.length + 1);
          normalizedRemote = parsed.toString();
        }
      }
    } catch {
      normalizedRemote = normalizedRemote;
    }

    // Cloudflare R2 API endpoints are often not publicly readable.
    // Serve through our public proxy so mobile app always gets a displayable image URL.
    if (normalizedRemote.includes('.r2.cloudflarestorage.com') && base) {
      return `${base}/api/public/image?url=${encodeURIComponent(normalizedRemote)}`;
    }
    return normalizedRemote;
  }
  if (!base) {
    return pathOrUrl;
  }
  return `${base}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export async function buildPublicCatalogPayload(): Promise<PublicCatalogPayload> {
  const now = new Date();
  const [videos, categories, packItems, carousel, homeConfig] = await Promise.all([
    prisma.video.findMany({
      where: { published: true },
      include: { category: true },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
    }),
    prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.categoryPackItem.findMany({
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
      include: { video: { include: { category: true } } },
    }),
    prisma.carouselItem.findMany({
      where: {
        active: true,
        OR: [{ startAt: null }, { startAt: { lte: now } }],
        AND: [{ OR: [{ endAt: null }, { endAt: { gte: now } }] }],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    }),
    prisma.appHomeConfig.findUnique({
      where: { key: 'default' },
    }),
  ]);

  const catalog: Record<string, PublicCatalogVideo> = {};
  for (const v of videos) {
    let topics: string[] = [];
    try {
      topics = JSON.parse(v.topicsJson) as string[];
    } catch {
      topics = [];
    }
    catalog[v.title] = {
      title: v.title,
      subtitle: v.subtitle,
      meta: v.meta,
      duration: v.duration,
      level: v.level,
      language: v.language,
      lessons: v.lessons,
      priceLabel: v.priceLabel,
      individualPriceLabel: v.individualPriceLabel ?? undefined,
      rating: v.rating,
      description: v.description,
      thumbnailUrl: absoluteUrl(v.thumbnailUrl),
      topics,
      category: v.category.name,
      isFree: v.isFree,
      accessValidityDays: v.accessValidityDays,
      dashUrl: v.dashUrl,
    };
  }

  const videosByCategory: Record<string, PublicCategoryRow[]> = {};
  const categoryThumbnailUrlByName: Record<string, string> = {};
  const categoryPackTotalPrice: Record<string, string> = {};
  for (const c of categories) {
    categoryPackTotalPrice[c.name] = c.packPriceLabel;
    videosByCategory[c.name] = [];
    categoryThumbnailUrlByName[c.name] = absoluteUrl(c.thumbnailUrl);
  }

  const packByCategory = new Map<string, PackWithVideo[]>();
  for (const p of packItems) {
    const list = packByCategory.get(p.categoryId) ?? [];
    list.push(p as PackWithVideo);
    packByCategory.set(p.categoryId, list);
  }

  for (const c of categories) {
    const items = packByCategory.get(c.id) ?? [];
    videosByCategory[c.name] = items.map((p) => ({
      title: p.video.title,
      subtitle: p.video.subtitle,
      meta: p.video.meta,
      priceLabel: p.video.priceLabel,
      rating: p.video.rating,
      thumbnailUrl: absoluteUrl(p.video.thumbnailUrl),
    }));
  }

  const videoAccessByTitle: Record<string, { category: string; isFree: boolean }> = {};
  for (const v of videos) {
    videoAccessByTitle[v.title] = {
      category: v.category.name,
      isFree: v.isFree,
    };
  }

  let recommendedVideoTitles: string[] = [];
  let featuredCategories: string[] = [];
  try {
    recommendedVideoTitles = JSON.parse(homeConfig?.recommendedVideoTitlesJson ?? '[]') as string[];
  } catch {
    recommendedVideoTitles = [];
  }
  try {
    featuredCategories = JSON.parse(homeConfig?.featuredCategoryNamesJson ?? '[]') as string[];
  } catch {
    featuredCategories = [];
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    carouselItems: carousel.map((c) => ({
      title: c.title,
      subtitle: c.subtitle || undefined,
      imageUrl: absoluteUrl(c.imageUrl),
      kind: c.kind,
      target: c.target,
    })),
    catalog,
    videosByCategory,
    categoryThumbnailUrlByName,
    categoryPackTotalPrice,
    videoAccessByTitle,
    homeConfig: {
      recommendedVideoTitles: recommendedVideoTitles.filter((title) => title in catalog),
      featuredCategories: featuredCategories.filter((name) => name in videosByCategory),
      showContinueWatching: homeConfig?.showContinueWatching ?? true,
      isReviewMode: homeConfig?.isReviewMode ?? false,
      buyButtonText: homeConfig?.buyButtonText ?? 'Buy Now',
    },
  };
}
