'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setBusy(true);
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try { const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Permintaan gagal'); router.push('/dashboard'); router.refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Terjadi kesalahan'); } finally { setBusy(false); }
  }
  return <form className="form" onSubmit={submit}>{mode === 'register' && <label>Nama<input name="name" autoComplete="name" required minLength={2} maxLength={80}/></label>}<label>Email<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={8}/></label>{error && <div className="notice error">{error}</div>}<button disabled={busy} className="button">{busy ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Buat akun'}</button></form>;
}
