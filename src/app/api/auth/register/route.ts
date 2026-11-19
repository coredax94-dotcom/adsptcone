import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), password: z.string().min(8).max(128) });
export async function POST(request: Request) {
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`register:${address}`, 5, 15 * 60 * 1000).allowed) return errorResponse('Terlalu banyak percobaan. Coba lagi nanti.', 429);
  try {
    const parsed = schema.safeParse(await request.json()); if (!parsed.success) return errorResponse('Periksa nama, email, dan password (minimal 8 karakter).');
    const { name, email, password } = parsed.data;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, passwordHash, wallet: { create: {} } }, select: { id: true } });
    await createSession(user.id); return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) { if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return errorResponse('Email sudah terdaftar.', 409); return errorResponse('Tidak dapat membuat akun saat ini.', 500); }
}
