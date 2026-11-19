import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { CampaignForm } from '@/components/campaign-form';
export default async function NewCampaignPage() { await requireUser(); return <><h1>Buat campaign</h1><p>Pastikan Anda berhak mempromosikan URL yang dimasukkan.</p><section className="card"><CampaignForm/></section><p><Link href="/campaigns">Kembali ke campaign</Link></p></>; }
