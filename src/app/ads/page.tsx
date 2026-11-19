import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { money } from '@/lib/format';
import { AdViewer } from '@/components/ad-viewer';
import Link from 'next/link';
export default async function AdsPage({ searchParams }: { searchParams: Promise<{ campaign?: string }> }) {
  const user = await requireUser(); const params = await searchParams;
  if (params.campaign) {
    const campaign = await prisma.campaign.findFirst({ where: { id: params.campaign, status: 'ACTIVE', ownerId: { not: user.id }, budgetRemaining: { gt: 0 } } });
    if (!campaign) return <><h1>Iklan tidak tersedia</h1><p>Campaign mungkin tidak aktif, budget habis, atau merupakan campaign Anda sendiri.</p><Link href="/ads">Kembali ke daftar iklan</Link></>;
    return <><h1>{campaign.title}</h1><p>{campaign.description}</p><p>Reward: <strong>{money(campaign.clickReward)}</strong></p><AdViewer key={campaign.id} campaignId={campaign.id} targetUrl={campaign.targetUrl}/><p><Link href="/ads">Kembali ke daftar iklan</Link></p></>;
  }
  const campaigns = await prisma.campaign.findMany({ where: { status: 'ACTIVE', ownerId: { not: user.id }, budgetRemaining: { gt: 0 } }, orderBy: { createdAt: 'desc' }, take: 50 });
  return <><h1>Iklan tersedia</h1><p>Satu campaign hanya dapat menghasilkan satu reward per akun per hari. Buka iklan, tunggu timer, lalu klaim reward.</p>{campaigns.length ? <div className="grid">{campaigns.map(c => <article className="card" key={c.id}><h2>{c.title}</h2><p>{c.description}</p><p>Reward per view: <strong>{money(c.clickReward)}</strong></p><Link className="button" href={`/ads?campaign=${c.id}`}>Lihat iklan</Link></article>)}</div> : <div className="card">Belum ada iklan aktif.</div>}</>;
}
