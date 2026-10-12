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
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-rose-950/30 border border-rose-500/40 p-3 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-400 uppercase">Scaduti</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <span className="text-xl font-mono font-bold text-rose-300 mt-1">
            {expired.length}
          </span>
        </div>

        <div className="bg-amber-950/30 border border-amber-500/40 p-3 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-400 uppercase">In Limite</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xl font-mono font-bold text-amber-300 mt-1">
            {warning.length}
          </span>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/40 p-3 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-400 uppercase">Regolari</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-xl font-mono font-bold text-emerald-300 mt-1">
            {ok.length}
          </span>
        </div>
      </div>

      {/* 2. Elenco Promemoria */}
      {reminders.length === 0 ? (
        <Card className="bg-zinc-900/60 border-zinc-800 p-8 text-center rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">Nessuna scadenza pianificata</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
            Quando registri un intervento, inserisci il chilometraggio previsto per il prossimo controllo (es. cambio olio o gomme).
          </p>
          <Link
            href="/interventi/nuovo"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" /> Nuovo Intervento
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
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
                className={`p-4 rounded-2xl border transition-all shadow-md ${
                  isExpired
                    ? 'bg-rose-950/20 border-rose-500/50'
                    : isWarning
                    ? 'bg-amber-950/20 border-amber-500/50'
                    : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Header Card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-100">{item.category}</span>
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

                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Indicators */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Ultimo: {formatKm(item.lastDoneKm)}</span>
                    <span className="text-zinc-300 font-bold">Target: {formatKm(item.nextDueKm)}</span>
                  </div>

                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
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

                {/* Footer status distance & action */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <Gauge className="w-3.5 h-3.5 text-zinc-400" />
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
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                  >
                    <Wrench className="w-3 h-3" /> Fatto
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
