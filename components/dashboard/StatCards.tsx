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
import { formatCurrency } from '@/lib/reminders';
import { Bike } from '@/lib/supabase/types';
import { updateBikeKm } from '@/app/actions/bikes';
import { Gauge, CircleDollarSign, Wrench, Edit3, Loader2 } from 'lucide-react';

interface StatCardsProps {
  bike: Bike;
  totalCost: number;
  totalInterventions: number;
}

export function StatCards({ bike, totalCost, totalInterventions }: StatCardsProps) {
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
      <div className="grid grid-cols-3 gap-2.5">
        {/* Chilometraggio Attuale */}
        <Card 
          onClick={() => setIsEditOpen(true)}
          className="bg-zinc-900/90 border-zinc-800 p-3 flex flex-col justify-between relative cursor-pointer active:scale-98 transition-transform hover:border-zinc-700 shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Km Attuali</span>
            <Gauge className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold font-mono text-zinc-100 tracking-tight block">
              {new Intl.NumberFormat('it-IT').format(Math.round(bike.current_km_hours))}
            </span>
            <span className="text-[10px] text-orange-400 flex items-center gap-1 mt-0.5">
              <Edit3 className="w-2.5 h-2.5" /> Modifica
            </span>
          </div>
        </Card>

        {/* Spesa Totale */}
        <Card className="bg-zinc-900/90 border-zinc-800 p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Spesa Tot.</span>
            <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold font-mono text-zinc-100 tracking-tight block truncate">
              {formatCurrency(totalCost)}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Cumulativa
            </span>
          </div>
        </Card>

        {/* Interventi Totali */}
        <Card className="bg-zinc-900/90 border-zinc-800 p-3 flex flex-col justify-between shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Lavori</span>
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold font-mono text-zinc-100 tracking-tight block">
              {totalInterventions}
            </span>
            <span className="text-[10px] text-zinc-400 block mt-0.5">
              Registrati
            </span>
          </div>
        </Card>
      </div>

      {/* Dialog aggiornamento Chilometri / Ore */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-zinc-100">
              <Gauge className="w-5 h-5 text-orange-400" />
              Aggiorna Chilometri / Ore
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Inserisci la lettura attuale del contachilometri per ricalcolare tutte le scadenze.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 block">
              Chilometraggio Attuale (km)
            </label>
            <Input
              type="number"
              value={newKm}
              onChange={(e) => setNewKm(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-lg font-mono text-zinc-100 h-12"
              placeholder="es. 14500"
            />
          </div>

          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex-1"
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
