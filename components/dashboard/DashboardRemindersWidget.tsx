'use client'

import React from 'react';
import Link from 'next/link';
import { ReminderItem, Bike } from '@/lib/supabase/types';
import { formatKm } from '@/lib/reminders';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Motorcycle3DViewer } from '@/components/garage/Motorcycle3DViewer';
import {
  Bell,
  ChevronRight,
  Gauge,
  Wrench,
  Bike as BikeIcon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Plus,
} from 'lucide-react';

interface DashboardRemindersWidgetProps {
  bike: Bike;
  reminders: ReminderItem[];
}

export function DashboardRemindersWidget({
  bike,
  reminders,
}: DashboardRemindersWidgetProps) {
  const topReminders = reminders.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* 1. Scadenze Imminenti Widget */}
      <Card className="bg-zinc-900/90 border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-md">
        <div className="flex items-center justify-between mb-3.5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Bell className="w-4 h-4 text-orange-400" />
            Controllo Scadenze
          </h3>
          <Link
            href="/promemoria"
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-0.5"
          >
            Tutte ({reminders.length}) <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {reminders.length === 0 ? (
          <div className="text-center py-6 px-3 bg-zinc-950/60 rounded-xl border border-zinc-800/80">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-zinc-300">Nessuna scadenza impostata</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Aggiungi il target km durante la registrazione di un intervento.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {topReminders.map((item) => {
              const isExpired = item.status === 'expired';
              const isWarning = item.status === 'warning';

              const interval = item.nextDueKm - item.lastDoneKm;
              const elapsed = item.currentKm - item.lastDoneKm;
              const progressPercent =
                interval > 0 ? Math.min(100, Math.max(0, (elapsed / interval) * 100)) : 100;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isExpired
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-zinc-950/70 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                      {item.category}
                    </span>
                    {isExpired ? (
                      <Badge className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 animate-pulse">
                        SCADUTO
                      </Badge>
                    ) : isWarning ? (
                      <Badge className="bg-amber-500 text-zinc-950 text-[9px] font-bold px-1.5 py-0.2">
                        IN SCADENZA
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.2 font-semibold">
                        OK
                      </Badge>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isExpired
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                      <span>Target: {formatKm(item.nextDueKm)}</span>
                      {isExpired ? (
                        <span className="text-rose-400 font-bold">
                          -{formatKm(Math.abs(item.kmRemaining))}
                        </span>
                      ) : (
                        <span className={isWarning ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                          Mancano {formatKm(item.kmRemaining)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            <Link
              href="/promemoria"
              className="w-full mt-2 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Wrench className="w-3.5 h-3.5 text-orange-400" />
              Gestisci tutte le scadenze
            </Link>
          </div>
        )}
      </Card>

      {/* 2. Scheda Garage Veicolo con Modello 3D */}
      <Card className="bg-zinc-900/90 border-zinc-800 p-4 sm:p-5 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <BikeIcon className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Reference 3D Veicolo</h4>
              <p className="text-[11px] text-zinc-400">{bike.name}</p>
            </div>
          </div>

          <Link
            href="/garage"
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
          >
            Garage <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3D Model Embedded Canvas */}
        <div className="rounded-xl overflow-hidden border border-zinc-800">
          <Motorcycle3DViewer
            key={bike.id + (bike.primary_color || '') + (bike.image_url || '')}
            bike={bike}
            height={200}
            showControls={false}
            autoRotateDefault={true}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase block font-medium">Modello</span>
            <span className="font-semibold text-zinc-200 truncate block mt-0.5">{bike.model}</span>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 uppercase block font-medium">Anno</span>
            <span className="font-semibold text-zinc-200 block mt-0.5">{bike.year || 'N/D'}</span>
          </div>

          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800 col-span-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-400 uppercase block font-medium">Contachilometri</span>
              <span className="font-mono font-bold text-zinc-100 text-sm">{formatKm(bike.current_km_hours)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href="/garage"
                className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-semibold transition-colors"
              >
                Garage 3D
              </Link>
              <Link
                href="/interventi/nuovo"
                className="px-2.5 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Intervento
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
