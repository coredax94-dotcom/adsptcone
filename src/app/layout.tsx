import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { LogoutButton } from '@/components/logout-button';

export const metadata: Metadata = { title: 'PTC Ads', description: 'Platform paid-to-click advertising' };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return <html lang="id"><body><header className="site-header"><Link className="brand" href="/">PTC Ads</Link><nav><Link href="/dashboard">Dashboard</Link><Link href="/ads">Lihat iklan</Link><Link href="/campaigns">Campaign</Link><Link href="/wallet">Wallet</Link>{user?.role === 'ADMIN' && <Link href="/admin">Admin</Link>}</nav><div className="nav-user">{user ? <><span>{user.name}</span><LogoutButton /></> : <><Link href="/login">Masuk</Link><Link className="button small" href="/register">Daftar</Link></>}</div></header><main className="container">{children}</main><footer className="footer">PTC Ads · MVP · Gunakan iklan yang legal dan transparan.</footer></body></html>;
}
