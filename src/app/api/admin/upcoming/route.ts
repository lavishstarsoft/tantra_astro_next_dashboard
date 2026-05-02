import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const items = await prisma.upcomingItem.findMany({
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, subtitle, description, imageUrl, kind, releaseDate, active, sortOrder } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const item = await prisma.upcomingItem.create({
      data: {
        title,
        subtitle: subtitle || null,
        description: description || null,
        imageUrl: imageUrl || null,
        kind: kind || 'video',
        releaseDate: releaseDate || null,
        active: typeof active === 'boolean' ? active : true,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error creating upcoming item:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
