import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({ email: z.string().trim().email().transform(v => v.toLowerCase()), password: z.string().min(8).max(128) });

export async function POST(request: Request) {
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`login:${address}`, 10, 900000).allowed) return errorResponse('Terlalu banyak percobaan login. Coba lagi nanti.', 429);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return errorResponse('Email atau password tidak valid.');
  const result = await db.query<{ id: string; password_hash: string }>('SELECT id::text,password_hash FROM users WHERE email=$1', [parsed.data.email]);
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) return errorResponse('Email atau password salah.', 401);
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
