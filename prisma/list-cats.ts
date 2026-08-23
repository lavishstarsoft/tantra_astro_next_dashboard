import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(__dirname, '../.env.local') });
config({ path: join(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const cats = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
  for (const c of cats) {
    const total = await prisma.video.count({ where: { categoryId: c.id } });
    const published = await prisma.video.count({ where: { categoryId: c.id, published: true } });
    console.log(`- "${c.name}"  | videos total=${total} published=${published}`);
  }
  console.log(`\nTotal categories: ${cats.length}`);
}
main().catch((e) => console.error(e?.message ?? e)).finally(() => prisma.$disconnect());
