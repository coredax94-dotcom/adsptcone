import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';

export default async function HomePage() {
  const user = await getCurrentUser();
  return <section className="hero"><span className="pill">Paid-to-click advertising</span><h1>Promosikan website. Dapatkan reward dari iklan.</h1><p>Platform sederhana untuk membuat campaign iklan dan memperoleh reward dengan menyelesaikan tayangan iklan yang valid. Saldo dan permintaan transaksi dikelola secara transparan.</p><div className="actions"><Link className="button" href={user ? '/dashboard' : '/register'}>{user ? 'Buka dashboard' : 'Mulai sekarang'}</Link><Link className="button secondary" href="/ads">Lihat iklan tersedia</Link></div><div className="grid"><div className="card"><h2>Untuk advertiser</h2><p>Buat campaign dengan budget dan reward per tayangan.</p></div><div className="card"><h2>Untuk publisher</h2><p>Selesaikan iklan yang tersedia dan lihat reward di wallet.</p></div><div className="card"><h2>Transparan</h2><p>Riwayat transaksi dan status permintaan dapat ditinjau.</p></div></div></section>;
}
