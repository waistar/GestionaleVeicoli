'use client'

import React, { useState } from 'react';
import Link from 'next/link';
import { MaintenanceLog } from '@/lib/supabase/types';
import { formatCurrency, formatKm } from '@/lib/reminders';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Calendar, ChevronRight, Image as ImageIcon, Plus } from 'lucide-react';
import { MaintenanceDetailDialog } from '@/components/maintenance/MaintenanceDetailDialog';

interface RecentInterventionsProps {
  logs: MaintenanceLog[];
}

export function RecentInterventions({ logs }: RecentInterventionsProps) {
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);

  if (logs.length === 0) {
    return (
      <Card className="bg-zinc-900/60 border-zinc-800 p-6 text-center rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-3">
          <Wrench className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-zinc-200">Nessun intervento registrato</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
          Inizia a tenere traccia della manutenzione della tua moto per monitorare costi e scadenze.
        </p>
        <Link
          href="/interventi/nuovo"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" /> Registra Primo Intervento
        </Link>
      </Card>
    );
  }

  const recent = logs.slice(0, 4);

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-orange-400" />
            Ultimi Interventi
          </h2>
          <Link
            href="/interventi"
            className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-0.5"
          >
            Tutti ({logs.length}) <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5 sm:space-y-3">
          {recent.map((log) => (
            <Card
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="bg-zinc-900/80 border-zinc-800 p-3 xs:p-3.5 sm:p-4 rounded-2xl hover:border-zinc-700 hover:bg-zinc-850/60 transition-all cursor-pointer active:scale-98 shadow-sm flex items-center justify-between gap-2.5 sm:gap-3 group"
            >
              <div className="flex items-center gap-2.5 xs:gap-3.5 flex-1 min-w-0">
                {log.image_url ? (
                  <div className="hidden sm:block w-13 h-13 rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={log.image_url}
                      alt={log.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : null}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-orange-400 text-[10px] font-semibold px-2 py-0.5">
                      {log.category}
                    </Badge>
                    <span className="text-[11px] sm:text-xs font-mono text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {new Date(log.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">
                    {log.description}
                  </p>

                  <div className="flex items-center gap-2 xs:gap-3 mt-1.5 text-[11px] sm:text-xs text-zinc-400 font-mono flex-wrap">
                    <span>{formatKm(log.km_hours)}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-400">{formatCurrency(log.cost)}</span>
                    {log.image_url && (
                      <span className="sm:hidden text-orange-400 flex items-center gap-0.5">
                        • <ImageIcon className="w-3 h-3" /> Foto
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Card>
          ))}
        </div>
      </div>

      {/* Modal Dettaglio Intervento */}
      {selectedLog && (
        <MaintenanceDetailDialog
          log={selectedLog}
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </>
  );
}
