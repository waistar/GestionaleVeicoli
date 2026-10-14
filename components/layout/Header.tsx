'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Bike } from '@/lib/supabase/types';
import { setActiveBike } from '@/app/actions/bikes';
import {
  Wallet,
  LayoutDashboard,
  Wrench,
  Bell,
  Warehouse,
  ChevronDown,
  Check,
  FileArchive,
} from 'lucide-react';

interface HeaderProps {
  bike: Bike;
  alertsCount?: number;
  allBikes?: Bike[];
  fleetOverview?: boolean;
}

export function Header({ bike, alertsCount = 0, allBikes, fleetOverview = false }: HeaderProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === '/' || pathname.startsWith('/veicoli/');
  const isInterventi = pathname === '/interventi';
  const isPromemoria = pathname === '/promemoria';
  const isGarage = pathname === '/garage';
  const isExpenses = pathname === '/spese';
  const isDocuments = pathname === '/documenti';
  const isFleetOverview = fleetOverview || pathname === '/';
  const navLinks = [
    { href: '/', label: 'Home', Icon: LayoutDashboard, active: isHome },
    { href: '/garage', label: 'Veicoli', Icon: Warehouse, active: isGarage },
    { href: '/promemoria', label: 'Scadenze', Icon: Bell, active: isPromemoria, badge: alertsCount },
    { href: '/spese', label: 'Spese', Icon: Wallet, active: isExpenses },
    { href: '/documenti', label: 'Documenti', Icon: FileArchive, active: isDocuments },
    { href: '/interventi', label: 'Straordinari', Icon: Wrench, active: isInterventi },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickSwitch = (bikeId: string) => {
    setDropdownOpen(false);
    if (bikeId !== bike.id) void setActiveBike(bikeId);
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-zinc-200/80 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Bike Info with Quick Garage Switcher */}
        <div ref={dropdownRef} className="relative flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/icons/icon-192x192.png" alt="LP Garage" width={40} height={40} priority className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-zinc-200 object-cover group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-lg text-zinc-900 tracking-tight">GestionaleVeicoli</span>
              </div>
            </div>
          </Link>

          {/* Quick Bike Pill / Dropdown Trigger */}
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-left transition-colors cursor-pointer group"
            title="Cambia veicolo"
          >
            <div className={`w-2 h-2 rounded-full ring-1 ring-zinc-200 shrink-0 ${isFleetOverview ? 'bg-orange-500' : ''}`} style={isFleetOverview ? undefined : { backgroundColor: bike.primary_color || '#f97316' }} />
            <p className="text-xs text-zinc-700 font-semibold truncate max-w-[110px] sm:max-w-[160px]">
              {isFleetOverview ? 'Tutti i veicoli' : bike.name}
            </p>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-600 group-hover:text-orange-700 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Garage Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute top-12 left-10 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-zinc-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600 flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-orange-700" />
                  Parco veicoli
                </span>
              </div>

              <div className="py-1 max-h-56 overflow-y-auto space-y-1">
                <Link
                  href="/"
                  onClick={() => setDropdownOpen(false)}
                  aria-current={isFleetOverview ? 'page' : undefined}
                  className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left text-xs font-semibold transition-colors ${isFleetOverview ? 'bg-orange-500/15 text-orange-700 border border-orange-500/20' : 'text-zinc-800 hover:bg-orange-50 hover:text-orange-700'}`}
                >
                  <span className="flex items-center gap-2"><span className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0"><LayoutDashboard className="w-4 h-4" /></span><span><span className="block font-bold">Tutti i veicoli</span><span className="block text-[10px] font-normal text-zinc-500">Panoramica generale</span></span></span>
                  {isFleetOverview && <Check className="w-4 h-4 text-orange-700 shrink-0" />}
                </Link>
                <div className="h-px bg-zinc-100 my-1" />
                {allBikes && allBikes.length > 0 ? (
                  allBikes.map((b) => {
                    const isCurrent = !isFleetOverview && b.id === bike.id;
                    return (
                      <Link
                        key={b.id}
                        href={`/veicoli/${b.id}`}
                        onClick={() => handleQuickSwitch(b.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                          isCurrent
                            ? 'bg-orange-500/15 text-orange-700 border border-orange-500/20 font-semibold'
                            : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: b.primary_color || '#f97316' }}
                          />
                          <div className="truncate">
                            <span className="block truncate font-bold">{b.name}</span>
                            <span className="text-[10px] text-zinc-600 block truncate">{b.model}</span>
                          </div>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-orange-700 shrink-0" />}
                      </Link>
                    );
                  })
                ) : (
                  <div className="p-2 text-xs text-zinc-600">
                    <p className="font-semibold text-zinc-800">{bike.name}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{bike.model}</p>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-zinc-200 mt-1">
                <Link
                  href="/garage"
                  onClick={() => setDropdownOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors"
                >
                  <span>Gestisci parco veicoli</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-zinc-50/80 border border-zinc-200/80 p-1 rounded-xl shadow-inner">
          {navLinks.map(({ href, label, Icon, active, badge }) => <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${active ? 'bg-zinc-100 text-orange-700 shadow-sm' : 'text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100'}`}><span className="relative"><Icon className="w-4 h-4" />{Boolean(badge) && <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold rounded-full min-w-3.5 h-3.5 px-0.5 flex items-center justify-center">{badge! > 9 ? '9+' : badge}</span>}</span><span>{label}</span></Link>)}
        </nav>

      </div>
    </header>
  );
}
