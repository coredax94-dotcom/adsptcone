import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();
  return <>
    <section className="hero">
      <span className="eyebrow">PLATFORM PTC TERPERCAYA</span>
      <h1>Promosikan website. Dapatkan reward dari iklan.</h1>
      <p>PTC Ads membantu advertiser menjangkau audiens dan publisher mendapatkan reward melalui pengalaman iklan yang sederhana, transparan, dan terukur.</p>
      <div className="actions"><Link className="button" href={user ? '/dashboard' : '/register'}>{user ? 'Buka dashboard' : 'Mulai sekarang'}</Link><Link className="button secondary" href="/ads">Jelajahi iklan</Link></div>
    </section>
    <section className="row g-3 mb-5">
      <div className="col-md-4"><div className="card h-100"><div className="text-primary fs-3 mb-2">01</div><h2 className="h5">Buat campaign</h2><p className="mb-0">Tentukan target URL, budget, dan reward per tayangan.</p></div></div>
      <div className="col-md-4"><div className="card h-100"><div className="text-primary fs-3 mb-2">02</div><h2 className="h5">Review transparan</h2><p className="mb-0">Campaign ditinjau admin sebelum aktif dan dapat dilihat publisher.</p></div></div>
      <div className="col-md-4"><div className="card h-100"><div className="text-primary fs-3 mb-2">03</div><h2 className="h5">Reward tercatat</h2><p className="mb-0">View valid diproses secara atomic dan masuk ke wallet pengguna.</p></div></div>
    </section>
    <section className="card p-4 p-md-5 bg-primary text-white border-0">
      <div className="row align-items-center g-4"><div className="col-lg-8"><h2 className="text-white">Satu platform untuk advertiser dan publisher</h2><p className="text-white opacity-75 mb-0">Kelola campaign, wallet, dan aktivitas iklan dari dashboard yang mudah dipahami.</p></div><div className="col-lg-4 text-lg-end"><Link className="btn btn-light text-primary fw-bold" href={user ? '/dashboard' : '/register'}>Buka platform</Link></div></div>
    </section>
  </>;
}
