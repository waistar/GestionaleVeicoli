'use client'

import React from 'react';
import Link from 'next/link';
import { ReminderItem } from '@/lib/supabase/types';
import { formatKm } from '@/lib/reminders';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, Wrench } from 'lucide-react';

interface AlertBannerProps {
  reminders: ReminderItem[];
}

export function AlertBanner({ reminders }: AlertBannerProps) {
  const expired = reminders.filter((r) => r.status === 'expired');
  const warning = reminders.filter((r) => r.status === 'warning');

  if (expired.length === 0 && warning.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-400">Tutti i controlli in regola</p>
            <p className="text-[11px] text-zinc-400">Nessuna manutenzione scaduta o imminente.</p>
          </div>
        </div>
        <Link
          href="/promemoria"
          className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5 hover:underline"
        >
          Dettagli <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  const isUrgent = expired.length > 0;
  const mainAlerts = isUrgent ? expired : warning;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-lg transition-all ${
        isUrgent
          ? 'border-rose-500/50 bg-rose-950/30 text-rose-200'
          : 'border-amber-500/50 bg-amber-950/30 text-amber-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          {isUrgent ? (
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 animate-pulse">
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
          )}
          <span className="text-xs font-bold uppercase tracking-wider">
            {isUrgent ? `${expired.length} Interventi Scaduti!` : `${warning.length} Manutenzioni in Scadenza`}
          </span>
        </div>
        <Link
          href="/promemoria"
          className="text-xs font-bold flex items-center gap-0.5 hover:underline"
        >
          Vedi Tutti <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
        {mainAlerts.slice(0, 4).map((item) => {
          const isOverdue = item.kmRemaining <= 0;
          return (
            <div
              key={item.id}
              className="flex flex-col xs:flex-row xs:items-center justify-between bg-zinc-950/70 rounded-xl p-2.5 sm:p-3 border border-zinc-800/80 gap-1.5 xs:gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-zinc-100 truncate">{item.category}</span>
                <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                  ({formatKm(item.nextDueKm)})
                </span>
              </div>
              <div className="shrink-0">
                {isOverdue ? (
                  <span className="text-xs font-bold font-mono text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                    Scaduto da {formatKm(Math.abs(item.kmRemaining))}
                  </span>
                ) : (
                  <span className="text-xs font-bold font-mono text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    Entro {formatKm(item.kmRemaining)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between">
        <span className="text-[11px] text-zinc-400">
          Hai già eseguito il lavoro in garage?
        </span>
        <Link
          href="/interventi/nuovo"
          className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
        >
          <Wrench className="w-3 h-3" /> Registralo Subito
        </Link>
      </div>
    </div>
  );
}
