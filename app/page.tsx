import React from 'react';
import Link from 'next/link';
import { getMainData } from '@/app/actions/maintenance';
import { calculateStats } from '@/lib/reminders';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { StatCards } from '@/components/dashboard/StatCards';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { RecentInterventions } from '@/components/dashboard/RecentInterventions';
import { SupabaseSetupBanner } from '@/components/setup/SupabaseSetupBanner';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { bike, logs, isFallback } = await getMainData();
  const stats = calculateStats(bike, logs);

  return (
    <>
      <Header bike={bike} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-24 space-y-4">
        <SupabaseSetupBanner isFallback={isFallback} />

        <StatCards
          bike={bike}
          totalCost={stats.totalCost}
          totalInterventions={stats.totalInterventions}
        />

        <AlertBanner reminders={stats.reminders} />

        <RecentInterventions logs={logs} />
      </main>

      <div className="fixed bottom-20 right-4 z-30 max-w-md mx-auto">
        <Link
          href="/interventi/nuovo"
          className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs shadow-xl shadow-orange-600/30 border border-orange-400/30 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nuovo Intervento</span>
        </Link>
      </div>

      <BottomNav alertsCount={stats.alertsTotal} />
    </>
  );
}
