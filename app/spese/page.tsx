import { getAllBikes } from '@/app/actions/bikes';
import { createClient } from '@/lib/supabase/server';
import type { MaintenanceLog, VehicleReminder } from '@/lib/supabase/types';
import { buildAutomaticExpenses } from '@/lib/automatic-expenses';
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ExpenseManager } from '@/components/expenses/ExpenseManager';
export const dynamic = 'force-dynamic';
export default async function SpesePage({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const params = await searchParams;
  const fleet = await getAllBikes();
  let error = fleet.isFallback ? 'Impossibile caricare i veicoli. Verifica il collegamento al database e riprova.' : fleet.error;
  let expenses = [] as ReturnType<typeof buildAutomaticExpenses>;
  if (!fleet.isFallback) {
    try {
      const db = await createClient();
      const [reminders, logs] = await Promise.all([
        db.from('vehicle_reminders').select('*'),
        db.from('maintenance_logs').select('*'),
      ]);
      error = error || reminders.error?.message || logs.error?.message;
      if (!error) expenses = buildAutomaticExpenses(fleet.bikes, (reminders.data || []) as VehicleReminder[], (logs.data || []) as MaintenanceLog[]);
    } catch (loadError) {
      error = loadError instanceof Error ? loadError.message : 'Impossibile caricare le spese.';
    }
  }
  const initialVehicle = fleet.bikes.some(vehicle => vehicle.id === params.vehicle) ? params.vehicle : undefined;
  const activeVehicle = fleet.bikes.find(vehicle => vehicle.id === initialVehicle) || fleet.bikes.find(vehicle => vehicle.id === fleet.activeBikeId) || fleet.bikes[0];
  return <>{activeVehicle ? <Header bike={activeVehicle} allBikes={fleet.bikes} fleetOverview={!initialVehicle} /> : <WorkspaceHeader />}<main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 space-y-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Gestione interna · tutti i veicoli</p><h1 className="text-2xl font-bold text-zinc-900">Spese del parco veicoli</h1><p className="mt-2 text-sm text-zinc-600">Totali automatici delle scadenze ricorrenti e degli interventi straordinari.</p></div><ExpenseManager bikes={fleet.bikes} expenses={expenses} error={error} initialVehicle={initialVehicle} /></main><BottomNav /></>;
}
