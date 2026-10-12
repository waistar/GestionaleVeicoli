import React from 'react';
import Link from 'next/link';
import { getMainData } from '@/app/actions/maintenance';
import { calculateStats } from '@/lib/reminders';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { ChevronLeft, Wrench } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NuovoInterventoPage() {
  const { bike, logs } = await getMainData();
  const stats = calculateStats(bike, logs);

  return (
    <>
      <Header bike={bike} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <div className="flex items-center gap-2 mb-3">
          <Link
            href="/interventi"
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200"
            aria-label="Torna agli interventi"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-orange-400" />
              Nuovo Intervento
            </h1>
            <p className="text-xs text-zinc-400">
              Registra manutenzione per {bike.name}
            </p>
          </div>
        </div>

        <MaintenanceForm bike={bike} />
      </main>

      <BottomNav alertsCount={stats.alertsTotal} />
    </>
  );
}
