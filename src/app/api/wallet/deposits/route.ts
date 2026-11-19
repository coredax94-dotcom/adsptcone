import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/http';
const schema=z.object({amount:z.coerce.number().min(5).max(100000),method:z.string().trim().min(2).max(50),reference:z.string().trim().min(2).max(120)});
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return errorResponse('Silakan masuk.',401);const parsed=schema.safeParse(await request.json());if(!parsed.success)return errorResponse('Data deposit tidak valid.');const amount=new Prisma.Decimal(parsed.data.amount.toFixed(2));const recent=await prisma.deposit.count({where:{userId:user.id,status:'PENDING',createdAt:{gte:new Date(Date.now()-24*60*60*1000)}}});if(recent>=3)return errorResponse('Batas pengajuan deposit sementara tercapai.',429);await prisma.deposit.create({data:{userId:user.id,amount,method:parsed.data.method,reference:parsed.data.reference}});return NextResponse.json({message:'Deposit diajukan dan menunggu tinjauan admin.'},{status:201});}
