import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-api';

const patchSchema = z.object({
  role: z.enum(['USER', 'SUPER_ADMIN']),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  console.log('Role Update Request:', { id });
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const userExists = await prisma.appUser.findUnique({ where: { id } });
    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await prisma.appUser.update({
      where: { id },
      data: { role: parsed.data.role },
    });
    return NextResponse.json({ ok: true, role: updated.role });
  } catch (e) {
    console.error('Error updating user role:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update role', detail: msg }, { status: 500 });
  }
}
