'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Bike } from '@/lib/supabase/types';
import { formatCurrency } from '@/lib/expenses';
import type { AnnualVehicleCosts } from '@/lib/annual-costs';
import { updateBikeKm } from '@/app/actions/bikes';
import { Gauge, Bell, Wallet, Edit3, Loader2 } from 'lucide-react';

interface StatCardsProps {
  bike: Bike;
  alertsCount: number;
  annualCosts: AnnualVehicleCosts;
  expensesUnavailable?: boolean;
}

export function StatCards({ bike, alertsCount, annualCosts, expensesUnavailable = false }: StatCardsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newKm, setNewKm] = useState(bike.current_km_hours.toString());
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const handleUpdateKm = async () => {
    const parsed = parseFloat(newKm);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setUpdateError('Inserisci un chilometraggio valido.');
      return;
    }
    setUpdateError('');
    setIsUpdating(true);
    const result = await updateBikeKm(bike.id, parsed);
    setIsUpdating(false);
    if (!result.success) {
      setUpdateError(result.error || 'Aggiornamento non riuscito. Riprova.');
      return;
    }
    setIsEditOpen(false);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-5">
        {/* Chilometraggio Attuale */}
        <Card 
          onClick={() => setIsEditOpen(true)}
          className="bg-zinc-50/90 border-zinc-200 p-3 sm:p-4 md:p-5 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-all hover:border-zinc-200 hover:bg-zinc-100/80 shadow-md group rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-600 uppercase tracking-wider">Km Attuali</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-700 group-hover:scale-110 transition-transform">
              <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-lg sm:text-2xl lg:text-3xl font-bold font-mono text-zinc-900 tracking-tight block">
              {new Intl.NumberFormat('it-IT').format(Math.round(bike.current_km_hours))}
            </span>
            <span className="text-[10px] sm:text-xs text-orange-700 flex items-center gap-1 mt-0.5 sm:mt-1 font-medium">
              <Edit3 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Modifica lettura
            </span>
          </div>
        </Card>

        {/* Scadenze da gestire */}
        <Card className="bg-zinc-50/90 border-zinc-200 p-3 sm:p-4 md:p-5 flex flex-col justify-between shadow-md rounded-2xl hover:border-zinc-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-600 uppercase tracking-wider">Scadenze</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className={`text-lg sm:text-2xl lg:text-3xl font-bold font-mono tracking-tight block truncate ${alertsCount > 0 ? 'text-amber-700' : 'text-zinc-900'}`}>
              {alertsCount}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-600 block mt-0.5 sm:mt-1">
              Scadute o imminenti
            </span>
          </div>
        </Card>

        {/* Spese del veicolo */}
        <Link href={`/spese?vehicle=${bike.id}`} aria-label={`Apri le spese di ${bike.name}`} className="min-w-0">
          <Card className="h-full bg-zinc-50/90 border-zinc-200 p-3 sm:p-4 md:p-5 flex flex-col justify-between shadow-md rounded-2xl hover:border-orange-300 hover:bg-orange-50/40 transition-all">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-semibold text-zinc-600 uppercase tracking-wider truncate" title={`Spese ${annualCosts.year}`}>Spese annue</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-700 shrink-0">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 min-w-0">
              <span className="text-base sm:text-2xl lg:text-3xl font-bold font-mono text-zinc-900 tracking-tight block break-words leading-tight">
                {expensesUnavailable ? '—' : formatCurrency(annualCosts.totalCents)}
              </span>
              <span className="text-[10px] sm:text-xs text-zinc-600 block mt-0.5 sm:mt-1">
                {expensesUnavailable ? 'Dati non disponibili' : `${annualCosts.year} · ${annualCosts.recurringCount} ricorrenti · ${annualCosts.interventionCount} interventi · ${annualCosts.otherExpenseCount} altre`}
              </span>
            </div>
          </Card>
        </Link>
      </div>

      {/* Dialog aggiornamento Chilometri / Ore */}
      <Dialog open={isEditOpen} onOpenChange={(open) => { setIsEditOpen(open); if (open) { setNewKm(bike.current_km_hours.toString()); setUpdateError(''); } }}>
        <DialogContent className="bg-zinc-50 border-zinc-200 text-zinc-900 max-w-sm sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-900">
              <Gauge className="w-5 h-5 text-orange-700" />
              Aggiorna chilometri
            </DialogTitle>
            <DialogDescription className="text-zinc-600 text-xs">
              Stai aggiornando <strong>{bike.name} {bike.model}</strong>. Inserisci la lettura attuale del contachilometri.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">
              Chilometraggio Attuale (km)
            </label>
            <Input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={newKm}
              onChange={(e) => { setNewKm(e.target.value); setUpdateError(''); }}
              className="bg-white border-zinc-200 text-lg font-mono text-zinc-900 h-12"
              placeholder="es. 14500"
            />
          </div>

          {updateError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{updateError}</p>}

          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="border-zinc-200 text-zinc-700 hover:bg-zinc-100 flex-1"
            >
              Annulla
            </Button>
            <Button
              onClick={handleUpdateKm}
              disabled={isUpdating || newKm.trim() === ''}
              className="bg-orange-600 hover:bg-orange-500 text-white flex-1 font-semibold"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
