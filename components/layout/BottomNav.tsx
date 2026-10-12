'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wrench, Plus, Bell } from 'lucide-react';

interface BottomNavProps {
  alertsCount?: number;
}

export function BottomNav({ alertsCount = 0 }: BottomNavProps) {
  const pathname = usePathname();

  const isHome = pathname === '/';
  const isInterventi = pathname === '/interventi';
  
  const isPromemoria = pathname === '/promemoria';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 px-3 py-2 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Dashboard */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            isHome
              ? 'text-orange-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">Home</span>
        </Link>

        {/* Interventi */}
        <Link
          href="/interventi"
          className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            isInterventi
              ? 'text-orange-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Wrench className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] tracking-tight">Storico</span>
        </Link>

        {/* Central Action: + Nuovo */}
        <Link
          href="/interventi/nuovo"
          className="flex flex-col items-center justify-center -mt-5"
          aria-label="Registra nuovo intervento"
        >
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30 border-2 border-zinc-900 active:scale-95 transition-transform">
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-orange-400 mt-1">Nuovo</span>
        </Link>

        {/* Scadenze & Promemoria */}
        <Link
          href="/promemoria"
          className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all ${
            isPromemoria
              ? 'text-orange-400 font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Bell className="w-5 h-5 mb-0.5" />
            {alertsCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-zinc-950 animate-pulse">
                {alertsCount > 9 ? '9+' : alertsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight">Scadenze</span>
        </Link>
      </div>
    </nav>
  );
}
