'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { Bike } from '@/lib/supabase/types';
import { formatKm } from '@/lib/reminders';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { vehicleTypeLabel } from '@/lib/vehicle-catalog';
import { VehiclePhoto } from './VehicleViewer';
import { AddBikeModal } from './AddBikeModal';
import { EditBikeModal } from './EditBikeModal';
import { DeleteBikeModal } from './DeleteBikeModal';
import { setActiveBike } from '@/app/actions/bikes';
import { Bell, Edit3, Gauge, LayoutDashboard, Plus, Trash2 } from 'lucide-react';

interface GarageFleetViewProps {
  bikes: Bike[];
  activeBikeId: string;
}

export function GarageFleetView({ bikes: initialBikes, activeBikeId: initialActiveId }: GarageFleetViewProps) {
  const [bikes, setBikes] = useState<Bike[]>(initialBikes);
  const [activeBikeId, setActiveBikeId] = useState(initialActiveId);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [bikeToEdit, setBikeToEdit] = useState<Bike | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bikeToDelete, setBikeToDelete] = useState<Bike | null>(null);
  const handleSelectActive = (bikeId: string) => {
    setActiveBikeId(bikeId);
    void setActiveBike(bikeId);
  };

  const handleBikeCreated = (newBike: Bike) => {
    setBikes(current => [newBike, ...current]);
    setActiveBikeId(newBike.id);
  };

  const handleBikeUpdated = (updated: Bike) => {
    setBikes(current => current.map(bike => bike.id === updated.id ? updated : bike));
  };

  const handleBikeDeleted = (deletedId: string) => {
    setBikes(current => {
      const remaining = current.filter(bike => bike.id !== deletedId);
      if (activeBikeId === deletedId) setActiveBikeId(remaining[0]?.id || '');
      return remaining;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900">Veicoli registrati ({bikes.length})</h2>
          <p className="text-xs text-zinc-600 mt-1">Seleziona il veicolo da gestire oppure apri direttamente le sue scadenze.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)} className="min-h-11 bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 rounded-xl">
          <Plus className="w-4 h-4" /> Aggiungi veicolo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {bikes.map(bike => {
          const isActive = bike.id === activeBikeId;
          return (
            <Card key={bike.id} className={`p-4 rounded-2xl border ${isActive ? 'bg-orange-50/50 border-orange-300' : 'bg-white border-zinc-200'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <VehiclePhoto bike={bike} className="w-14 h-14 rounded-xl shrink-0 border border-zinc-200" />
                  <div className="min-w-0">
                    <h3 className="font-bold text-zinc-900 truncate">{bike.name}</h3>
                    <p className="text-sm text-zinc-600 truncate">{bike.model}{bike.year ? ` · ${bike.year}` : ''}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{bike.plate || 'Targa non inserita'}</p>
                  </div>
                </div>
                <Badge className={isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-zinc-100 text-zinc-700 border border-zinc-200'}>
                  {isActive ? 'SELEZIONATO' : vehicleTypeLabel(bike)}
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                <span className="text-xs text-zinc-600 flex items-center gap-1.5"><Gauge className="w-4 h-4 text-orange-700" />Chilometri</span>
                <span className="text-sm font-mono font-bold text-zinc-900">{formatKm(bike.current_km_hours)}</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href={`/promemoria?vehicle=${bike.id}`} className="min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 px-3 text-sm font-semibold text-white">
                  <Bell className="w-4 h-4" /> Scadenze
                </Link>
                <Link href={`/veicoli/${bike.id}`} onClick={() => handleSelectActive(bike.id)} className="min-h-11 inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3 text-sm font-semibold text-zinc-800 hover:border-orange-300 hover:text-orange-700">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              </div>

              <div className="mt-3 flex justify-end gap-1 border-t border-zinc-100 pt-3">
                <button type="button" onClick={() => { setBikeToEdit(bike); setIsEditOpen(true); }} className="min-h-11 inline-flex items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100" aria-label={`Modifica ${bike.name}`}><Edit3 className="w-4 h-4" />Modifica</button>
                <button type="button" onClick={() => { setBikeToDelete(bike); setIsDeleteOpen(true); }} className="min-h-11 inline-flex items-center rounded-lg px-3 text-rose-700 hover:bg-rose-50" aria-label={`Elimina ${bike.name}`}><Trash2 className="w-4 h-4" /></button>
              </div>
            </Card>
          );
        })}
      </div>

      <AddBikeModal open={isAddOpen} onOpenChange={setIsAddOpen} onBikeCreated={handleBikeCreated} />
      {isEditOpen && <EditBikeModal key={bikeToEdit?.id} bike={bikeToEdit} open={isEditOpen} onOpenChange={setIsEditOpen} onBikeUpdated={handleBikeUpdated} />}
      <DeleteBikeModal bike={bikeToDelete} open={isDeleteOpen} onOpenChange={setIsDeleteOpen} onBikeDeleted={handleBikeDeleted} />
    </div>
  );
}
