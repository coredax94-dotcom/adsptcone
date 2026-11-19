import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { LogoutButton } from '@/components/logout-button';

export const metadata: Metadata = {
  title: 'PTC Ads | Advertising & Rewards',
  description: 'Platform paid-to-click advertising yang transparan dan mudah digunakan.',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  return (
    <html lang="id">
      <body>
        <header className="site-header sticky-top">
          <nav className="navbar navbar-expand-lg navbar-light bg-white w-100 py-3">
            <div className="container-fluid app-width px-0">
              <Link className="navbar-brand brand" href="/">
                <span className="brand-mark">P</span> PTC Ads
              </Link>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-label="Buka navigasi">
                <span className="navbar-toggler-icon" />
              </button>
              <div className="collapse navbar-collapse" id="mainNav">
                <div className="navbar-nav me-auto gap-lg-2">
                  <Link className="nav-link" href="/dashboard">Dashboard</Link>
                  <Link className="nav-link" href="/ads">Lihat iklan</Link>
                  <Link className="nav-link" href="/campaigns">Campaign</Link>
                  <Link className="nav-link" href="/wallet">Wallet</Link>
                  {user?.role === 'ADMIN' && <Link className="nav-link" href="/admin">Admin</Link>}
                </div>
                <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
                  {user ? <><span className="small text-secondary d-none d-xl-inline">Halo, {user.name}</span><LogoutButton /></> : <><Link className="btn btn-link text-decoration-none" href="/login">Masuk</Link><Link className="btn btn-primary px-3" href="/register">Daftar</Link></>}
                </div>
              </div>
            </div>
          </nav>
        </header>
        <main className="container app-width py-5">{children}</main>
        <footer className="footer border-top bg-white py-4"><div className="container app-width d-flex flex-column flex-md-row justify-content-between gap-2"><span>© {new Date().getFullYear()} PTC Ads</span><span className="text-secondary">Advertising yang transparan dan bertanggung jawab.</span></div></footer>
      </body>
    </html>
  );
}
