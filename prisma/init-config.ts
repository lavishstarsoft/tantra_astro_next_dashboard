import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.appHomeConfig.upsert({
    where: { key: 'default' },
    update: {},
    create: {
      key: 'default',
      recommendedVideoTitlesJson: JSON.stringify(['Nakshatra Foundations', 'Vimshottari Dasha Full Course']),
      featuredCategoryNamesJson: JSON.stringify(['Beginner', 'Prediction']),
      showContinueWatching: true,
      isReviewMode: false,
      buyButtonText: 'Buy Now',
    },
  });
  console.log('AppHomeConfig created/updated');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
