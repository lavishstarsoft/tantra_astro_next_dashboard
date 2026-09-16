/**
 * One-off seed: enable Practice & Master globally, enable it on one lesson,
 * and add 5 educational (deterministic, factual) Vedic-astrology questions.
 * Run: node_modules/.bin/tsx prisma/seed-quiz.ts  [optional exact video title]
 */
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../.env.local') });
config({ path: join(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const QUESTIONS = [
  {
    prompt: 'How many Nakshatras are there in the Vedic zodiac?',
    options: ['12', '27', '30', '108'],
    correctIndex: 1,
    explanation: 'The 360° zodiac is divided into 27 Nakshatras (lunar mansions), each spanning 13°20′.',
    topic: 'Vedic Basics',
  },
  {
    prompt: 'How many Rashis (zodiac signs) make up the zodiac?',
    options: ['9', '12', '27', '7'],
    correctIndex: 1,
    explanation: 'There are 12 Rashis, each 30° wide, together covering the full 360° circle.',
    topic: 'Vedic Basics',
  },
  {
    prompt: 'How many grahas are counted in the Navagraha?',
    options: ['7', '9', '12', '27'],
    correctIndex: 1,
    explanation: 'Nava means nine: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu and Ketu.',
    topic: 'Navagraha',
  },
  {
    prompt: 'Which of these is a shadow point (chaya graha), not a physical planet?',
    options: ['Guru (Jupiter)', 'Shukra (Venus)', 'Rahu', 'Budha (Mercury)'],
    correctIndex: 2,
    explanation: 'Rahu and Ketu are the lunar nodes — chaya (shadow) grahas — not physical planets.',
    topic: 'Navagraha',
  },
  {
    prompt: 'Each Nakshatra is divided into how many padas (quarters)?',
    options: ['2', '3', '4', '9'],
    correctIndex: 2,
    explanation: 'Every Nakshatra has 4 padas of 3°20′ each, giving 27 × 4 = 108 padas in total.',
    topic: 'Nakshatra',
  },
];

async function main() {
  const argTitle = process.argv[2];

  const videos = await prisma.video.findMany({
    where: { published: true },
    select: { id: true, title: true },
    orderBy: { title: 'asc' },
  });
  if (videos.length === 0) {
    console.log('No published videos found — cannot attach questions.');
    return;
  }

  const target =
    (argTitle && videos.find((v) => v.title === argTitle)) ||
    videos.find((v) => /rahu|kaal|kal sarp|sarpa/i.test(v.title)) ||
    videos[0];

  // Turn the feature on (global + this lesson).
  await prisma.appHomeConfig.upsert({
    where: { key: 'default' },
    update: { practiceMasterEnabled: true },
    create: { key: 'default', practiceMasterEnabled: true },
  });
  await prisma.video.update({ where: { id: target.id }, data: { practiceEnabled: true } });

  const existing = await prisma.quizQuestion.count({ where: { videoId: target.id } });
  if (existing > 0) {
    console.log(`Lesson "${target.title}" already has ${existing} question(s); skipped inserting to avoid duplicates.`);
  } else {
    await prisma.quizQuestion.createMany({
      data: QUESTIONS.map((q, i) => ({
        videoId: target.id,
        prompt: q.prompt,
        optionsJson: JSON.stringify(q.options),
        correctIndex: q.correctIndex,
        explanation: q.explanation,
        topic: q.topic,
        sortOrder: i,
        active: true,
      })),
    });
    console.log(`Added ${QUESTIONS.length} questions to lesson: "${target.title}".`);
  }

  console.log('Global Practice & Master: ON');
  console.log(`Practice enabled on lesson: "${target.title}"`);
  console.log(`Available published videos: ${videos.length}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e?.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
