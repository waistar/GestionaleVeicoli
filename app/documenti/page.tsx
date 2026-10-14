import { getAllBikes } from '@/app/actions/bikes';
import { getDocuments } from '@/app/actions/documents';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { EmptyGarage } from '@/components/garage/EmptyGarage';
import { DocumentManager } from '@/components/documents/DocumentManager';
import { ArchiveAccess } from '@/components/documents/ArchiveAccess';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const params = await searchParams;
  const fleet = await getAllBikes();
  if (!fleet.bikes.length) return <EmptyGarage databaseUnavailable={fleet.isFallback} />;
  const initialVehicle = fleet.bikes.some(vehicle => vehicle.id === params.vehicle) ? params.vehicle : undefined;
  const activeVehicle = fleet.bikes.find(vehicle => vehicle.id === initialVehicle) || fleet.bikes.find(vehicle => vehicle.id === fleet.activeBikeId) || fleet.bikes[0];
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  let authorized = false;
  if (user) {
    const { data: member } = await db.from('archive_members').select('user_id').eq('user_id', user.id).maybeSingle();
    authorized = Boolean(member);
  }
  const archive = authorized ? await getDocuments() : { documents: [] };
  return <>
    <Header bike={activeVehicle} allBikes={fleet.bikes} fleetOverview={!initialVehicle} />
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 space-y-6">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-orange-700">Archivio online · tutti i veicoli</p><h1 className="text-2xl font-bold text-zinc-900">Documenti dei veicoli</h1><p className="mt-2 text-sm text-zinc-600">Conserva assicurazioni, libretti, revisioni e documenti degli interventi in PDF e scaricali da qualsiasi dispositivo.</p></div>
      {authorized ? <DocumentManager bikes={fleet.bikes} documents={archive.documents} error={archive.error} initialVehicle={initialVehicle} accountEmail={user?.email} /> : <ArchiveAccess signedInEmail={user?.email} />}
    </main>
    <BottomNav />
  </>;
}
