import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform(v => v.toLowerCase()),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const address = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`register:${address}`, 5, 900000).allowed) return errorResponse('Terlalu banyak percobaan. Coba lagi nanti.', 429);
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return errorResponse('Periksa nama, email, dan password (minimal 8 karakter).');
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await db.transaction(async client => {
      const created = await client.query<{ id: string }>(
        'INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id::text',
        [parsed.data.name, parsed.data.email, passwordHash],
      );
      await client.query('INSERT INTO wallets(user_id) VALUES($1)', [created.rows[0].id]);
      return created.rows[0];
    });
    await createSession(user.id);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') return errorResponse('Email sudah terdaftar.', 409);
    return errorResponse('Tidak dapat membuat akun saat ini.', 500);
  }
}
