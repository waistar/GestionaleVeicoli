'use client'

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bike } from '@/lib/supabase/types';
import { formatKm } from '@/lib/reminders';
import { setActiveBike } from '@/app/actions/bikes';
import {
  Gauge,
  Bike as BikeIcon,
  LayoutDashboard,
  Wrench,
  Bell,
  Plus,
  Warehouse,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  bike: Bike;
  alertsCount?: number;
  allBikes?: Bike[];
}

export function Header({ bike, alertsCount = 0, allBikes }: HeaderProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === '/';
  const isInterventi = pathname === '/interventi';
  const isNuovo = pathname === '/interventi/nuovo';
  const isPromemoria = pathname === '/promemoria';
  const isGarage = pathname === '/garage';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickSwitch = async (bikeId: string) => {
    setDropdownOpen(false);
    if (bikeId !== bike.id) {
      await setActiveBike(bikeId);
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Bike Info with Quick Garage Switcher */}
        <div ref={dropdownRef} className="relative flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg text-white group-hover:scale-105 transition-transform"
              style={{
                background: `linear-gradient(135deg, ${bike.primary_color || '#ea580c'}, #18181b)`,
              }}
            >
              <BikeIcon className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base sm:text-lg text-zinc-100 tracking-tight">MotoTracker</span>
              </div>
            </div>
          </Link>

          {/* Quick Bike Pill / Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-left transition-colors cursor-pointer group"
            title="Cambia moto nel garage"
          >
            <div
              className="w-2 h-2 rounded-full ring-1 ring-zinc-700 shrink-0"
              style={{ backgroundColor: bike.primary_color || '#f97316' }}
            />
            <p className="text-xs text-zinc-300 font-semibold truncate max-w-[110px] sm:max-w-[160px]">
              {bike.name}
            </p>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-orange-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Garage Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute top-12 left-10 w-64 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-zinc-850 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-orange-400" />
                  Le Tue Moto
                </span>
                <Link
                  href="/garage"
                  onClick={() => setDropdownOpen(false)}
                  className="text-[11px] font-semibold text-orange-400 hover:text-orange-300"
                >
                  Gestisci Garage →
                </Link>
              </div>

              <div className="py-1 max-h-56 overflow-y-auto space-y-1">
                {allBikes && allBikes.length > 0 ? (
                  allBikes.map((b) => {
                    const isCurrent = b.id === bike.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleQuickSwitch(b.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isCurrent
                            ? 'bg-orange-500/15 text-orange-300 border border-orange-500/20 font-semibold'
                            : 'text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: b.primary_color || '#f97316' }}
                          />
                          <div className="truncate">
                            <span className="block truncate font-bold">{b.name}</span>
                            <span className="text-[10px] text-zinc-400 block truncate">{b.model}</span>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-orange-400 shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-2 text-xs text-zinc-400">
                    <p className="font-semibold text-zinc-200">{bike.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{bike.model}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-850 mt-1">
                <Link
                  href="/garage"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Apri Showroom 3D Garage</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 border border-zinc-800/80 p-1 rounded-xl shadow-inner">
          <Link
            href="/"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isHome
                ? 'bg-zinc-800 text-orange-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/garage"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isGarage
                ? 'bg-zinc-800 text-orange-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Warehouse className="w-4 h-4" />
            <span>Il Tuo Garage</span>
          </Link>

          <Link
            href="/interventi"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isInterventi
                ? 'bg-zinc-800 text-orange-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>Storico Interventi</span>
          </Link>

          <Link
            href="/promemoria"
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isPromemoria
                ? 'bg-zinc-800 text-orange-400 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850'
            }`}
          >
            <div className="relative">
              <Bell className="w-4 h-4" />
              {alertsCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center ring-2 ring-zinc-900">
                  {alertsCount > 9 ? '9+' : alertsCount}
                </span>
              )}
            </div>
            <span>Scadenze & Promemoria</span>
          </Link>
        </nav>

        {/* Right Section: Odometer + Action Button */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Current Odometer Pill */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 shadow-inner"
            title="Chilometraggio attuale registrato"
          >
            <Gauge className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs sm:text-sm font-mono font-bold text-zinc-200">
              {formatKm(bike.current_km_hours)}
            </span>
          </div>

          {/* Desktop New Intervention CTA Button */}
          <Link
            href="/interventi/nuovo"
            className={`hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
              isNuovo
                ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-600/20'
            }`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuovo Intervento</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
