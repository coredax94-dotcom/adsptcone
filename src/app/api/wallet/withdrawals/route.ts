import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
const schema = z.object({ amount: z.coerce.number().min(5).max(100000), method: z.string().trim().min(2).max(50), destination: z.string().trim().min(4).max(200) });
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse('Silakan masuk.', 401);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return errorResponse('Data withdrawal tidak valid.');
  try {
    await db.transaction(async client => {
      const debit = await client.query<{ id: string }>('UPDATE wallets SET balance=balance-$1,updated_at=NOW() WHERE user_id=$2 AND balance >= $1 RETURNING id::text', [parsed.data.amount.toFixed(2), user.id]);
      if (!debit.rows[0]) throw new Error('INSUFFICIENT_FUNDS');
      const requestRow = await client.query<{ id: string }>('INSERT INTO withdrawals(user_id,amount,method,destination) VALUES($1,$2,$3,$4) RETURNING id::text', [user.id, parsed.data.amount.toFixed(2), parsed.data.method, parsed.data.destination]);
      await client.query("INSERT INTO wallet_transactions(wallet_id,user_id,amount,type,description,idempotency_key) VALUES($1,$2,$3,'WITHDRAWAL',$4,$5)", [debit.rows[0].id, user.id, (-parsed.data.amount).toFixed(2), `Withdrawal ${requestRow.rows[0].id}`, `withdrawal:${requestRow.rows[0].id}`]);
    });
    return NextResponse.json({ message: 'Withdrawal diajukan. Dana ditahan sampai admin memprosesnya.' }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_FUNDS') return errorResponse('Saldo tidak cukup.', 402);
    return errorResponse('Tidak dapat mengajukan withdrawal.', 500);
  }
}
