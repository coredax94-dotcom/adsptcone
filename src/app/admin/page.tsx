import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { money } from '@/lib/format';
import { AdminReview } from '@/components/admin-review';

export default async function AdminPage() {
  await requireAdmin();
  const [deposits, withdrawals, campaigns, users, campaignCount] = await Promise.all([
    prisma.deposit.findMany({ where: { status: 'PENDING' }, include: { user: { select: { email: true, name: true } } }, orderBy: { createdAt: 'asc' }, take: 100 }),
    prisma.withdrawal.findMany({ where: { status: 'PENDING' }, include: { user: { select: { email: true, name: true } } }, orderBy: { createdAt: 'asc' }, take: 100 }),
    prisma.campaign.findMany({ where: { status: 'PENDING_REVIEW' }, include: { owner: { select: { email: true, name: true } } }, orderBy: { createdAt: 'asc' }, take: 100 }),
    prisma.user.count(), prisma.campaign.count(),
  ]);
  return <><h1>Admin</h1><p>Verifikasi deposit secara manual sebelum menyetujui saldo. Campaign juga wajib ditinjau sebelum ditayangkan.</p>
    <div className="grid"><div className="card"><span className="muted">Pengguna</span><div className="stat">{users}</div></div><div className="card"><span className="muted">Total campaign</span><div className="stat">{campaignCount}</div></div><div className="card"><span className="muted">Campaign review</span><div className="stat">{campaigns.length}</div></div></div>
    <h2>Campaign pending review</h2>{campaigns.length ? <div className="table-wrap"><table><thead><tr><th>Campaign</th><th>Pemilik</th><th>Budget</th><th>URL</th><th>Aksi</th></tr></thead><tbody>{campaigns.map(c => <tr key={c.id}><td>{c.title}<br/><span className="muted">{c.description}</span></td><td>{c.owner.name}<br/><span className="muted">{c.owner.email}</span></td><td>{money(c.budgetRemaining)}</td><td><a href={c.targetUrl} target="_blank" rel="noreferrer">Buka</a></td><td><AdminReview kind="campaigns" id={c.id}/></td></tr>)}</tbody></table></div> : <p>Tidak ada campaign pending.</p>}
    <h2 style={{ marginTop: 28 }}>Deposit pending</h2>{deposits.length ? <div className="table-wrap"><table><thead><tr><th>Pengguna</th><th>Jumlah</th><th>Metode</th><th>Referensi</th><th>Aksi</th></tr></thead><tbody>{deposits.map(d => <tr key={d.id}><td>{d.user.name}<br/><span className="muted">{d.user.email}</span></td><td>{money(d.amount)}</td><td>{d.method}</td><td>{d.reference}</td><td><AdminReview kind="deposits" id={d.id}/></td></tr>)}</tbody></table></div> : <p>Tidak ada deposit pending.</p>}
    <h2 style={{ marginTop: 28 }}>Withdrawal pending</h2>{withdrawals.length ? <div className="table-wrap"><table><thead><tr><th>Pengguna</th><th>Jumlah</th><th>Metode</th><th>Tujuan</th><th>Aksi</th></tr></thead><tbody>{withdrawals.map(w => <tr key={w.id}><td>{w.user.name}<br/><span className="muted">{w.user.email}</span></td><td>{money(w.amount)}</td><td>{w.method}</td><td>{w.destination}</td><td><AdminReview kind="withdrawals" id={w.id}/></td></tr>)}</tbody></table></div> : <p>Tidak ada withdrawal pending.</p>}
  </>;
}
