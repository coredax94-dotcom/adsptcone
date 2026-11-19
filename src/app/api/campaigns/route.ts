import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse, validHttpUrl } from '@/lib/http';
const schema = z.object({ title:z.string().trim().min(3).max(100), description:z.string().trim().min(10).max(500), targetUrl:z.string().url().max(2048), budget:z.coerce.number().min(1).max(1000000), clickReward:z.coerce.number().min(0.01).max(1000) });
export async function POST(request:Request) {
 const user=await getCurrentUser(); if(!user)return errorResponse('Silakan masuk terlebih dahulu.',401);
 const parsed=schema.safeParse(await request.json()); if(!parsed.success)return errorResponse('Data campaign tidak valid.');
 const d=parsed.data; if(!validHttpUrl(d.targetUrl))return errorResponse('URL harus menggunakan HTTP atau HTTPS.'); if(d.clickReward>d.budget)return errorResponse('Reward per view tidak boleh melebihi total budget.');
 try {
  const id=await db.transaction(async c=>{
   const debit=await c.query('UPDATE wallets SET balance=balance-$1,updated_at=NOW() WHERE user_id=$2 AND balance >= $1 RETURNING id',[d.budget.toFixed(2),user.id]);
   if(!debit.rowCount)throw new Error('INSUFFICIENT_FUNDS');
   const created=await c.query<{id:string}>('INSERT INTO campaigns(owner_id,title,description,target_url,budget_remaining,click_reward,status) VALUES($1,$2,$3,$4,$5,$6,\'PENDING_REVIEW\') RETURNING id',[user.id,d.title,d.description,d.targetUrl,d.budget.toFixed(2),d.clickReward.toFixed(2)]);
   await c.query('INSERT INTO wallet_transactions(wallet_id,user_id,amount,type,description,idempotency_key) VALUES($1,$2,$3,\'CAMPAIGN_FUNDING\',$4,$5)',[debit.rows[0].id,user.id,(-d.budget).toFixed(2),`Pendanaan campaign: ${d.title}`,`campaign-funding:${created.rows[0].id}`]); return created.rows[0].id;
  });
  return NextResponse.json({id},{status:201});
 } catch(e) { if(e instanceof Error&&e.message==='INSUFFICIENT_FUNDS')return errorResponse('Saldo tidak cukup. Ajukan deposit terlebih dahulu.',402); return errorResponse('Tidak dapat membuat campaign.',500); }
}
