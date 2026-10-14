'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wrench, Plus, Bell, Warehouse } from 'lucide-react';

interface BottomNavProps {
  alertsCount?: number;
}

export function BottomNav({ alertsCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isInterventi = pathname === '/interventi';
  const isPromemoria = pathname === '/promemoria';
  const isGarage = pathname === '/garage';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 px-2 py-1.5 pb-safe md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Dashboard */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-1.5 xs:px-2 rounded-xl transition-all ${
            isHome
              ? 'text-orange-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 xs:w-5 xs:h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Home</span>
        </Link>

        {/* Interventi */}
        <Link
          href="/interventi"
          className={`flex flex-col items-center justify-center py-1 px-1.5 xs:px-2 rounded-xl transition-all ${
            isInterventi
              ? 'text-orange-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wrench className="w-4 h-4 xs:w-5 xs:h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Storico</span>
        </Link>

        {/* Central Action: + Nuovo */}
        <Link
          href="/interventi/nuovo"
          className="flex flex-col items-center justify-center -mt-4"
          aria-label="Registra nuovo intervento"
        >
          <div className="w-11 h-11 xs:w-12 xs:h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-zinc-900 active:scale-95 transition-transform">
            <Plus className="w-5 h-5 xs:w-6 xs:h-6 stroke-[2.5]" />
          </div>
          <span className="text-[9px] font-bold text-orange-400 mt-0.5">Nuovo</span>
        </Link>

        {/* Scadenze & Promemoria */}
        <Link
          href="/promemoria"
          className={`relative flex flex-col items-center justify-center py-1 px-1.5 xs:px-2 rounded-xl transition-all ${
            isPromemoria
              ? 'text-orange-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Bell className="w-4 h-4 xs:w-5 xs:h-5 mb-0.5" />
            {alertsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center ring-2 ring-zinc-950 animate-pulse">
                {alertsCount > 9 ? '9+' : alertsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Scadenze</span>
        </Link>

        {/* Il Tuo Garage */}
        <Link
          href="/garage"
          className={`flex flex-col items-center justify-center py-1 px-1.5 xs:px-2 rounded-xl transition-all ${
            isGarage
              ? 'text-orange-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Warehouse className="w-4 h-4 xs:w-5 xs:h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Garage</span>
        </Link>
      </div>
    </nav>
  );
}
