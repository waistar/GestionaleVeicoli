import React from 'react';
import Link from 'next/link';
import { getMainData } from '@/app/actions/maintenance';
import { getAllBikes } from '@/app/actions/bikes';
import { calculateStats } from '@/lib/reminders';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { ChevronLeft, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NuovoInterventoPage() {
  const { bikes } = await getAllBikes();
  const { bike, logs } = await getMainData();
  const stats = calculateStats(bike, logs);

  return (
    <>
      <Header bike={bike} alertsCount={stats.alertsTotal} allBikes={bikes} />

      <main className="flex-1 max-w-md md:max-w-5xl lg:max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-20 md:pb-10">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <Link
            href="/interventi"
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
            aria-label="Torna agli interventi"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <Wrench className="w-5 h-5" />
              </div>
              Nuovo Intervento
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Registra lavoro di manutenzione e ricambi per {bike.name}
            </p>
          </div>
        </div>

        <MaintenanceForm bike={bike} />
      </main>

      <BottomNav alertsCount={stats.alertsTotal} />
    </>
  );
}
