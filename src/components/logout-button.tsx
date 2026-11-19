'use client';
import { useRouter } from 'next/navigation';
export function LogoutButton() { const router = useRouter(); return <button className="button secondary small" onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); router.refresh(); }}>Keluar</button>; }
