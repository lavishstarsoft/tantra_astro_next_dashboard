import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await prisma.upcomingItem.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching upcoming items:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
