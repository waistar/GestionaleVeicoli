'use client';
import Link from 'next/link';
import { ReminderItem } from '@/lib/supabase/types';
import { reminderRemaining, reminderTarget } from '@/lib/reminders';
import { formatCurrency } from '@/lib/expenses';

export function RemindersList({ reminders, onEdit, onComplete, disabled = false }: {
  reminders: ReminderItem[]; onEdit?: (item: ReminderItem) => void; onComplete?: (item: ReminderItem) => void; disabled?: boolean;
}) {
  if (!reminders.length) return <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">Nessuna scadenza corrisponde ai filtri. Pianifica le date dei documenti e i controlli tecnici dal catalogo.</div>;
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{reminders.map(item => <article key={item.id} className={`rounded-2xl border bg-white p-5 space-y-3 ${item.status === 'expired' ? 'border-rose-300' : item.status === 'warning' ? 'border-amber-300' : 'border-zinc-200'}`}>
    <div className="flex items-start justify-between gap-2"><div><p className="text-xs text-zinc-600">{item.bikeName}</p><h3 className="font-bold text-zinc-900">{item.title || item.category}</h3></div><span className={`rounded-full px-2 py-1 text-xs font-semibold shrink-0 ${item.status === 'expired' ? 'bg-rose-50 text-rose-700' : item.status === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{item.status === 'expired' ? 'Scaduta' : item.status === 'warning' ? 'In scadenza' : 'Programmata'}</span></div>
    <p className="text-xs text-zinc-500">{item.category}</p>
    <p className="text-sm text-zinc-600 whitespace-pre-wrap">{item.description}</p>
    <p className="font-mono text-sm font-semibold text-zinc-900">{reminderTarget(item)}</p>
    {item.scheduled?.amount_cents != null && <p className="text-sm font-semibold text-zinc-900">Costo: {formatCurrency(item.scheduled.amount_cents)}</p>}
    <p className="text-sm text-zinc-700">{reminderRemaining(item)}</p>
    <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-100">
      {item.source === 'schedule' && onEdit && <button disabled={disabled} onClick={() => onEdit(item)} className="min-h-11 rounded-xl border border-zinc-200 px-3 text-sm disabled:opacity-50">Modifica</button>}
      {item.source === 'schedule' && onComplete ? <button disabled={disabled} onClick={() => onComplete(item)} className="min-h-11 rounded-xl bg-orange-600 text-white px-3 text-sm font-semibold disabled:opacity-50">Segna completata</button> : <Link href={`/interventi/nuovo?vehicle=${item.bikeId}&category=${encodeURIComponent(item.category)}`} className="min-h-11 inline-flex items-center rounded-xl bg-orange-600 text-white px-3 text-sm font-semibold">Registra intervento</Link>}
    </div>
  </article>)}</div>;
}
