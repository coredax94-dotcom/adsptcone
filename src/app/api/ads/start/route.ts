import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/http';
const schema = z.object({ campaignId: z.string().uuid() });
export async function POST(request: Request) {
  const user = await getCurrentUser(); if (!user) return errorResponse('Silakan masuk.', 401);
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return errorResponse('Campaign tidak valid.');
  const campaign = await prisma.campaign.findFirst({ where: { id: parsed.data.campaignId, status: 'ACTIVE', ownerId: { not: user.id }, budgetRemaining: { gt: 0 } } });
  if (!campaign) return errorResponse('Campaign tidak tersedia.', 404);
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const completed = await prisma.adView.findFirst({ where: { userId: user.id, campaignId: campaign.id, status: 'COMPLETED', completedAt: { gte: since } }, select: { id: true } });
  if (completed) return errorResponse('Anda sudah menyelesaikan iklan ini hari ini.', 409);
  try { const view = await prisma.adView.create({ data: { token: randomUUID(), userId: user.id, campaignId: campaign.id } }); return NextResponse.json({ token: view.token }); }
  catch { return errorResponse('Tidak dapat memulai view. Coba lagi.', 409); }
}
