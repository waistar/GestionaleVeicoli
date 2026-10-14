'use client';
import { ComponentProps } from 'react';
import { CarFront, Truck, Bike as BikeIcon } from 'lucide-react';
import { Bike } from '@/lib/supabase/types';
import { vehicleType, vehicleTypeLabel } from '@/lib/vehicle-catalog';
import { Motorcycle3DViewer } from './Motorcycle3DViewer';
export function VehicleIcon({ bike, className }: { bike: Partial<Bike>; className?: string }) {
  const type = vehicleType(bike);
  const Icon = type === 'auto' ? CarFront : type === 'furgone' ? Truck : BikeIcon;
  return <Icon className={className} />;
}
export function VehicleViewer({ staticPreview = false, ...props }: ComponentProps<typeof Motorcycle3DViewer> & { staticPreview?: boolean }) {
  const type = vehicleType(props.bike);
  if (!staticPreview && (type === 'moto' || type === 'scooter')) return <Motorcycle3DViewer {...props} bike={{...props.bike, category: type === 'scooter' ? 'scooter' : props.bike.category}} />;
  return <div className={`relative rounded-2xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-100 flex flex-col items-center justify-center gap-3 overflow-hidden ${props.className || ''}`} style={{height: props.height || 340}}>
    {props.bike.image_url ? <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={props.bike.image_url} alt={`${props.bike.name || ''} ${props.bike.model || ''}`} className="max-h-[75%] w-full object-contain" />
    </> : <VehicleIcon bike={props.bike} className="w-40 h-24 text-zinc-500" />}
    <div className="text-center"><p className="font-bold text-zinc-900">{props.bike.name} {props.bike.model}</p><p className="text-xs text-zinc-600">{vehicleTypeLabel(props.bike)}{props.bike.plate ? ` · ${props.bike.plate}` : ''}</p></div>
  </div>;
}
