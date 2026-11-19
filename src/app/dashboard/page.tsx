import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { money } from '@/lib/format';
import Link from 'next/link';
export default async function DashboardPage() {
  const user = await requireUser();
  const [wallet, campaigns, recentViews, tx] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId: user.id } }),
    prisma.campaign.count({ where: { ownerId: user.id } }),
    prisma.adView.count({ where: { userId: user.id, status: 'COMPLETED' } }),
    prisma.walletTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 5 }),
  ]);
  return <><h1>Halo, {user.name}</h1><p>Ringkasan akun dan aktivitas PTC Ads Anda.</p><div className="grid"><div className="card"><span className="muted">Saldo wallet</span><div className="stat">{money(wallet?.balance ?? 0)}</div></div><div className="card"><span className="muted">Campaign dibuat</span><div className="stat">{campaigns}</div></div><div className="card"><span className="muted">Iklan diselesaikan</span><div className="stat">{recentViews}</div></div></div><div className="actions"><Link className="button" href="/ads">Lihat iklan</Link><Link className="button secondary" href="/campaigns/new">Buat campaign</Link><Link className="button secondary" href="/wallet">Kelola wallet</Link></div><h2 style={{ marginTop: 32 }}>Transaksi terbaru</h2>{tx.length ? <div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Tipe</th><th>Catatan</th><th>Jumlah</th></tr></thead><tbody>{tx.map(t => <tr key={t.id}><td>{t.createdAt.toLocaleDateString('id-ID')}</td><td>{t.type}</td><td>{t.description}</td><td>{money(t.amount)}</td></tr>)}</tbody></table></div> : <p>Belum ada transaksi.</p>}</>;
}
