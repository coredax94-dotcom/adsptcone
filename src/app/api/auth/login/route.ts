import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
const schema = z.object({ email: z.string().trim().email().transform(v => v.toLowerCase()), password: z.string().min(8).max(128) });
export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return errorResponse('Email atau password tidak valid.');
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return errorResponse('Email atau password salah.', 401);
  await createSession(user.id); return NextResponse.json({ ok: true });
}
