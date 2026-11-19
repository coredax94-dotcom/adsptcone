import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

const cookieName = 'ptc_session';
export type CurrentUser = { id: string; name: string; email: string; role: 'USER' | 'ADMIN' };
function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters.');
  return new TextEncoder().encode(value);
}
export async function createSession(userId: string) {
  const token = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setSubject(userId).setIssuedAt().setExpirationTime('7d').sign(secret());
  (await cookies()).set(cookieName, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 604800 });
}
export async function clearSession() { (await cookies()).delete(cookieName); }
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const result = await db.query<CurrentUser>('SELECT id, name, email, role FROM users WHERE id = $1', [payload.sub]);
    return result.rows[0] ?? null;
  } catch { return null; }
}
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== 'ADMIN') redirect('/dashboard');
  return user;
}
