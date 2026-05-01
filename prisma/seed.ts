import { PrismaClient } from '@prisma/client';

import { hashPassword } from '../src/lib/password';

const prisma = new PrismaClient();

const DEMO_DASH =
  'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd';

const thumb = (seed: string) => `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/450`;

type SeedVideo = {
  title: string;
  subtitle: string;
  meta: string;
  duration: string;
  level: string;
  language: string;
  lessons: number;
  priceLabel: string;
  individualPriceLabel?: string;
  checkoutAmountCents?: number;
  rating: number;
  description: string;
  topics: string[];
  isFree: boolean;
  categoryName: string;
  inPack?: boolean;
};

const categories: {
  name: string;
  packPriceLabel: string;
  checkoutAmountCents: number;
  sortOrder: number;
}[] = [
  { name: 'Beginner', packPriceLabel: '₹4,999', checkoutAmountCents: 499_900, sortOrder: 0 },
  { name: 'Prediction', packPriceLabel: '₹7,999', checkoutAmountCents: 799_900, sortOrder: 1 },
  { name: 'Remedies', packPriceLabel: '₹3,499', checkoutAmountCents: 349_900, sortOrder: 2 },
  { name: 'Career & Finance', packPriceLabel: '₹4,499', checkoutAmountCents: 449_900, sortOrder: 3 },
];

const videos: SeedVideo[] = [
  {
    title: 'Nakshatra Foundations',
    subtitle: 'Basics & lunar mansions',
    meta: '12,580 learners',
    duration: '3h 20m',
    level: 'Beginner',
    language: 'Telugu',
    lessons: 14,
    priceLabel: 'Owned',
    individualPriceLabel: '₹999',
    rating: 4.6,
    description:
      'Nakshatra basics ni practical examples tho step-by-step ga nerchukoni, chart lo quick interpretation cheyyadaniki strong base istundi.',
    topics: ['What is Nakshatra', 'Pada concepts', 'Moon-based reading', 'Beginner chart examples'],
    isFree: false,
    categoryName: 'Beginner',
  },
  {
    title: 'Transit Prediction Basics',
    subtitle: 'Timing & dasha flow',
    meta: '9,240 learners',
    duration: '2h 45m',
    level: 'Intermediate',
    language: 'Telugu',
    lessons: 11,
    priceLabel: 'Owned',
    individualPriceLabel: '₹1,199',
    rating: 4.4,
    description:
      'Transit + dasha combination tho events timing ela estimate cheyyalo structured ga explain chestundi.',
    topics: ['Transit fundamentals', 'Dasha sync', 'Timing windows', 'Prediction mistakes'],
    isFree: false,
    categoryName: 'Prediction',
  },
  {
    title: 'Karma Houses Deep Dive',
    subtitle: 'Houses & life themes',
    meta: '8,120 learners',
    duration: '2h 10m',
    level: 'Intermediate',
    language: 'Telugu',
    lessons: 9,
    priceLabel: 'Live Session',
    individualPriceLabel: '₹899',
    rating: 4.5,
    description:
      '12 houses significance ni life themes perspective lo decode chesi real-world use cases tho cover chestundi.',
    topics: ['House meanings', 'Karma mapping', 'Life-event links', 'Practical interpretation'],
    isFree: false,
    categoryName: 'Prediction',
  },
  {
    title: 'Dasha Practical Case Study',
    subtitle: 'Real chart walkthrough',
    meta: '15,200 learners',
    duration: '1h 55m',
    level: 'Advanced',
    language: 'Telugu',
    lessons: 8,
    priceLabel: 'Live Session',
    individualPriceLabel: '₹1,499',
    rating: 4.7,
    description:
      'Real charts ni breakdown chestu, prediction structure build cheyyadaniki case-study format lo guide chestundi.',
    topics: ['Case selection', 'Dasha breakdown', 'Transit validation', 'Final prediction notes'],
    isFree: false,
    categoryName: 'Prediction',
  },
  {
    title: 'Marriage Compatibility Logic',
    subtitle: 'Synastry essentials',
    meta: '11,400 learners',
    duration: '2h 30m',
    level: 'Intermediate',
    language: 'Telugu',
    lessons: 10,
    priceLabel: 'Live Session',
    individualPriceLabel: '₹1,099',
    rating: 4.3,
    description:
      'Compatibility assessment lo most-used rules ni simple checklists tho explain chesi confusion taggistundi.',
    topics: ['Matching fundamentals', 'Dosha checks', 'Synastry basics', 'Decision framework'],
    isFree: false,
    categoryName: 'Prediction',
  },
  {
    title: 'Vimshottari Dasha Full Course',
    subtitle: 'Complete dasha system',
    meta: '22,100 learners',
    duration: '6h 40m',
    level: 'Advanced',
    language: 'Telugu',
    lessons: 24,
    priceLabel: 'Premium',
    individualPriceLabel: '₹1,999',
    rating: 4.8,
    description:
      'Vimshottari Dasha ni foundation nunchi advanced application varaku complete ga cover chese flagship course.',
    topics: ['Mahadasha logic', 'Antardasha impact', 'Event timing', 'Advanced interpretation'],
    isFree: false,
    categoryName: 'Prediction',
    inPack: true,
  },
  {
    title: 'Transit Timing Masterclass',
    subtitle: 'Predict with transits',
    meta: '14,300 learners',
    duration: '4h 10m',
    level: 'Advanced',
    language: 'Telugu',
    lessons: 16,
    priceLabel: 'Premium',
    individualPriceLabel: '₹1,499',
    rating: 4.6,
    description:
      'Transit-based event timing ni repeatable method ga build cheyyadaniki charts, rules, exceptions cover chestundi.',
    topics: ['Transit layers', 'Event windowing', 'Prioritizing planets', 'Prediction confidence'],
    isFree: false,
    categoryName: 'Prediction',
    inPack: true,
  },
  {
    title: 'Astrology Foundations 101',
    subtitle: 'Start from zero',
    meta: '45,200 learners',
    duration: '2h 15m',
    level: 'Beginner',
    language: 'Telugu',
    lessons: 12,
    priceLabel: 'FREE',
    rating: 4.7,
    description: 'Zero nunchi astrology fundamentals ni simple Telugu explanations tho cover chestundi.',
    topics: ['History', 'Zodiac basics', 'Houses intro', 'Practice'],
    isFree: true,
    categoryName: 'Beginner',
    inPack: true,
  },
  {
    title: 'How to Read Birth Charts',
    subtitle: 'Step-by-step charts',
    meta: '31,600 learners',
    duration: '2h 40m',
    level: 'Beginner',
    language: 'Telugu',
    lessons: 14,
    priceLabel: 'FREE',
    rating: 4.6,
    description: 'Birth chart layout, house mapping, and first-pass reading workflow.',
    topics: ['Chart layout', 'Ascendant', 'House mapping', 'Practice chart'],
    isFree: true,
    categoryName: 'Beginner',
    inPack: true,
  },
  {
    title: 'Planets & Houses Essentials',
    subtitle: 'Core building blocks',
    meta: '18,400 learners',
    duration: '3h 05m',
    level: 'Beginner',
    language: 'Telugu',
    lessons: 16,
    priceLabel: '₹1,299',
    individualPriceLabel: '₹1,299',
    rating: 4.5,
    description: 'Planets, houses, and karakatwa essentials for confident basics.',
    topics: ['Planets', 'Houses', 'Significations', 'Blending'],
    isFree: false,
    categoryName: 'Beginner',
    inPack: true,
  },
  {
    title: 'Prashna Basics',
    subtitle: 'Horary intro',
    meta: '7,800 learners',
    duration: '1h 50m',
    level: 'Intermediate',
    language: 'Telugu',
    lessons: 7,
    priceLabel: 'FREE',
    rating: 4.3,
    description: 'Prashna / horary entry module with simple decision rules.',
    topics: ['Question charts', 'Timing', 'Yes/no framework', 'Cautions'],
    isFree: true,
    categoryName: 'Prediction',
    inPack: true,
  },
  {
    title: 'Planetary Remedies Handbook',
    subtitle: 'Remedies that work',
    meta: '19,800 learners',
    duration: '2h 20m',
    level: 'Beginner',
    language: 'Telugu',
    lessons: 10,
    priceLabel: 'FREE',
    rating: 4.5,
    description: 'Structured overview of common remedial approaches.',
    topics: ['Mantras', 'Charity', 'Lifestyle', 'Ethics'],
    isFree: true,
    categoryName: 'Remedies',
    inPack: true,
  },
  {
    title: 'Gemstones & Mantras Explained',
    subtitle: 'Premium bonus module',
    meta: '6,900 learners',
    duration: '2h 00m',
    level: 'Intermediate',
    language: 'Telugu',
    lessons: 9,
    priceLabel: '₹899',
    individualPriceLabel: '₹899',
    rating: 4.4,
    description: 'Gem selection cautions and mantra discipline explained clearly.',
    topics: ['Gems', 'Mantras', 'Contraindications', 'Ritual hygiene'],
    isFree: false,
    categoryName: 'Remedies',
    inPack: true,
  },
  {
    title: 'Temple Remedies Guide',
    subtitle: 'Rituals & timing',
    meta: '8,100 learners',
    duration: '2h 25m',
    level: 'Intermediate',
    language: 'Telugu',
    lessons: 8,
    priceLabel: '₹1,199',
    individualPriceLabel: '₹1,199',
    rating: 4.7,
    description: 'Temple-based remedial approaches and timing windows.',
    topics: ['Temple mapping', 'Timing', 'Offerings', 'Documentation'],
    isFree: false,
    categoryName: 'Remedies',
    inPack: true,
  },
  {
    title: 'Career Houses Deep Dive',
    subtitle: '10th & 6th focus',
    meta: '12,400 learners',
    duration: '3h 10m',
    level: 'Intermediate',
    language: 'Telugu',
    lessons: 12,
    priceLabel: '₹1,799',
    individualPriceLabel: '₹1,799',
    rating: 4.6,
    description: 'Career-focused house analysis with practical examples.',
    topics: ['10th house', '6th house', 'D10 intro', 'Case snippets'],
    isFree: false,
    categoryName: 'Career & Finance',
    inPack: true,
  },
  {
    title: 'Finance Yogas Explained',
    subtitle: 'Wealth combinations',
    meta: '9,200 learners',
    duration: '2h 35m',
    level: 'Intermediate',
    language: 'Telugu',
    lessons: 10,
    priceLabel: 'FREE',
    rating: 4.5,
    description: 'Wealth yogas and finance houses in a structured checklist format.',
    topics: ['Dhana yogas', '2nd/11th', 'Risk framing', 'Examples'],
    isFree: true,
    categoryName: 'Career & Finance',
    inPack: true,
  },
  {
    title: 'Business Timing with Dasha',
    subtitle: 'Launch & growth',
    meta: '6,600 learners',
    duration: '2h 45m',
    level: 'Intermediate',
    language: 'Telugu',
    lessons: 11,
    priceLabel: '₹1,299',
    individualPriceLabel: '₹1,299',
    rating: 4.4,
    description: 'Business decisions aligned with dasha and transit windows.',
    topics: ['Launch timing', 'Partnerships', 'Cashflow cycles', 'Case study'],
    isFree: false,
    categoryName: 'Career & Finance',
    inPack: true,
  },
];

const packOrder: Record<string, string[]> = {
  Beginner: ['Astrology Foundations 101', 'How to Read Birth Charts', 'Planets & Houses Essentials'],
  Prediction: ['Vimshottari Dasha Full Course', 'Transit Timing Masterclass', 'Prashna Basics'],
  Remedies: ['Planetary Remedies Handbook', 'Gemstones & Mantras Explained', 'Temple Remedies Guide'],
  'Career & Finance': ['Career Houses Deep Dive', 'Finance Yogas Explained', 'Business Timing with Dasha'],
};

async function main() {
  // await prisma.order.deleteMany();
  // await prisma.categoryPackItem.deleteMany();
  // await prisma.video.deleteMany();
  // await prisma.category.deleteMany();
  // await prisma.adminUser.deleteMany();

  const passwordHash = await hashPassword(process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!');

  await prisma.adminUser.create({
    data: {
      email: process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com',
      passwordHash,
    },
  });

  const catMap = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.category.create({
      data: {
        name: c.name,
        packPriceLabel: c.packPriceLabel,
        checkoutAmountCents: c.checkoutAmountCents,
        sortOrder: c.sortOrder,
      },
    });
    catMap.set(c.name, row.id);
  }

  const videoIdByTitle = new Map<string, string>();

  let sort = 0;
  for (const v of videos) {
    const categoryId = catMap.get(v.categoryName);
    if (!categoryId) {
      throw new Error(`Missing category ${v.categoryName}`);
    }
    const row = await prisma.video.create({
      data: {
        title: v.title,
        subtitle: v.subtitle,
        meta: v.meta,
        duration: v.duration,
        level: v.level,
        language: v.language,
        lessons: v.lessons,
        priceLabel: v.priceLabel,
        individualPriceLabel: v.individualPriceLabel,
        checkoutAmountCents: v.checkoutAmountCents ?? (v.isFree ? 0 : 99_900),
        rating: v.rating,
        description: v.description,
        thumbnailUrl: thumb(v.title),
        dashUrl: DEMO_DASH,
        topicsJson: JSON.stringify(v.topics),
        isFree: v.isFree,
        published: true,
        sortOrder: sort++,
        categoryId,
      },
    });
    videoIdByTitle.set(v.title, row.id);
  }

  for (const [catName, titles] of Object.entries(packOrder)) {
    const categoryId = catMap.get(catName);
    if (!categoryId) {
      continue;
    }
    let i = 0;
    for (const title of titles) {
      const videoId = videoIdByTitle.get(title);
      if (!videoId) {
        continue;
      }
      await prisma.categoryPackItem.create({
        data: {
          categoryId,
          videoId,
          sortOrder: i++,
        },
      });
    }
  }

  // Catalog videos that are not in pack rows still exist as Video rows (Prediction deep courses etc.)

  console.log('Seed complete. Admin:', process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
