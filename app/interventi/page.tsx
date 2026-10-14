import { EmptyGarage } from '@/components/garage/EmptyGarage';
import React from 'react';
import Link from 'next/link';
import { getMainData } from '@/app/actions/maintenance';
import { getAllBikes } from '@/app/actions/bikes';
import { calculateStats } from '@/lib/reminders';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { MaintenanceList } from '@/components/maintenance/MaintenanceList';
import { Wrench, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InterventiPage() {
  const { bikes } = await getAllBikes();
  const { bike, logs, scheduled, isFallback } = await getMainData();
  if (!bike) return <EmptyGarage databaseUnavailable={isFallback} />;
  const stats = calculateStats(bike, logs, scheduled);

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
              Storico Interventi
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Registro tecnico di manutenzioni, ricambi e foto per {bike.name}
            </p>
          </div>

          <Link
            href="/interventi/nuovo"
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuovo Intervento</span>
          </Link>
        </div>

        <MaintenanceList logs={logs} />
      </main>

      <BottomNav alertsCount={stats.alertsTotal} />
    </>
  );
}
