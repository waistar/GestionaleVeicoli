'use client';
import Link from 'next/link';
import { ReminderItem, Bike } from '@/lib/supabase/types';
import { formatKm, reminderRemaining, reminderTarget } from '@/lib/reminders';
import { VehicleViewer } from '@/components/garage/VehicleViewer';
import { vehicleTypeLabel } from '@/lib/vehicle-catalog';
import { formatCurrency } from '@/lib/expenses';
export function DashboardRemindersWidget({ bike, reminders }: { bike: Bike; reminders: ReminderItem[] }) {
  return <div className="space-y-6">
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3"><div className="flex justify-between gap-3"><h2 className="font-bold text-sm">Prossime scadenze</h2><Link href={`/promemoria?vehicle=${bike.id}`} className="text-orange-700 text-sm font-semibold">Tutte →</Link></div>
      {!reminders.length && <p className="text-sm text-zinc-600">Pianifica bollo, assicurazione, revisione e manutenzioni nel catalogo.</p>}
      {reminders.slice(0,3).map(item => <div key={item.id} className="rounded-xl border border-zinc-200 p-3"><p className="text-sm font-semibold">{item.title || item.category}</p><p className="text-xs font-mono text-zinc-700 mt-1">{reminderTarget(item)}</p>{item.scheduled?.amount_cents != null && <p className="text-xs font-semibold text-zinc-800 mt-1">{formatCurrency(item.scheduled.amount_cents)}</p>}<p className={`text-xs mt-1 ${item.status === 'expired' ? 'text-rose-700' : item.status === 'warning' ? 'text-amber-700' : 'text-zinc-600'}`}>{reminderRemaining(item)}</p></div>)}
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-3"><div className="flex justify-between"><div><h2 className="font-bold text-sm">Scheda veicolo</h2><p className="text-xs text-zinc-600">{vehicleTypeLabel(bike)} · {bike.name}</p></div><Link href="/garage" className="text-orange-700 text-sm font-semibold">Veicoli →</Link></div><VehicleViewer bike={bike} height={220} showControls={false} />
      <div className="grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-zinc-600">Modello</p>{bike.model}</div><div><p className="text-xs text-zinc-600">Targa</p>{bike.plate || 'Non inserita'}</div><div><p className="text-xs text-zinc-600">Anno</p>{bike.year || 'Non inserito'}</div><div><p className="text-xs text-zinc-600">Contachilometri</p>{formatKm(bike.current_km_hours)}</div></div>
    </section>
  </div>;
}
