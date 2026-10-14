'use client'

import React, { useState } from 'react';
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
import { updateBikeKm } from '@/app/actions/bikes';
import { Gauge, Bell, Wrench, Edit3, Loader2 } from 'lucide-react';

interface StatCardsProps {
  bike: Bike;
  alertsCount: number;
  totalInterventions: number;
}

export function StatCards({ bike, alertsCount, totalInterventions }: StatCardsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newKm, setNewKm] = useState(bike.current_km_hours.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateKm = async () => {
    const parsed = parseFloat(newKm);
    if (isNaN(parsed) || parsed < 0) return;
    setIsUpdating(true);
    await updateBikeKm(bike.id, parsed);
    setIsUpdating(false);
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

        {/* Interventi Totali */}
        <Card className="bg-zinc-50/90 border-zinc-200 p-3 sm:p-4 md:p-5 flex flex-col justify-between shadow-md rounded-2xl hover:border-zinc-200 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-zinc-600 uppercase tracking-wider">Interventi</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3">
            <span className="text-lg sm:text-2xl lg:text-3xl font-bold font-mono text-zinc-900 tracking-tight block">
              {totalInterventions}
            </span>
            <span className="text-[10px] sm:text-xs text-zinc-600 block mt-0.5 sm:mt-1">
              Interventi registrati
            </span>
          </div>
        </Card>
      </div>

      {/* Dialog aggiornamento Chilometri / Ore */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-zinc-50 border-zinc-200 text-zinc-900 max-w-sm sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-900">
              <Gauge className="w-5 h-5 text-orange-700" />
              Aggiorna Chilometri / Ore
            </DialogTitle>
            <DialogDescription className="text-zinc-600 text-xs">
              Inserisci la lettura attuale del contachilometri per ricalcolare tutte le scadenze.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <label className="text-xs font-semibold text-zinc-700 mb-1.5 block">
              Chilometraggio Attuale (km)
            </label>
            <Input
              type="number"
              value={newKm}
              onChange={(e) => setNewKm(e.target.value)}
              className="bg-white border-zinc-200 text-lg font-mono text-zinc-900 h-12"
              placeholder="es. 14500"
            />
          </div>

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
              disabled={isUpdating}
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
