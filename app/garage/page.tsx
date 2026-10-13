import React from 'react';
import { getAllBikes } from '@/app/actions/bikes';
import { getMainData } from '@/app/actions/maintenance';
import { calculateStats } from '@/lib/reminders';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { GarageFleetView } from '@/components/garage/GarageFleetView';
import { Bike as BikeIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GaragePage() {
  const { bikes, activeBikeId } = await getAllBikes();
  const { bike, logs } = await getMainData(activeBikeId);
  const stats = calculateStats(bike, logs);

  return (
    <>
      <Header bike={bike} alertsCount={stats.alertsTotal} />

      <main className="flex-1 max-w-md md:max-w-5xl lg:max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-24 md:pb-10 space-y-6">
        {/* Page Title & Garage Intro */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <BikeIcon className="w-5 h-5" />
              </div>
              Il Tuo Garage
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Gestione completa della tua scuderia moto: modelli 3D interattivi, foto profilo e passaggio rapido tra veicoli.
            </p>
          </div>
        </div>

        {/* Garage Fleet View with 3D Showroom & Card Grid */}
        <GarageFleetView bikes={bikes} activeBikeId={activeBikeId} />
      </main>

      <BottomNav alertsCount={stats.alertsTotal} />
    </>
  );
}
