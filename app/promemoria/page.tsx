import React from 'react';
import Link from 'next/link';
import { getMainData } from '@/app/actions/maintenance';
import { calculateStats } from '@/lib/reminders';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { RemindersList } from '@/components/reminders/RemindersList';
import { Bell, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PromemoriaPage() {
  const { bike, logs } = await getMainData();
  const stats = calculateStats(bike, logs);

  return (
    <>
      <Header bike={bike} />

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-20">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-400" />
              Scadenze & Promemoria
            </h1>
            <p className="text-xs text-zinc-400">
              Controllo automatico intervalli e usura
            </p>
          </div>

          <Link
            href="/interventi/nuovo"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Nuovo
          </Link>
        </div>

        <RemindersList reminders={stats.reminders} />
      </main>

      <BottomNav alertsCount={stats.alertsTotal} />
    </>
  );
}
