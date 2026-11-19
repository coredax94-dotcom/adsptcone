import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
const schema = z.object({ token: z.string().uuid() });
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse('Silakan masuk.', 401);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return errorResponse('Token view tidak valid.');
  try {
    const reward = await db.transaction(async client => {
      const result = await client.query<{ id: string; campaign_id: string; started_at: Date; status: string; click_reward: string; campaign_status: string; title: string }>(
        'SELECT v.id::text,v.campaign_id::text,v.started_at,v.status,c.click_reward::text,c.status AS campaign_status,c.title FROM ad_views v JOIN campaigns c ON c.id=v.campaign_id WHERE v.token=$1 AND v.user_id=$2 FOR UPDATE OF v',
        [parsed.data.token, user.id],
      );
      const view = result.rows[0];
      if (!view || view.status !== 'STARTED') throw new Error('INVALID_VIEW');
      if (Date.now() - new Date(view.started_at).getTime() < 10_000) throw new Error('TIMER_NOT_DONE');
      if (view.campaign_status !== 'ACTIVE') throw new Error('CAMPAIGN_INACTIVE');
      const prior = await client.query("SELECT id FROM ad_views WHERE user_id=$1 AND campaign_id=$2 AND status='COMPLETED' AND completed_at>=date_trunc('day',NOW()) LIMIT 1", [user.id, view.campaign_id]);
      if (prior.rowCount) throw new Error('ALREADY_CLAIMED');
      const campaign = await client.query<{ budget_remaining: string }>("UPDATE campaigns SET budget_remaining=budget_remaining-$1,status=CASE WHEN budget_remaining-$1=0 THEN 'COMPLETED' ELSE status END,updated_at=NOW() WHERE id=$2 AND status='ACTIVE' AND budget_remaining >= $1 RETURNING budget_remaining::text", [view.click_reward, view.campaign_id]);
      if (!campaign.rows[0]) throw new Error('BUDGET_EXHAUSTED');
      const claimed = await client.query("UPDATE ad_views SET status='COMPLETED',completed_at=NOW() WHERE id=$1 AND status='STARTED' RETURNING id", [view.id]);
      if (!claimed.rowCount) throw new Error('INVALID_VIEW');
      const wallet = await client.query<{ id: string }>('UPDATE wallets SET balance=balance+$1,updated_at=NOW() WHERE user_id=$2 RETURNING id::text', [view.click_reward, user.id]);
      if (!wallet.rows[0]) throw new Error('WALLET_MISSING');
      await client.query("INSERT INTO wallet_transactions(wallet_id,user_id,amount,type,description,idempotency_key) VALUES($1,$2,$3,'AD_REWARD',$4,$5)", [wallet.rows[0].id, user.id, view.click_reward, `Reward iklan: ${view.title}`, `ad-view:${view.id}`]);
      return view.click_reward;
    });
    return NextResponse.json({ ok: true, reward });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'TIMER_NOT_DONE') return errorResponse('Timer belum selesai.', 425);
    if (code === 'ALREADY_CLAIMED') return errorResponse('Reward iklan ini sudah diklaim hari ini.', 409);
    if (code === 'BUDGET_EXHAUSTED' || code === 'CAMPAIGN_INACTIVE') return errorResponse('Campaign sudah tidak tersedia.', 409);
    return errorResponse('View tidak valid atau sudah diklaim.', 409);
  }
}
