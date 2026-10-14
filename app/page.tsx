import Link from 'next/link';
import { getAllBikes } from '@/app/actions/bikes';
import { createClient } from '@/lib/supabase/server';
import { MaintenanceLog, VehicleReminder } from '@/lib/supabase/types';
import { calculateReminders, formatKm, reminderRemaining, reminderTarget, sortReminders } from '@/lib/reminders';
import { vehicleTypeLabel } from '@/lib/vehicle-catalog';
import { EmptyGarage } from '@/components/garage/EmptyGarage';
import { VehicleIcon } from '@/components/garage/VehicleViewer';
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader';
import { BottomNav } from '@/components/layout/BottomNav';
import { CalendarClock, ChevronRight, Plus, Warehouse } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FleetDashboardPage() {
  const fleet = await getAllBikes();
  if (!fleet.bikes.length) return <EmptyGarage databaseUnavailable={fleet.isFallback} />;

  let logs: MaintenanceLog[] = [];
  let scheduled: VehicleReminder[] = [];
  let error = fleet.error;
  if (!fleet.isFallback) {
    try {
      const db = await createClient();
      const [history, plans] = await Promise.all([
        db.from('maintenance_logs').select('*'),
        db.from('vehicle_reminders').select('*').order('created_at', { ascending: false }),
      ]);
      logs = history.data || [];
      scheduled = plans.data || [];
      error = history.error?.message || plans.error?.message;
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : 'Impossibile caricare le scadenze.';
    }
  }

  const reminders = sortReminders(fleet.bikes.flatMap(vehicle => calculateReminders(vehicle, logs, scheduled)));
  const expiredCount = reminders.filter(reminder => reminder.status === 'expired').length;
  const warningCount = reminders.filter(reminder => reminder.status === 'warning').length;
  const alertsCount = expiredCount + warningCount;

  return <>
    <WorkspaceHeader />
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 space-y-7">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-orange-700">GestionaleVeicoli · panoramica generale</p><h1 className="mt-1 text-2xl sm:text-3xl font-bold text-zinc-900">Tutte le scadenze del parco veicoli</h1><p className="mt-2 text-sm text-zinc-600">Controlla le priorità generali, poi apri il singolo mezzo per gestirne dettagli, chilometri e spese.</p></div>
        <div className="flex flex-wrap gap-2 shrink-0"><Link href="/garage" className="min-h-11 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800"><Warehouse className="w-4 h-4" />Gestisci veicoli</Link><Link href="/promemoria?new=1" className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white"><Plus className="w-4 h-4" />Nuova scadenza</Link></div>
      </section>

      {error && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Alcuni dati non sono disponibili. Verifica il collegamento al database e riprova.</p>}

      <section aria-label="Riepilogo parco veicoli" className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {[
          ['Veicoli', fleet.bikes.length, 'Mezzi registrati', 'text-zinc-900'],
          ['Scadute', expiredCount, 'Da gestire subito', expiredCount ? 'text-rose-700' : 'text-zinc-900'],
          ['In scadenza', warningCount, 'Entro il preavviso', warningCount ? 'text-amber-700' : 'text-zinc-900'],
        ].map(([label, value, note, color]) => <article key={String(label)} className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-3 sm:p-5 shadow-sm"><p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-600 truncate">{label}</p><p className={`mt-2 text-2xl sm:text-3xl font-bold font-mono ${color}`}>{value}</p><p className="mt-1 text-[10px] sm:text-xs text-zinc-500">{note}</p></article>)}
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Accesso rapido</p><h2 className="text-xl font-bold text-zinc-900">Veicoli</h2></div><Link href="/garage" className="text-sm font-semibold text-orange-700">Parco veicoli →</Link></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fleet.bikes.map(vehicle => {
            const vehicleReminders = reminders.filter(reminder => reminder.bikeId === vehicle.id);
            const vehicleAlerts = vehicleReminders.filter(reminder => reminder.status !== 'ok').length;
            return <Link key={vehicle.id} href={`/veicoli/${vehicle.id}`} className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm hover:border-orange-300 hover:shadow-md transition-all">
              <div className="flex items-start gap-4"><div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: vehicle.primary_color || '#ea580c' }}><VehicleIcon bike={vehicle} className="w-6 h-6" /></div><div className="min-w-0 flex-1"><p className="text-xs text-zinc-500">{vehicleTypeLabel(vehicle)}{vehicle.plate ? ` · ${vehicle.plate}` : ''}</p><h3 className="font-bold text-zinc-900 truncate">{vehicle.name} {vehicle.model}</h3><p className="mt-1 text-xs text-zinc-600">{formatKm(vehicle.current_km_hours)}</p></div><ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-orange-700 transition-colors" /></div>
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3 text-xs"><div><p className="text-zinc-500">Scadenze</p><p className="font-semibold text-zinc-900">{vehicleReminders.length}</p></div><div><p className="text-zinc-500">Da gestire</p><p className={`font-semibold ${vehicleAlerts ? 'text-amber-700' : 'text-emerald-700'}`}>{vehicleAlerts}</p></div></div>
            </Link>;
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Scadenzario generale</p><h2 className="text-xl font-bold text-zinc-900">Tutte le scadenze</h2></div><Link href="/promemoria" className="text-sm font-semibold text-orange-700">Gestisci catalogo →</Link></div>
        {!reminders.length ? <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center"><CalendarClock className="w-8 h-8 text-zinc-400 mx-auto" /><p className="mt-3 font-semibold text-zinc-900">Nessuna scadenza configurata</p><p className="mt-1 text-sm text-zinc-600">Apri un veicolo o usa lo scadenzario per aggiungere la prima data.</p></div> : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{reminders.map(reminder => <Link key={reminder.id} href={`/veicoli/${reminder.bikeId}`} className={`rounded-2xl border bg-white p-5 space-y-3 hover:shadow-md transition-shadow ${reminder.status === 'expired' ? 'border-rose-300' : reminder.status === 'warning' ? 'border-amber-300' : 'border-zinc-200'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-zinc-500">{reminder.bikeName}</p><h3 className="font-bold text-zinc-900">{reminder.title || reminder.category}</h3></div><span className={`rounded-full px-2 py-1 text-xs font-semibold shrink-0 ${reminder.status === 'expired' ? 'bg-rose-50 text-rose-700' : reminder.status === 'warning' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>{reminder.status === 'expired' ? 'Scaduta' : reminder.status === 'warning' ? 'In scadenza' : 'Programmata'}</span></div><p className="text-xs text-zinc-500">{reminder.category}</p><p className="font-mono text-sm font-semibold text-zinc-900">{reminderTarget(reminder)}</p><p className="text-sm text-zinc-700">{reminderRemaining(reminder)}</p></Link>)}</div>}
      </section>
    </main>
    <BottomNav alertsCount={alertsCount} />
  </>;
}
