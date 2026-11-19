import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
  const budget = new Prisma.Decimal(data.budget.toFixed(2));
  const reward = new Prisma.Decimal(data.clickReward.toFixed(2));
  try {
    const campaign = await prisma.$transaction(async tx => {
      const debit = await tx.wallet.updateMany({ where: { userId: user.id, balance: { gte: budget } }, data: { balance: { decrement: budget } } });
      if (!debit.count) throw new Error('INSUFFICIENT_FUNDS');
      const wallet = await tx.wallet.findUniqueOrThrow({ where: { userId: user.id } });
      const created = await tx.campaign.create({ data: { ownerId: user.id, title: data.title, description: data.description, targetUrl: data.targetUrl, budgetRemaining: budget, clickReward: reward, status: 'PENDING_REVIEW' } });
      await tx.walletTransaction.create({ data: { walletId: wallet.id, userId: user.id, amount: budget.negated(), type: 'CAMPAIGN_FUNDING', description: `Pendanaan campaign: ${data.title}`, idempotencyKey: `campaign-funding:${created.id}` } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ id: campaign.id }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_FUNDS') return errorResponse('Saldo tidak cukup. Ajukan deposit terlebih dahulu.', 402);
    return errorResponse('Tidak dapat membuat campaign.', 500);
  }
}
