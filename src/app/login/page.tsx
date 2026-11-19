import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { getCurrentUser } from '@/lib/auth';
export default async function LoginPage() { if (await getCurrentUser()) redirect('/dashboard'); return <section className="card" style={{ maxWidth: 560, margin: '20px auto' }}><h1>Masuk</h1><p>Masuk ke akun PTC Ads Anda.</p><AuthForm mode="login"/><p>Belum punya akun? <Link href="/register" style={{ color: '#1457d9' }}>Daftar</Link></p></section>; }
