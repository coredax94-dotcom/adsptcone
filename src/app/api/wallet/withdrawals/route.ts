import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/http';
const schema=z.object({amount:z.coerce.number().min(5).max(100000),method:z.string().trim().min(2).max(50),destination:z.string().trim().min(4).max(200)});
export async function POST(request:Request){const user=await getCurrentUser();if(!user)return errorResponse('Silakan masuk.',401);const parsed=schema.safeParse(await request.json());if(!parsed.success)return errorResponse('Data withdrawal tidak valid.');const amount=new Prisma.Decimal(parsed.data.amount.toFixed(2));try{await prisma.$transaction(async tx=>{const debit=await tx.wallet.updateMany({where:{userId:user.id,balance:{gte:amount}},data:{balance:{decrement:amount}}});if(!debit.count)throw new Error('INSUFFICIENT_FUNDS');const wallet=await tx.wallet.findUniqueOrThrow({where:{userId:user.id}});const withdrawal=await tx.withdrawal.create({data:{userId:user.id,amount,method:parsed.data.method,destination:parsed.data.destination}});await tx.walletTransaction.create({data:{walletId:wallet.id,userId:user.id,amount:amount.negated(),type:'WITHDRAWAL',description:`Withdrawal ${withdrawal.id}`}});});return NextResponse.json({message:'Withdrawal diajukan. Dana ditahan sampai admin memprosesnya.'},{status:201});}catch(e){if(e instanceof Error&&e.message==='INSUFFICIENT_FUNDS')return errorResponse('Saldo tidak cukup.',402);return errorResponse('Tidak dapat mengajukan withdrawal.',500);}}
