import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, validHttpUrl } from '@/lib/http';

const schema = z.object({
  title: z.string().trim().min(3).max(100),
  description: z.string().trim().min(10).max(500),
  targetUrl: z.string().url().max(2048),
  budget: z.coerce.number().min(1).max(1000000),
  clickReward: z.coerce.number().min(0.01).max(1000),
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse('Silakan masuk terlebih dahulu.', 401);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return errorResponse('Data campaign tidak valid.');
  const data = parsed.data;
  if (!validHttpUrl(data.targetUrl)) return errorResponse('URL harus menggunakan HTTP atau HTTPS.');
  if (data.clickReward > data.budget) return errorResponse('Reward per view tidak boleh melebihi total budget.');

  try {
    const campaignId = await db.transaction(async client => {
      const debit = await client.query<{ id: string }>(
        'UPDATE wallets SET balance=balance-$1,updated_at=NOW() WHERE user_id=$2 AND balance>= $1 RETURNING id::text',
        [data.budget.toFixed(2), user.id],
      );
      if (!debit.rowCount) throw new Error('INSUFFICIENT_FUNDS');
      const created = await client.query<{ id: string }>(
        "INSERT INTO campaigns(owner_id,title,description,target_url,budget_remaining,click_reward,status) VALUES($1,$2,$3,$4,$5,$6,'PENDING_REVIEW') RETURNING id::text",
        [user.id, data.title, data.description, data.targetUrl, data.budget.toFixed(2), data.clickReward.toFixed(2)],
      );
      await client.query(
        "INSERT INTO wallet_transactions(wallet_id,user_id,amount,type,description,idempotency_key) VALUES($1,$2,$3,'CAMPAIGN_FUNDING',$4,$5)",
        [debit.rows[0].id, user.id, (-data.budget).toFixed(2), `Pendanaan campaign: ${data.title}`, `campaign-funding:${created.rows[0].id}`],
      );
      return created.rows[0].id;
    });
    return NextResponse.json({ id: campaignId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_FUNDS') return errorResponse('Saldo tidak cukup. Ajukan deposit terlebih dahulu.', 402);
    return errorResponse('Tidak dapat membuat campaign.', 500);
  }
}
