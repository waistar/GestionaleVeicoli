'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileLock2, LogIn, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const input = 'w-full min-h-11 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900';

export function ArchiveAccess({ signedInEmail }: { signedInEmail?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const values = new FormData(event.currentTarget);
    const db = createClient();
    const { error } = await db.auth.signInWithPassword({ email: String(values.get('email') || '').trim(), password: String(values.get('password') || '') });
    if (error) setMessage('Email o password non corretti.');
    else router.refresh();
    setBusy(false);
  }

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.refresh();
    setBusy(false);
  }

  if (signedInEmail) return <section className="max-w-xl rounded-2xl border border-amber-200 bg-white p-6 shadow-sm space-y-4">
    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center"><FileLock2 className="w-6 h-6" /></div>
    <div><h2 className="text-xl font-bold">Account non autorizzato</h2><p className="mt-2 text-sm text-zinc-600">Hai effettuato l’accesso come <strong>{signedInEmail}</strong>, ma questo account non è abilitato all’archivio.</p></div>
    <p className="text-sm text-zinc-600">Aggiungi l’utente alla tabella <code className="rounded bg-zinc-100 px-1 py-0.5">archive_members</code> dal pannello Supabase.</p>
    <button onClick={signOut} disabled={busy} className="min-h-11 inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 font-semibold disabled:opacity-50"><LogOut className="w-4 h-4" />Esci</button>
  </section>;

  return <section className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center"><FileLock2 className="w-6 h-6" /></div>
    <div><h2 className="text-xl font-bold">Accedi all’archivio</h2><p className="mt-2 text-sm text-zinc-600">Usa l’account creato dall’amministratore per consultare e gestire i PDF da qualsiasi dispositivo.</p></div>
    <form onSubmit={signIn} className="space-y-4">
      <label className="block text-sm">Email<input name="email" type="email" autoComplete="email" required className={input} /></label>
      <label className="block text-sm">Password<input name="password" type="password" autoComplete="current-password" required minLength={6} className={input} /></label>
      {message && <p role="alert" className="text-sm text-rose-700">{message}</p>}
      <button type="submit" disabled={busy} className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 font-semibold text-white disabled:opacity-50"><LogIn className="w-4 h-4" />{busy ? 'Accesso…' : 'Accedi'}</button>
    </form>
  </section>;
}
