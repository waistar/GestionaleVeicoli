import { EmptyGarage } from '@/components/garage/EmptyGarage';
import { VehicleIcon } from '@/components/garage/VehicleViewer';
import React from 'react';
import Link from 'next/link';
import { getMainData } from '@/app/actions/maintenance';
import { getAllBikes } from '@/app/actions/bikes';
import { getExpenses } from '@/app/actions/expenses';
import { calculateStats } from '@/lib/reminders';
import { summarizeExpenses } from '@/lib/expenses';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatCards } from '@/components/dashboard/StatCards';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { DashboardRemindersWidget } from '@/components/dashboard/DashboardRemindersWidget';
import { SupabaseSetupBanner } from '@/components/setup/SupabaseSetupBanner';
import { Bell, Plus, ShieldCheck, Warehouse } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [{ bikes }, mainData, expenseData] = await Promise.all([getAllBikes(), getMainData(), getExpenses()]);
  const { bike, logs, scheduled, isFallback, error } = mainData;
  if (!bike) return <EmptyGarage databaseUnavailable={isFallback} />;
  const stats = calculateStats(bike, logs, scheduled);
  const vehicleExpenses = expenseData.expenses.filter(expense => expense.vehicle_ref === bike.id);
  let expenseTotalCents = 0;
  let expensesUnavailable = Boolean(expenseData.error);
  if (!expensesUnavailable) {
    try { expenseTotalCents = summarizeExpenses(vehicleExpenses, bikes).total; }
    catch { expensesUnavailable = true; }
  }

  return (
    <>
      <Header bike={bike} alertsCount={stats.alertsTotal} allBikes={bikes} />

      <main className="flex-1 max-w-md md:max-w-5xl lg:max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-24 md:pb-10 space-y-6">
        <SupabaseSetupBanner isFallback={isFallback} />
        {error && !isFallback && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Alcuni dati dello scadenzario non sono disponibili. Verifica che il database sia aggiornato allo schema del progetto.</p>}

        {/* Desktop Welcome / Garage Hero Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-zinc-50 via-zinc-50 to-zinc-50/60 border border-zinc-200 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <VehicleIcon bike={bike} className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-zinc-900">Scadenze del veicolo</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-700 border border-orange-500/20 font-semibold font-mono">
                  {bike.name} · {bike.model} {bike.year ? `• ${bike.year}` : ''}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Gestione interna
                </span>
              </div>
              <p className="text-xs text-zinc-600 mt-1">
                Assicurazione, bollo, revisione, documenti e manutenzioni del veicolo selezionato.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/garage"
              className="px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 border border-orange-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Warehouse className="w-3.5 h-3.5" />
              Parco veicoli ({bikes.length})
            </Link>
            <Link
              href="/promemoria"
              className="px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-orange-700" />
              Scadenzario ({stats.reminders.length})
            </Link>
            <Link
              href={`/promemoria?new=1&vehicle=${bike.id}`}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nuova scadenza
            </Link>
          </div>
        </div>

        {/* Stat Cards (3 responsive cards) */}
        <StatCards
          bike={bike}
          alertsCount={stats.alertsTotal}
          expenseTotalCents={expenseTotalCents}
          expenseCount={vehicleExpenses.length}
          expensesUnavailable={expensesUnavailable}
        />

        {/* 2-Column Responsive Grid on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column */}
          <div className="lg:col-span-7 space-y-6">
            <AlertBanner reminders={stats.reminders} />
          </div>

          {/* Sidebar Column (Promemoria widget & Scheda veicolo) */}
          <div className="lg:col-span-5">
            <DashboardRemindersWidget
              bike={bike}
              reminders={stats.reminders}
            />
          </div>
        </div>
      </main>

      <BottomNav alertsCount={stats.alertsTotal} />
    </>
  );
}
