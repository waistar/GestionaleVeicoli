import { EmptyGarage } from '@/components/garage/EmptyGarage';
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
  const { bike, logs, scheduled, isFallback } = await getMainData(activeBikeId);
  if (!bike) return <EmptyGarage databaseUnavailable={isFallback} />;
  const stats = calculateStats(bike, logs, scheduled);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-100 text-zinc-900">
      <Header bike={bike} alertsCount={stats.alertsTotal} allBikes={bikes} fleetOverview />

      <main className="flex-1 max-w-md md:max-w-5xl lg:max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 md:pt-6 pb-24 md:pb-10 space-y-6">
        {/* Page Title & Garage Intro */}
        <div className="flex items-center justify-between px-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-700">
                <BikeIcon className="w-5 h-5" />
              </div>
              Parco veicoli
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1">
              Anagrafica dei veicoli e punto di partenza per assicurazioni, bollo, revisione e altre scadenze.
            </p>
          </div>
        </div>

        {/* Garage Fleet View with 3D Showroom & Card Grid */}
        <GarageFleetView bikes={bikes} activeBikeId={activeBikeId} />
      </main>

      <BottomNav alertsCount={stats.alertsTotal} />
    </div>
  );
}
