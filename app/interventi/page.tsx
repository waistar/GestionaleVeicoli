import { EmptyGarage } from '@/components/garage/EmptyGarage';
import React from 'react';
import Link from 'next/link';
import { getMainData } from '@/app/actions/maintenance';
import { getAllBikes } from '@/app/actions/bikes';
import { calculateStats } from '@/lib/reminders';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { MaintenanceList } from '@/components/maintenance/MaintenanceList';
import { isExtraordinaryMaintenance, maintenanceCostCents } from '@/lib/annual-costs';
import { formatCurrency } from '@/lib/expenses';
import { Wrench, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InterventiPage() {
  const { bikes } = await getAllBikes();
  const { bike, logs, scheduled, isFallback } = await getMainData();
  if (!bike) return <EmptyGarage databaseUnavailable={isFallback} />;
  const stats = calculateStats(bike, logs, scheduled);
  const extraordinaryLogs = logs.filter(isExtraordinaryMaintenance);
  const currentYear = new Date().getFullYear();
  const annualInterventionCents = extraordinaryLogs
    .filter(log => log.date.startsWith(`${currentYear}-`))
    .reduce((total, log) => total + maintenanceCostCents(log.cost), 0);

  return (
    <>
      <Header bike={bike} alertsCount={stats.alertsTotal} allBikes={bikes} />

      <main className="flex-1 max-w-md md:max-w-5xl lg:max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-20 md:pb-10">
        <div className="flex items-center justify-between mb-4 sm:mb-6 px-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-700">
                <Wrench className="w-5 h-5" />
              </div>
              Storico straordinari
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Riparazioni non ricorrenti, costi e documentazione per {bike.name}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-right"><p className="text-[10px] uppercase text-zinc-500">Spese straordinarie {currentYear}</p><p className="text-sm font-bold font-mono text-zinc-900">{formatCurrency(annualInterventionCents)}</p></div>
          <Link
            href={`/interventi/nuovo?vehicle=${bike.id}`}
            className="min-h-11 flex items-center gap-1.5 px-3.5 sm:px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs sm:text-sm font-bold transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuovo straordinario</span>
          </Link>
          </div>
        </div>

        <MaintenanceList logs={extraordinaryLogs} />
      </main>

      <BottomNav alertsCount={stats.alertsTotal} />
    </>
  );
}
