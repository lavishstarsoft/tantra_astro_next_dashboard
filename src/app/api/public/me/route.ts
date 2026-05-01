import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireAppUser } from '@/lib/app-auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) {
    return gate.response;
  }
  const { user } = gate;
  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
      gender: user.gender ?? null,
      state: user.state ?? null,
    },
  });
}

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  state: z.string().min(2).max(60).optional(),
});

export async function PATCH(req: Request) {
  const gate = await requireAppUser(req);
  if (!gate.ok) return gate.response;

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

  const nextEmail = parsed.data.email?.toLowerCase();
  const nextName = parsed.data.name?.trim();
  const nextState = parsed.data.state?.trim();
  const nextGender = parsed.data.gender;
  const nextDobStr = parsed.data.dateOfBirth?.trim();
  const nextDob = nextDobStr ? new Date(nextDobStr) : undefined;
  if (nextDobStr && Number.isNaN(nextDob?.getTime())) {
    return NextResponse.json({ error: 'Invalid dateOfBirth. Use YYYY-MM-DD.' }, { status: 400 });
  }

  if (!nextEmail && !nextName && !nextDobStr && !nextGender && !nextState) {
    return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
  }

  try {
    const updated = await prisma.appUser.update({
      where: { id: gate.user.id },
      data: {
        name: nextName ?? undefined,
        email: nextEmail ?? undefined,
        dateOfBirth: nextDobStr ? nextDob : undefined,
        gender: nextGender ?? undefined,
        state: nextState ?? undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updated.id,
        phone: updated.phone,
        name: updated.name,
        email: updated.email,
        dateOfBirth: updated.dateOfBirth ? updated.dateOfBirth.toISOString() : null,
        gender: updated.gender ?? null,
        state: updated.state ?? null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: 'Could not update profile', detail: msg }, { status: 409 });
  }
}

