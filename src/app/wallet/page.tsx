import { requireUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { money } from '@/lib/format';
import { WalletForms } from '@/components/wallet-forms';
type WalletRow = { balance: string };
type TransactionRow = { id: string; created_at: Date; type: string; description: string; amount: string };
type RequestRow = { id: string; amount: string; status: string; method: string };
export default async function WalletPage() {
  const user = await requireUser();
  const [wallet, transactions, deposits, withdrawals] = await Promise.all([
    db.query<WalletRow>('SELECT balance::text FROM wallets WHERE user_id=$1', [user.id]),
    db.query<TransactionRow>('SELECT id::text,created_at,type,description,amount::text FROM wallet_transactions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 30', [user.id]),
    db.query<RequestRow>('SELECT id::text,amount::text,status,method FROM deposits WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10', [user.id]),
    db.query<RequestRow>('SELECT id::text,amount::text,status,method FROM withdrawals WHERE user_id=$1 ORDER BY created_at DESC LIMIT 10', [user.id]),
  ]);
  return <><h1>Wallet</h1><div className="card"><span className="muted">Saldo tersedia</span><div className="stat">{money(wallet.rows[0]?.balance ?? '0')}</div></div><h2 style={{marginTop:24}}>Deposit dan withdrawal</h2><WalletForms/><h2 style={{marginTop:32}}>Transaksi wallet</h2>{transactions.rowCount ? <div className="table-wrap"><table><thead><tr><th>Tanggal</th><th>Jenis</th><th>Deskripsi</th><th>Jumlah</th></tr></thead><tbody>{transactions.rows.map(t=><tr key={t.id}><td>{new Date(t.created_at).toLocaleString('id-ID')}</td><td>{t.type}</td><td>{t.description}</td><td>{money(t.amount)}</td></tr>)}</tbody></table></div> : <p>Belum ada transaksi.</p>}<h2 style={{marginTop:28}}>Status permintaan</h2><div className="grid"><div className="card"><h2>Deposit</h2>{deposits.rowCount ? deposits.rows.map(d=><p key={d.id}>{money(d.amount)} · {d.status} · {d.method}</p>) : <p>Belum ada permintaan deposit.</p>}</div><div className="card"><h2>Withdrawal</h2>{withdrawals.rowCount ? withdrawals.rows.map(w=><p key={w.id}>{money(w.amount)} · {w.status} · {w.method}</p>) : <p>Belum ada permintaan withdrawal.</p>}</div></div></>;
}
