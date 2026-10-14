'use client';
/* eslint-disable @next/next/no-img-element -- Le foto arrivano da Supabase Storage con URL dinamici. */
import { CarFront, Truck, Bike as BikeIcon, ImageIcon } from 'lucide-react';
import type { Bike } from '@/lib/supabase/types';
import { vehicleType, vehicleTypeLabel } from '@/lib/vehicle-catalog';

export function VehicleIcon({ bike, className }: { bike: Partial<Bike>; className?: string }) {
  const type = vehicleType(bike);
  const Icon = type === 'auto' ? CarFront : type === 'furgone' ? Truck : BikeIcon;
  return <Icon className={className} />;
}

export function VehiclePhoto({ bike, className = '', height }: { bike: Partial<Bike>; className?: string; height?: number | string }) {
  return <div className={`overflow-hidden bg-zinc-100 flex items-center justify-center ${className}`} style={height ? { height } : undefined}>
    {bike.image_url ? (
      <img src={bike.image_url} alt={`${bike.name || 'Veicolo'} ${bike.model || ''}`} className="h-full w-full bg-white object-contain" />
    ) : (
      <div className="flex h-full min-h-24 w-full flex-col items-center justify-center gap-1 text-zinc-400">
        <ImageIcon className="h-6 w-6" />
        <span className="text-[10px] font-medium">Nessuna foto</span>
      </div>
    )}
  </div>;
}

export function VehicleViewer({ bike, className = '', height = 220 }: { bike: Partial<Bike>; className?: string; height?: number | string }) {
  return <div className={`overflow-hidden rounded-xl border border-zinc-200 bg-white ${className}`}>
    <VehiclePhoto bike={bike} height={height} className="w-full" />
    <div className="border-t border-zinc-100 px-4 py-3">
      <p className="font-semibold text-zinc-900">{bike.name} {bike.model}</p>
      <p className="text-xs text-zinc-500">{vehicleTypeLabel(bike)}{bike.plate ? ` · ${bike.plate}` : ''}</p>
    </div>
  </div>;
}
