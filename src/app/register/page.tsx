import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { getCurrentUser } from '@/lib/auth';
export default async function RegisterPage() { if (await getCurrentUser()) redirect('/dashboard'); return <section className="card" style={{ maxWidth: 560, margin: '20px auto' }}><h1>Buat akun</h1><p>Daftar untuk membuat campaign atau menyelesaikan iklan.</p><AuthForm mode="register"/><p>Sudah memiliki akun? <Link href="/login" style={{ color: '#1457d9' }}>Masuk</Link></p></section>; }
