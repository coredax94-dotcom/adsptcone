import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
const schema = z.object({ status: z.enum(['APPROVED','REJECTED']) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return errorResponse('Silakan masuk.', 401);
  if (admin.role !== 'ADMIN') return errorResponse('Akses ditolak.', 403);
  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return errorResponse('Status tidak valid.');
  try {
    await db.transaction(async client => {
      const changed = await client.query<{ user_id: string; amount: string }>("UPDATE withdrawals SET status=$1,reviewed_at=NOW() WHERE id=$2 AND status='PENDING' RETURNING user_id::text,amount::text", [parsed.data.status, id]);
      const withdrawal = changed.rows[0];
      if (!withdrawal) throw new Error('NOT_PENDING');
      if (parsed.data.status === 'REJECTED') {
        const wallet = await client.query<{ id: string }>('UPDATE wallets SET balance=balance+$1,updated_at=NOW() WHERE user_id=$2 RETURNING id::text', [withdrawal.amount, withdrawal.user_id]);
        if (!wallet.rows[0]) throw new Error('WALLET_MISSING');
        await client.query("INSERT INTO wallet_transactions(wallet_id,user_id,amount,type,description,idempotency_key) VALUES($1,$2,$3,'REFUND',$4,$5)", [wallet.rows[0].id, withdrawal.user_id, withdrawal.amount, `Pengembalian withdrawal ${id}`, `withdrawal-refund:${id}`]);
      }
      await client.query('INSERT INTO audit_logs(actor_id,action,entity,entity_id,metadata) VALUES($1,$2,$3,$4,$5)', [admin.id, parsed.data.status, 'WITHDRAWAL', id, JSON.stringify({ amount: withdrawal.amount })]);
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_PENDING') return errorResponse('Permintaan sudah diproses atau tidak ditemukan.', 409);
    return errorResponse('Tidak dapat memproses withdrawal.', 500);
  }
}
