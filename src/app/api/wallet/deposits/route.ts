import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse } from '@/lib/http';
const schema=z.object({amount:z.coerce.number().min(5).max(100000),method:z.string().trim().min(2).max(50),reference:z.string().trim().min(2).max(120)});
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return errorResponse('Silakan masuk.',401);const parsed=schema.safeParse(await request.json());if(!parsed.success)return errorResponse('Data deposit tidak valid.');const recent=await db.query('SELECT count(*)::int AS count FROM deposits WHERE user_id=$1 AND status=\'PENDING\' AND created_at>=NOW()-INTERVAL \'24 hours\'',[user.id]);if(recent.rows[0].count>=3)return errorResponse('Batas pengajuan deposit sementara tercapai.',429);await db.query('INSERT INTO deposits(user_id,amount,method,reference) VALUES($1,$2,$3,$4)',[user.id,parsed.data.amount.toFixed(2),parsed.data.method,parsed.data.reference]);return NextResponse.json({message:'Deposit diajukan dan menunggu tinjauan admin.'},{status:201});}
