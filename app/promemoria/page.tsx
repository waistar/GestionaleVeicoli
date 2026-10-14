import { getAllBikes } from '@/app/actions/bikes';
import { getMainData } from '@/app/actions/maintenance';
import { createClient } from '@/lib/supabase/server';
import { EmptyGarage } from '@/components/garage/EmptyGarage';
import { MaintenanceLog, VehicleReminder } from '@/lib/supabase/types';
import { calculateReminders, sortReminders } from '@/lib/reminders';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { ReminderManager } from '@/components/reminders/ReminderManager';
export const dynamic = 'force-dynamic';
export default async function PromemoriaPage({ searchParams }: { searchParams: Promise<{ vehicle?: string; new?: string }> }) {
  const params = await searchParams;
  const { bikes, isFallback } = await getAllBikes();
  const { bike } = await getMainData();
  if (!bike) return <EmptyGarage databaseUnavailable={isFallback} />;
  let logs: MaintenanceLog[] = [];
  let scheduled: VehicleReminder[] = [];
  let error: string | undefined;
  if (!isFallback) {
    const db = await createClient();
    const [history, plans] = await Promise.all([db.from('maintenance_logs').select('*'), db.from('vehicle_reminders').select('*').order('created_at', {ascending:false})]);
    logs = history.data || []; scheduled = plans.data || [];
    error = history.error?.message || plans.error?.message;
  }
  const reminders = sortReminders(bikes.flatMap(vehicle => calculateReminders(vehicle, logs, scheduled)));
  const alertsCount = reminders.filter(r => r.status !== 'ok').length;
  return <><Header bike={bike} alertsCount={alertsCount} allBikes={bikes} /><main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-24 space-y-6"><div><p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Tutti i veicoli · gestione interna</p><h1 className="text-2xl font-bold text-zinc-900">Scadenzario del parco veicoli</h1><p className="text-sm text-zinc-600 mt-2">Assicurazioni, bollo, revisione, documenti e manutenzioni, con date, chilometraggi e relativi importi.</p></div><ReminderManager bikes={bikes} reminders={reminders} scheduled={scheduled} isFallback={isFallback} error={error} initialVehicle={params.vehicle} openNew={params.new === '1'} /></main><BottomNav alertsCount={alertsCount} /></>;
}
