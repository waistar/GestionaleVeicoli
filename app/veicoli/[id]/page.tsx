import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllBikes } from '@/app/actions/bikes';
import { createClient } from '@/lib/supabase/server';
import type { MaintenanceLog, VehicleExpense, VehicleReminder } from '@/lib/supabase/types';
import { calculateStats } from '@/lib/reminders';
import { summarizeExpenses } from '@/lib/expenses';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatCards } from '@/components/dashboard/StatCards';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { DashboardRemindersWidget } from '@/components/dashboard/DashboardRemindersWidget';
import { SupabaseSetupBanner } from '@/components/setup/SupabaseSetupBanner';
import { VehiclePhoto } from '@/components/garage/VehicleViewer';
import { vehicleTypeLabel } from '@/lib/vehicle-catalog';
import { Bell, FileArchive, Plus, Warehouse } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VehicleDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fleet = await getAllBikes();
  const bike = fleet.bikes.find(vehicle => vehicle.id === id);
  if (!bike) notFound();

  let logs: MaintenanceLog[] = [];
  let scheduled: VehicleReminder[] = [];
  let vehicleExpenses: VehicleExpense[] = [];
  let error = fleet.error;
  let expenseError = '';
  try {
    const db = await createClient();
    const [history, plans, expenses] = await Promise.all([
      db.from('maintenance_logs').select('*').eq('bike_id', id).order('date', { ascending: false }),
      db.from('vehicle_reminders').select('*').eq('bike_id', id),
      db.from('vehicle_expenses').select('*').eq('vehicle_ref', id).order('date', { ascending: false }),
    ]);
    logs = (history.data || []) as MaintenanceLog[];
    scheduled = (plans.data || []) as VehicleReminder[];
    vehicleExpenses = (expenses.data || []) as VehicleExpense[];
    error = error || history.error?.message || plans.error?.message;
    expenseError = expenses.error?.message || '';
  } catch (loadError) {
    error = loadError instanceof Error ? loadError.message : 'Impossibile caricare i dati del veicolo.';
    expenseError = error;
  }

  const isFallback = fleet.isFallback;
  const stats = calculateStats(bike, logs, scheduled);
  let expenseTotalCents = 0;
  let expensesUnavailable = Boolean(expenseError);
  if (!expensesUnavailable) {
    try { expenseTotalCents = summarizeExpenses(vehicleExpenses, fleet.bikes).total; }
    catch { expensesUnavailable = true; }
  }

  return <>
    <Header bike={bike} alertsCount={stats.alertsTotal} allBikes={fleet.bikes} />
    <main className="flex-1 max-w-md md:max-w-5xl lg:max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-24 md:pb-10 space-y-6">
      <SupabaseSetupBanner isFallback={isFallback} />
      {error && !isFallback && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Alcuni dati dello scadenzario non sono disponibili. Verifica che il database sia aggiornato allo schema del progetto.</p>}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-zinc-200"><div className="flex items-center gap-4"><VehiclePhoto bike={bike} className="w-16 h-16 rounded-xl border border-zinc-200 shrink-0" /><div><h1 className="text-xl font-bold text-zinc-900">{bike.name} {bike.model}</h1><p className="text-sm text-zinc-600 mt-1">{vehicleTypeLabel(bike)}{bike.plate ? ` · ${bike.plate}` : ''}{bike.year ? ` · ${bike.year}` : ''}</p></div></div><div className="flex items-center gap-2 flex-wrap"><Link href="/" className="min-h-11 px-3 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1.5"><Warehouse className="w-3.5 h-3.5" />Panoramica</Link><Link href={`/promemoria?vehicle=${bike.id}`} className="min-h-11 px-3 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1.5"><Bell className="w-3.5 h-3.5" />Scadenze ({stats.reminders.length})</Link><Link href={`/documenti?vehicle=${bike.id}`} className="min-h-11 px-3 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-semibold flex items-center gap-1.5"><FileArchive className="w-3.5 h-3.5" />Documenti</Link><Link href={`/promemoria?new=1&vehicle=${bike.id}`} className="min-h-11 px-4 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5"><Plus className="w-4 h-4" />Nuova scadenza</Link></div></div>
      <StatCards key={bike.id} bike={bike} alertsCount={stats.alertsTotal} expenseTotalCents={expenseTotalCents} expenseCount={vehicleExpenses.length} expensesUnavailable={expensesUnavailable} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"><div className="lg:col-span-7 space-y-6"><AlertBanner reminders={stats.reminders} /></div><div className="lg:col-span-5"><DashboardRemindersWidget bike={bike} reminders={stats.reminders} /></div></div>
    </main>
    <BottomNav alertsCount={stats.alertsTotal} />
  </>;
}
