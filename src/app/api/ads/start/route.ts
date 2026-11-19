import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
const schema=z.object({campaignId:z.string().uuid()});
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return errorResponse('Silakan masuk.',401);const parsed=schema.safeParse(await request.json());if(!parsed.success)return errorResponse('Campaign tidak valid.');const campaign=await db.query<{id:string}>('SELECT id FROM campaigns WHERE id=$1 AND status=\'ACTIVE\' AND owner_id<>$2 AND budget_remaining>0',[parsed.data.campaignId,user.id]);if(!campaign.rowCount)return errorResponse('Campaign tidak tersedia.',404);const completed=await db.query('SELECT id FROM ad_views WHERE user_id=$1 AND campaign_id=$2 AND status=\'COMPLETED\' AND completed_at>=date_trunc(\'day\',NOW()) LIMIT 1',[user.id,parsed.data.campaignId]);if(completed.rowCount)return errorResponse('Anda sudah menyelesaikan iklan ini hari ini.',409);try{const result=await db.query<{token:string}>('INSERT INTO ad_views(token,user_id,campaign_id) VALUES($1,$2,$3) RETURNING token',[randomUUID(),user.id,parsed.data.campaignId]);return NextResponse.json({token:result.rows[0].token});}catch{return errorResponse('Tidak dapat memulai view. Coba lagi.',409);}}
