import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
const schema = z.object({ campaignId: z.string().uuid() });
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return errorResponse('Silakan masuk.', 401);
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return errorResponse('Campaign tidak valid.');
  const completed = await db.query("SELECT id FROM ad_views WHERE user_id=$1 AND campaign_id=$2 AND status='COMPLETED' AND completed_at>=date_trunc('day',NOW()) LIMIT 1", [user.id, parsed.data.campaignId]);
  if (completed.rowCount) return errorResponse('Anda sudah menyelesaikan iklan ini hari ini.', 409);
  try {
    const result = await db.query<{ token: string }>("INSERT INTO ad_views(token,user_id,campaign_id) SELECT $1,$2,c.id FROM campaigns c WHERE c.id=$3 AND c.status='ACTIVE' AND c.owner_id<>$2 AND c.budget_remaining>0 RETURNING token::text", [randomUUID(), user.id, parsed.data.campaignId]);
    if (!result.rows[0]) return errorResponse('Campaign tidak tersedia.', 404);
    return NextResponse.json({ token: result.rows[0].token });
  } catch { return errorResponse('Tidak dapat memulai view. Coba lagi.', 409); }
}
