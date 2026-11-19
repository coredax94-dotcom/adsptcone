import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
const schema = z.object({ status: z.enum(['ACTIVE','REJECTED']), note: z.string().trim().max(500).optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return errorResponse('Silakan masuk.', 401);
  if (admin.role !== 'ADMIN') return errorResponse('Akses ditolak.', 403);
  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return errorResponse('Status tidak valid.');
  try {
    await db.transaction(async client => {
      const changed = await client.query<{ owner_id: string; title: string; budget_remaining: string }>("UPDATE campaigns SET status=$1,reviewed_at=NOW(),review_note=$2,updated_at=NOW() WHERE id=$3 AND status='PENDING_REVIEW' RETURNING owner_id::text,title,budget_remaining::text", [parsed.data.status, parsed.data.note ?? null, id]);
      const campaign = changed.rows[0];
      if (!campaign) throw new Error('NOT_PENDING');
      if (parsed.data.status === 'REJECTED') {
        const wallet = await client.query<{ id: string }>('UPDATE wallets SET balance=balance+$1,updated_at=NOW() WHERE user_id=$2 RETURNING id::text', [campaign.budget_remaining, campaign.owner_id]);
        if (!wallet.rows[0]) throw new Error('WALLET_MISSING');
        await client.query("INSERT INTO wallet_transactions(wallet_id,user_id,amount,type,description,idempotency_key) VALUES($1,$2,$3,'REFUND',$4,$5)", [wallet.rows[0].id, campaign.owner_id, campaign.budget_remaining, `Refund campaign ditolak: ${campaign.title}`, `campaign-refund:${id}`]);
      }
      await client.query('INSERT INTO audit_logs(actor_id,action,entity,entity_id,metadata) VALUES($1,$2,$3,$4,$5)', [admin.id, parsed.data.status === 'ACTIVE' ? 'APPROVE' : 'REJECT', 'CAMPAIGN', id, parsed.data.note ?? null]);
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_PENDING') return errorResponse('Campaign sudah diproses atau tidak ditemukan.', 409);
    return errorResponse('Tidak dapat memproses campaign.', 500);
  }
}
