'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
export function AdViewer({ campaignId, targetUrl, seconds = 10 }: { campaignId: string; targetUrl: string; seconds?: number }) {
  const router = useRouter(); const [token, setToken] = useState(''); const [remaining, setRemaining] = useState(seconds); const [error, setError] = useState(''); const [done, setDone] = useState(false);
  useEffect(() => { let active = true; fetch('/api/ads/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId }) }).then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Tidak dapat memulai view'); if (active) setToken(data.token); }).catch(e => { if (active) setError(e.message); }); return () => { active = false; }; }, [campaignId]);
  useEffect(() => { if (!token || remaining <= 0) return; const timer = setTimeout(() => setRemaining(v => v - 1), 1000); return () => clearTimeout(timer); }, [token, remaining]);
  async function claim() { setError(''); const response = await fetch('/api/ads/claim', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }); const result = await response.json(); if (!response.ok) { setError(result.error || 'Reward tidak dapat diklaim'); return; } setDone(true); router.refresh(); }
  return <div className="card"><p>{done ? 'View berhasil diselesaikan. Reward sudah ditambahkan ke wallet.' : error || 'Buka website advertiser di tab baru, lalu tunggu timer selesai untuk klaim reward.'}</p><div className="actions"><a className="button secondary" href={targetUrl} target="_blank" rel="noopener noreferrer">Buka website advertiser</a><button className="button" disabled={!token || remaining > 0 || done} onClick={claim}>{done ? 'Selesai' : remaining > 0 ? `Tunggu ${remaining} detik` : 'Klaim reward'}</button></div>{error && <div className="notice error">{error}</div>}</div>;
}
