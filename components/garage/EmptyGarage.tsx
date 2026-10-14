'use client';
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CarFront, Plus } from 'lucide-react';
import { AddBikeModal } from './AddBikeModal';
import { BottomNav } from '@/components/layout/BottomNav';
import { SupabaseSetupBanner } from '@/components/setup/SupabaseSetupBanner';

export function EmptyGarage({ databaseUnavailable = false }: { databaseUnavailable?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return <>
    <WorkspaceHeader />
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 pb-24 space-y-6">
      <div><h1 className="text-2xl font-bold text-zinc-900">Parco veicoli</h1><p className="text-sm text-zinc-600 mt-1">Moto, auto, furgoni e scooter · gestione interna</p></div>
      <section className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 sm:p-12 text-center"><CarFront className="mx-auto mb-4 w-12 h-12 text-zinc-400" /><h2 className="text-xl font-bold text-zinc-900">Nessun veicolo presente</h2><p className="text-sm text-zinc-600 mt-2 max-w-md mx-auto">Aggiungi il primo veicolo per iniziare a registrare interventi e pianificare bollo, assicurazione, revisione e manutenzioni.</p><button onClick={() => setOpen(true)} className="min-h-11 inline-flex items-center gap-2 rounded-xl bg-orange-600 text-white font-semibold px-5 mt-6"><Plus className="w-4 h-4" />Aggiungi veicolo</button></section>
      <SupabaseSetupBanner isFallback={databaseUnavailable} />
    </main>
    <AddBikeModal open={open} onOpenChange={setOpen} onBikeCreated={() => router.refresh()} />
    <BottomNav />
  </>;
}
