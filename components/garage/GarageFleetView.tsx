'use client'

import React, { useState } from 'react';
import { Bike } from '@/lib/supabase/types';
import { formatKm } from '@/lib/reminders';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { vehicleTypeLabel } from '@/lib/vehicle-catalog';
import { VehicleViewer, VehicleIcon } from './VehicleViewer';
import { AddBikeModal } from './AddBikeModal';
import { EditBikeModal } from './EditBikeModal';
import { DeleteBikeModal } from './DeleteBikeModal';
import { setActiveBike } from '@/app/actions/bikes';
import {
  Bike as BikeIcon,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Gauge,
  Sparkles,
  Image as ImageIcon,
  Edit3,
  Trash2,
  Calendar,
  Layers,
  ChevronRight,
  Loader2,
} from 'lucide-react';

interface GarageFleetViewProps {
  bikes: Bike[];
  activeBikeId: string;
}

export function GarageFleetView({ bikes: initialBikes, activeBikeId: initialActiveId }: GarageFleetViewProps) {
  const [bikes, setBikes] = useState<Bike[]>(initialBikes);
  const [activeBikeId, setActiveBikeId] = useState<string>(initialActiveId);
  const [selectedPreviewBikeId, setSelectedPreviewBikeId] = useState<string>(initialActiveId);

  // View mode for featured showcase: '3d' | 'photo'
  const [showcaseMode, setShowcaseMode] = useState<'3d' | 'photo'>('3d');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [bikeToEdit, setBikeToEdit] = useState<Bike | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [bikeToDelete, setBikeToDelete] = useState<Bike | null>(null);

  const [isSwitching, setIsSwitching] = useState<string | null>(null);

  // The bike currently displayed in the hero showroom
  const showcasedBike =
    bikes.find((b) => b.id === selectedPreviewBikeId) ||
    bikes.find((b) => b.id === activeBikeId) ||
    bikes[0];

  const handleSelectActive = async (bikeId: string) => {
    setIsSwitching(bikeId);
    try {
      await setActiveBike(bikeId);
      setActiveBikeId(bikeId);
      setSelectedPreviewBikeId(bikeId);
    } finally {
      setIsSwitching(null);
    }
  };

  const handleBikeCreated = (newBike: Bike) => {
    setBikes([newBike, ...bikes]);
    setActiveBikeId(newBike.id);
    setSelectedPreviewBikeId(newBike.id);
  };

  const handleBikeUpdated = (updated: Bike) => {
    setBikes(bikes.map((b) => (b.id === updated.id ? updated : b)));
    if (showcasedBike?.id === updated.id) {
      setSelectedPreviewBikeId(updated.id);
    }
  };

  const handleBikeDeleted = (deletedId: string) => {
    const remaining = bikes.filter((b) => b.id !== deletedId);
    setBikes(remaining);
    if (activeBikeId === deletedId && remaining.length > 0) {
      setActiveBikeId(remaining[0].id);
      setSelectedPreviewBikeId(remaining[0].id);
    } else if (selectedPreviewBikeId === deletedId && remaining.length > 0) {
      setSelectedPreviewBikeId(remaining[0].id);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO SHOWROOM: 3D MODEL & REFERENCE PROFILE */}
      {showcasedBike && (
        <Card className="bg-gradient-to-b from-zinc-50/90 to-white border-zinc-200 p-4 sm:p-6 rounded-3xl shadow-xl overflow-hidden relative">
          {/* Top Banner Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform"
                style={{
                  background: `linear-gradient(135deg, ${showcasedBike.primary_color || '#ea580c'}, #18181b)`,
                }}
              >
                <VehicleIcon bike={showcasedBike} className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 tracking-tight">
                    {showcasedBike.name}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-orange-700 font-mono font-semibold border border-zinc-200">
                    {showcasedBike.model}
                  </span>
                  {showcasedBike.id === activeBikeId ? (
                    <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-xs px-2.5 py-0.5 flex items-center gap-1 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Veicolo selezionato
                    </Badge>
                  ) : (
                    <button
                      onClick={() => handleSelectActive(showcasedBike.id)}
                      disabled={isSwitching === showcasedBike.id}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/15 hover:bg-orange-500/25 text-orange-700 border border-orange-500/30 font-semibold transition-all flex items-center gap-1 active:scale-95"
                    >
                      {isSwitching === showcasedBike.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      Seleziona veicolo
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-600 mt-0.5">
                  {vehicleTypeLabel(showcasedBike)} · {showcasedBike.plate || 'Targa non inserita'}
                </p>
              </div>
            </div>

            {/* Toggle 3D Model vs Photo */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-zinc-200">
              <button
                onClick={() => setShowcaseMode('3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  showcaseMode === '3d'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Anteprima</span>
              </button>
              <button
                onClick={() => setShowcaseMode('photo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  showcaseMode === 'photo'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-zinc-600 hover:text-zinc-800'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Foto Reale</span>
              </button>
            </div>
          </div>

          {/* Viewer Area */}
          <div className="relative rounded-2xl overflow-hidden border border-zinc-200/80 bg-white">
            {showcaseMode === '3d' ? (
              <VehicleViewer
                key={showcasedBike.id + showcasedBike.primary_color + (showcasedBike.image_url || '')}
                bike={showcasedBike}
                height={340}
                showControls={true}
                autoRotateDefault={true}
              />
            ) : (
              <div className="h-[340px] w-full relative flex items-center justify-center bg-white/90 overflow-hidden">
                {showcasedBike.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={showcasedBike.image_url}
                    alt={showcasedBike.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 mx-auto">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                    <p className="text-sm text-zinc-600">Nessuna foto profilo caricata per questo veicolo.</p>
                    <Button
                      onClick={() => {
                        setBikeToEdit(showcasedBike);
                        setIsEditOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="border-zinc-200 text-orange-700 hover:bg-zinc-100"
                    >
                      Carica Foto Ora
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Specifications Strip */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-white/60 border border-zinc-200/80 flex items-center gap-2.5">
              <Gauge className="w-4 h-4 text-orange-700 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-600 uppercase block font-medium">Contachilometri</span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  {formatKm(showcasedBike.current_km_hours)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/60 border border-zinc-200/80 flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-orange-700 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-600 uppercase block font-medium">Anno</span>
                <span className="font-semibold text-zinc-900 text-sm">
                  {showcasedBike.year || 'Non specificato'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/60 border border-zinc-200/80 flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-orange-700 shrink-0" />
              <div>
                <span className="text-[10px] text-zinc-600 uppercase block font-medium">Categoria</span>
                <span className="font-semibold text-zinc-900 capitalize text-sm">
                  {showcasedBike.category || 'Naked'}
                </span>
              </div>
            </div>

            {/* Quick Actions (Edit / Delete) */}
            <div className="p-1.5 rounded-xl bg-white/60 border border-zinc-200/80 flex items-center justify-around gap-1">
              <button
                onClick={() => {
                  setBikeToEdit(showcasedBike);
                  setIsEditOpen(true);
                }}
                className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                title="Modifica veicolo"
              >
                <Edit3 className="w-3.5 h-3.5 text-orange-700" />
                <span>Modifica</span>
              </button>

              <button
                onClick={() => {
                  setBikeToDelete(showcasedBike);
                  setIsDeleteOpen(true);
                }}
                className="py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center bg-zinc-50 hover:bg-rose-50 text-rose-700"
                title="Elimina veicolo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* 2. FLEET CARDS GRID */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
              <BikeIcon className="w-5 h-5 text-orange-700" />
              Tutti i veicoli ({bikes.length})
            </h3>
            <p className="text-xs text-zinc-600">
              Seleziona un veicolo per visualizzarne lo storico e le scadenze nella dashboard
            </p>
          </div>

          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-xl shadow-md shadow-orange-600/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Aggiungi veicolo</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {bikes.map((bike) => {
            const isActive = bike.id === activeBikeId;
            const isSelectedForShowcase = bike.id === selectedPreviewBikeId;

            return (
              <Card
                key={bike.id}
                onClick={() => setSelectedPreviewBikeId(bike.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                  isActive
                    ? 'bg-zinc-50/95 border-orange-500/50 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/30'
                    : isSelectedForShowcase
                    ? 'bg-zinc-50/80 border-zinc-200'
                    : 'bg-zinc-50/60 border-zinc-200 hover:border-zinc-200 hover:bg-zinc-100/60'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      {/* Photo or 3D Color Avatar */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-white flex items-center justify-center">
                        {bike.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={bike.image_url}
                            alt={bike.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-white"
                            style={{
                              background: `linear-gradient(135deg, ${bike.primary_color || '#ea580c'}, #18181b)`,
                            }}
                          >
                            <VehicleIcon bike={bike} className="w-6 h-6" />
                          </div>
                        )}
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border border-zinc-200"
                          style={{ backgroundColor: bike.primary_color || '#0284c7' }}
                          title="Colore 3D"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-zinc-900 group-hover:text-orange-700 transition-colors">
                            {bike.name}
                          </h4>
                          {isActive && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 font-medium">
                          {bike.model} {bike.year ? `• ${bike.year}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Active Badge */}
                    {isActive ? (
                      <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 text-[10px] font-semibold px-2 py-0.5">
                        ATTIVA
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-100 text-zinc-600 border border-zinc-200 text-[10px] font-medium px-1.5 py-0.5">
                        {bike.category || 'Naked'}
                      </Badge>
                    )}
                  </div>

                  {/* Odometer stat */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/60 border border-zinc-200/80 mb-3">
                    <span className="text-[11px] text-zinc-600 flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5 text-orange-700" />
                      Km Attuali
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-800">
                      {formatKm(bike.current_km_hours)}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/60 mt-1">
                  {isActive ? (
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selezionata
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectActive(bike.id);
                      }}
                      disabled={isSwitching === bike.id}
                      className="text-xs font-bold text-orange-700 hover:text-orange-700 flex items-center gap-1 py-1 px-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 active:scale-95 transition-all"
                    >
                      {isSwitching === bike.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                      Seleziona veicolo
                    </button>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBikeToEdit(bike);
                        setIsEditOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                      title="Modifica"
                      aria-label="Modifica"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBikeToDelete(bike);
                        setIsDeleteOpen(true);
                      }}
                            className="p-1.5 rounded-lg transition-colors text-zinc-600 hover:text-rose-700 hover:bg-rose-50"
                      title="Elimina veicolo"
                      aria-label="Elimina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* New Bike Quick Add Card */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="p-5 rounded-2xl border-2 border-dashed border-zinc-200 hover:border-orange-500/50 hover:bg-zinc-50/40 transition-all text-center flex flex-col items-center justify-center gap-2 group min-h-[140px]"
          >
            <div className="w-10 h-10 rounded-xl bg-zinc-50 group-hover:bg-orange-500/10 flex items-center justify-center text-zinc-600 group-hover:text-orange-700 transition-colors">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-800 group-hover:text-orange-700 transition-colors">
                Aggiungi veicolo
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Auto, furgoni, moto e scooter
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Modals */}
      <AddBikeModal
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onBikeCreated={handleBikeCreated}
      />

      {isEditOpen && <EditBikeModal key={bikeToEdit?.id}
        bike={bikeToEdit}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onBikeUpdated={handleBikeUpdated}
      />}

      <DeleteBikeModal
        bike={bikeToDelete}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        onBikeDeleted={handleBikeDeleted}
      />
    </div>
  );
}
