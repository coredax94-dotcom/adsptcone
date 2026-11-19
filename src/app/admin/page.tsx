import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { money } from '@/lib/format';
import { AdminReview } from '@/components/admin-review';

type DepositRow = { id: string; amount: string; method: string; reference: string; name: string; email: string };
type WithdrawalRow = { id: string; amount: string; method: string; destination: string; name: string; email: string };
type CampaignRow = { id: string; title: string; description: string; target_url: string; budget_remaining: string; name: string; email: string };
type CountRow = { count: number };

export default async function AdminPage() {
  await requireAdmin();
  const [deposits, withdrawals, campaigns, users, campaignCount] = await Promise.all([
    db.query<DepositRow>("SELECT d.id::text,d.amount::text,d.method,d.reference,u.name,u.email FROM deposits d JOIN users u ON u.id=d.user_id WHERE d.status='PENDING' ORDER BY d.created_at LIMIT 100"),
    db.query<WithdrawalRow>("SELECT w.id::text,w.amount::text,w.method,w.destination,u.name,u.email FROM withdrawals w JOIN users u ON u.id=w.user_id WHERE w.status='PENDING' ORDER BY w.created_at LIMIT 100"),
    db.query<CampaignRow>("SELECT c.id::text,c.title,c.description,c.target_url,c.budget_remaining::text,u.name,u.email FROM campaigns c JOIN users u ON u.id=c.owner_id WHERE c.status='PENDING_REVIEW' ORDER BY c.created_at LIMIT 100"),
    db.query<CountRow>('SELECT count(*)::int AS count FROM users'),
    db.query<CountRow>('SELECT count(*)::int AS count FROM campaigns'),
  ]);
  return <><h1>Admin</h1><p>Verifikasi deposit manual dan tinjau campaign sebelum ditayangkan.</p>
    <div className="grid"><div className="card"><span className="muted">Pengguna</span><div className="stat">{users.rows[0]?.count ?? 0}</div></div><div className="card"><span className="muted">Campaign</span><div className="stat">{campaignCount.rows[0]?.count ?? 0}</div></div><div className="card"><span className="muted">Campaign review</span><div className="stat">{campaigns.rowCount}</div></div></div>
    <h2>Campaign pending review</h2>{campaigns.rowCount ? <div className="table-wrap"><table><thead><tr><th>Campaign</th><th>Pemilik</th><th>Budget</th><th>URL</th><th>Aksi</th></tr></thead><tbody>{campaigns.rows.map(c=><tr key={c.id}><td>{c.title}<br/><span className="muted">{c.description}</span></td><td>{c.name}<br/><span className="muted">{c.email}</span></td><td>{money(c.budget_remaining)}</td><td><a href={c.target_url} target="_blank" rel="noreferrer">Buka</a></td><td><AdminReview kind="campaigns" id={c.id}/></td></tr>)}</tbody></table></div> : <p>Tidak ada campaign pending.</p>}
    <h2 style={{marginTop:28}}>Deposit pending</h2>{deposits.rowCount ? <div className="table-wrap"><table><thead><tr><th>Pengguna</th><th>Jumlah</th><th>Metode</th><th>Referensi</th><th>Aksi</th></tr></thead><tbody>{deposits.rows.map(d=><tr key={d.id}><td>{d.name}<br/><span className="muted">{d.email}</span></td><td>{money(d.amount)}</td><td>{d.method}</td><td>{d.reference}</td><td><AdminReview kind="deposits" id={d.id}/></td></tr>)}</tbody></table></div> : <p>Tidak ada deposit pending.</p>}
    <h2 style={{marginTop:28}}>Withdrawal pending</h2>{withdrawals.rowCount ? <div className="table-wrap"><table><thead><tr><th>Pengguna</th><th>Jumlah</th><th>Metode</th><th>Tujuan</th><th>Aksi</th></tr></thead><tbody>{withdrawals.rows.map(w=><tr key={w.id}><td>{w.name}<br/><span className="muted">{w.email}</span></td><td>{money(w.amount)}</td><td>{w.method}</td><td>{w.destination}</td><td><AdminReview kind="withdrawals" id={w.id}/></td></tr>)}</tbody></table></div> : <p>Tidak ada withdrawal pending.</p>}
  </>;
}
