'use client'

import React from 'react';
import Link from 'next/link';
import { Bike } from '@/lib/supabase/types';
import { formatKm } from '@/lib/reminders';
import { Gauge, Bike as BikeIcon } from 'lucide-react';


interface HeaderProps {
  bike: Bike;
}

export function Header({ bike }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
            <BikeIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-zinc-100 tracking-tight">MotoTracker</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Garage
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium truncate max-w-[150px]">
              {bike.name} {bike.year ? `(${bike.year})` : ''}
            </p>
          </div>
        </Link>

        {/* Current Odometer Pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 shadow-inner">
            <Gauge className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs font-mono font-bold text-zinc-200">
              {formatKm(bike.current_km_hours)}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
