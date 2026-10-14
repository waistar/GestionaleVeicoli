'use client';
import Link from 'next/link';
import { ReminderItem } from '@/lib/supabase/types';
import { reminderRemaining } from '@/lib/reminders';
export function AlertBanner({ reminders }: { reminders: ReminderItem[] }) {
  const alerts = reminders.filter(r => r.status !== 'ok');
  return <section className={`rounded-2xl border p-4 ${alerts.some(r => r.status === 'expired') ? 'border-rose-200 bg-rose-50' : alerts.length ? 'border-amber-200 bg-amber-50' : 'border-zinc-200 bg-white'}`}>
    <div className="flex items-center justify-between gap-3"><h2 className="font-bold text-sm text-zinc-900">{alerts.length ? `${alerts.length} scadenze da gestire` : 'Nessun avviso sulle scadenze configurate'}</h2><Link href="/promemoria" className="text-sm font-semibold text-orange-700">Scadenzario →</Link></div>
    {!reminders.length && <p className="text-xs text-zinc-600 mt-2">Configura documenti e manutenzioni nel catalogo: le scadenze non inserite non sono monitorate.</p>}
    <div className="grid sm:grid-cols-2 gap-2 mt-3">{alerts.slice(0,4).map(item => <div key={item.id} className="rounded-xl bg-white border border-zinc-200 p-3"><p className="font-semibold text-sm">{item.title || item.category}</p><p className="text-xs text-zinc-600">{reminderRemaining(item)}</p></div>)}</div>
  </section>;
}
