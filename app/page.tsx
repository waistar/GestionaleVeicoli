import React from 'react';
import Link from 'next/link';
import { getMainData } from '@/app/actions/maintenance';
import { getAllBikes } from '@/app/actions/bikes';
import { calculateStats, formatKm } from '@/lib/reminders';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatCards } from '@/components/dashboard/StatCards';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { RecentInterventions } from '@/components/dashboard/RecentInterventions';
import { DashboardRemindersWidget } from '@/components/dashboard/DashboardRemindersWidget';
import { SupabaseSetupBanner } from '@/components/setup/SupabaseSetupBanner';
import { Plus, Wrench, Bell, Bike as BikeIcon, ShieldCheck, Warehouse } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { bikes } = await getAllBikes();
  const { bike, logs, isFallback } = await getMainData();
  const stats = calculateStats(bike, logs);

  return (
    <>
      <Header bike={bike} alertsCount={stats.alertsTotal} allBikes={bikes} />

      <main className="flex-1 max-w-md md:max-w-5xl lg:max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-24 md:pb-10 space-y-6">
        <SupabaseSetupBanner isFallback={isFallback} />

        {/* Desktop Welcome / Garage Hero Banner */}
        <div className="hidden md:flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-900/60 border border-zinc-800 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <BikeIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-zinc-100">{bike.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold font-mono">
                  {bike.model} {bike.year ? `• ${bike.year}` : ''}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Garage Attivo
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Quadro di controllo garage: stato di usura ricambi, scadenze tagliandi e storico spese.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/garage"
              className="px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Warehouse className="w-3.5 h-3.5" />
              Garage 3D ({bikes.length})
            </Link>
            <Link
              href="/interventi"
              className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-orange-400" />
              Interventi ({logs.length})
            </Link>
            <Link
              href="/interventi/nuovo"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Nuovo Intervento
            </Link>
          </div>
        </div>

        {/* Stat Cards (3 responsive cards) */}
        <StatCards
          bike={bike}
          totalCost={stats.totalCost}
          totalInterventions={stats.totalInterventions}
        />

        {/* 2-Column Responsive Grid on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Column */}
          <div className="lg:col-span-7 space-y-6">
            <AlertBanner reminders={stats.reminders} />
            <RecentInterventions logs={logs} />
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
