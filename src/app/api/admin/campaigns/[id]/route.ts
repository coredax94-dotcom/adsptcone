import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { errorResponse } from '@/lib/http';

const schema = z.object({ status: z.enum(['ACTIVE', 'REJECTED']), note: z.string().trim().max(500).optional() });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentUser();
  if (!admin) return errorResponse('Silakan masuk.', 401);
  if (admin.role !== 'ADMIN') return errorResponse('Akses ditolak.', 403);
  const { id } = await params;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return errorResponse('Status tidak valid.');
  try {
    await prisma.$transaction(async tx => {
      const campaign = await tx.campaign.findUnique({ where: { id } });
      if (!campaign || campaign.status !== 'PENDING_REVIEW') throw new Error('NOT_PENDING');
      await tx.campaign.update({ where: { id }, data: { status: parsed.data.status, reviewedAt: new Date(), reviewNote: parsed.data.note || null } });
      if (parsed.data.status === 'REJECTED') {
        const wallet = await tx.wallet.update({ where: { userId: campaign.ownerId }, data: { balance: { increment: campaign.budgetRemaining } } });
        await tx.walletTransaction.create({ data: { walletId: wallet.id, userId: campaign.ownerId, amount: campaign.budgetRemaining, type: 'REFUND', description: `Refund campaign ditolak: ${campaign.title}`, idempotencyKey: `campaign-refund:${campaign.id}` } });
      }
      await tx.auditLog.create({ data: { actorId: admin.id, action: parsed.data.status === 'ACTIVE' ? 'APPROVE' : 'REJECT', entity: 'CAMPAIGN', entityId: id, metadata: parsed.data.note || null } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_PENDING') return errorResponse('Campaign sudah diproses atau tidak ditemukan.', 409);
    return errorResponse('Tidak dapat memproses campaign.', 500);
  }
}
