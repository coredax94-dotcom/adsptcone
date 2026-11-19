import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/http';
const schema = z.object({ token: z.string().uuid() });
export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return errorResponse('Silakan masuk.', 401);
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return errorResponse('Token view tidak valid.');
  try {
    const reward = await prisma.$transaction(async tx => {
      const view = await tx.adView.findUnique({ where: { token: parsed.data.token }, include: { campaign: true } });
      if (!view || view.userId !== user.id || view.status !== 'STARTED') throw new Error('INVALID_VIEW');
      if (Date.now() - view.startedAt.getTime() < 10000) throw new Error('TIMER_NOT_DONE');
      if (view.campaign.status !== 'ACTIVE') throw new Error('CAMPAIGN_INACTIVE');
      const since = new Date(); since.setUTCHours(0, 0, 0, 0);
      const prior = await tx.adView.findFirst({ where: { userId: user.id, campaignId: view.campaignId, status: 'COMPLETED', completedAt: { gte: since } }, select: { id: true } });
      if (prior) throw new Error('ALREADY_CLAIMED');
      const claimed = await tx.adView.updateMany({ where: { id: view.id, status: 'STARTED' }, data: { status: 'COMPLETED', completedAt: new Date() } });
      if (!claimed.count) throw new Error('INVALID_VIEW');
      const debit = await tx.campaign.updateMany({ where: { id: view.campaignId, status: 'ACTIVE', budgetRemaining: { gte: view.campaign.clickReward } }, data: { budgetRemaining: { decrement: view.campaign.clickReward } } });
      if (!debit.count) throw new Error('BUDGET_EXHAUSTED');
      const newBalance = await tx.wallet.update({ where: { userId: user.id }, data: { balance: { increment: view.campaign.clickReward } } });
      await tx.walletTransaction.create({ data: { walletId: newBalance.id, userId: user.id, amount: view.campaign.clickReward, type: 'AD_REWARD', description: `Reward iklan: ${view.campaign.title}`, idempotencyKey: `ad-view:${view.id}` } });
      return view.campaign.clickReward.toString();
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ ok: true, reward });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'TIMER_NOT_DONE') return errorResponse('Timer belum selesai.', 425);
    if (code === 'ALREADY_CLAIMED') return errorResponse('Reward iklan ini sudah diklaim hari ini.', 409);
    if (code === 'BUDGET_EXHAUSTED' || code === 'CAMPAIGN_INACTIVE') return errorResponse('Campaign sudah tidak tersedia.', 409);
    return errorResponse('View tidak valid atau sudah diklaim.', 409);
  }
}
