'use client'

import React from 'react';
import Link from 'next/link';
import { ReminderItem } from '@/lib/supabase/types';
import { formatKm } from '@/lib/reminders';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Plus,
  Wrench,
  Clock,
} from 'lucide-react';

interface RemindersListProps {
  reminders: ReminderItem[];
}

export function RemindersList({ reminders }: RemindersListProps) {
  const expired = reminders.filter((r) => r.status === 'expired');
  const warning = reminders.filter((r) => r.status === 'warning');
  const ok = reminders.filter((r) => r.status === 'ok');

  return (
    <div className="space-y-4 pb-16">
      {/* 1. Status Counter Cards */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-5">
        <div className="bg-rose-950/30 border border-rose-500/40 p-3 sm:p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-rose-400 uppercase tracking-wider">Scaduti</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2">
            <span className="text-xl sm:text-3xl font-mono font-bold text-rose-300 block">
              {expired.length}
            </span>
            <span className="hidden sm:block text-[11px] text-rose-400/80 mt-0.5">
              Oltre il chilometraggio
            </span>
          </div>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/40 p-3 sm:p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-amber-400 uppercase tracking-wider">In Scadenza</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2">
            <span className="text-xl sm:text-3xl font-mono font-bold text-amber-300 block">
              {warning.length}
            </span>
            <span className="hidden sm:block text-[11px] text-amber-400/80 mt-0.5">
              Entro 500 km
            </span>
          </div>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 sm:p-5 rounded-2xl flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider">Regolari</span>
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="mt-1 sm:mt-2">
            <span className="text-xl sm:text-3xl font-mono font-bold text-emerald-300 block">
              {ok.length}
            </span>
            <span className="hidden sm:block text-[11px] text-emerald-400/80 mt-0.5">
              Intervalli regolari
            </span>
          </div>
        </div>
      </div>

      {/* 2. Elenco Promemoria in Responsive Grid (1 col mobile, 2 col desktop) */}
      {reminders.length === 0 ? (
        <Card className="bg-zinc-900/60 border-zinc-800 p-8 text-center rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-zinc-200">Nessuna scadenza pianificata</h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
            Quando registri un intervento, inserisci il chilometraggio previsto per il prossimo controllo (es. cambio olio o gomme).
          </p>
          <Link
            href="/interventi/nuovo"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" /> Nuovo Intervento
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {reminders.map((item) => {
            const isExpired = item.status === 'expired';
            const isWarning = item.status === 'warning';

            // Progress bar calculation
            const interval = item.nextDueKm - item.lastDoneKm;
            const elapsed = item.currentKm - item.lastDoneKm;
            const progressPercent = interval > 0 ? Math.min(100, Math.max(0, (elapsed / interval) * 100)) : 100;

            return (
              <Card
                key={item.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-md flex flex-col justify-between ${
                  isExpired
                    ? 'bg-rose-950/20 border-rose-500/50'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/50'
                    : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850/60'
                }`}
              >
                <div>
                  {/* Header Card */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm sm:text-base text-zinc-100">{item.category}</span>
                        {isExpired && (
                          <Badge className="bg-rose-500 text-white font-bold text-[10px] px-2 py-0.5 animate-pulse">
                            SCADUTO
                          </Badge>
                        )}
                        {isWarning && (
                          <Badge className="bg-amber-500 text-zinc-950 font-bold text-[10px] px-2 py-0.5">
                            IN SCADENZA
                          </Badge>
                        )}
                        {!isExpired && !isWarning && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-2 py-0.5 font-semibold">
                            REGOLARE
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar & Indicators */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono">
                      <span className="text-zinc-500">Ultimo fatto: {formatKm(item.lastDoneKm)}</span>
                      <span className="text-zinc-200 font-bold">Target: {formatKm(item.nextDueKm)}</span>
                    </div>

                    <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
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
                  </div>
                </div>

                {/* Footer status distance & action */}
                <div className="mt-4 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm">
                    <Gauge className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                    {isExpired ? (
                      <span className="text-rose-400 font-bold">
                        Superato da {formatKm(Math.abs(item.kmRemaining))}
                      </span>
                    ) : (
                      <span className={isWarning ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                        Mancano {formatKm(item.kmRemaining)}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/interventi/nuovo`}
                    className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1 shadow-sm active:scale-95 transition-all shrink-0"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Registra Fatto
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
