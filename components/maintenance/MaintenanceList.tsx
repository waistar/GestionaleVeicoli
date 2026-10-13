'use client'

import React, { useState, useMemo } from 'react';
import { MaintenanceLog, MAINTENANCE_CATEGORIES } from '@/lib/supabase/types';
import { formatCurrency, formatKm } from '@/lib/reminders';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MaintenanceDetailDialog } from '@/components/maintenance/MaintenanceDetailDialog';
import {
  Search,
  Calendar,
  Image as ImageIcon,
  ChevronRight,
  X,
  Filter,
} from 'lucide-react';

interface MaintenanceListProps {
  logs: MaintenanceLog[];
}

export function MaintenanceList({ logs }: MaintenanceListProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tutti');
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchCategory =
        selectedCategory === 'Tutti' || log.category === selectedCategory;

      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.description.toLowerCase().includes(q) ||
        log.category.toLowerCase().includes(q) ||
        log.km_hours.toString().includes(q) ||
        (log.cost && log.cost.toString().includes(q));

      return matchCategory && matchSearch;
    });
  }, [logs, search, selectedCategory]);

  const totalFilteredCost = useMemo(() => {
    return filteredLogs.reduce((sum, l) => sum + (Number(l.cost) || 0), 0);
  }, [filteredLogs]);

  return (
    <div className="space-y-4 pb-16">
      {/* 1. Barra di ricerca */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <Input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca ricambi, olio, gomme, pastiglie o km..."
          className="bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 pl-10 pr-9 h-11 sm:h-12 rounded-xl text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Filtri Categoria Rapidi (Scroll su mobile, wrap su desktop) */}
      <div className="flex items-center gap-2 overflow-x-auto sm:flex-wrap pb-1 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('Tutti')}
          className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            selectedCategory === 'Tutti'
              ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
          }`}
        >
          Tutti ({logs.length})
        </button>

        {MAINTENANCE_CATEGORIES.map((cat) => {
          const count = logs.filter((l) => l.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {cat} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* 3. Riepilogo Filtro */}
      <div className="flex items-center justify-between px-1 text-xs sm:text-sm text-zinc-400">
        <span>
          Visualizzati: <strong className="text-zinc-200">{filteredLogs.length}</strong> interventi
        </span>
        <span>
          Totale parziale: <strong className="text-emerald-400 font-mono font-semibold">{formatCurrency(totalFilteredCost)}</strong>
        </span>
      </div>

      {/* 4. Lista Card in Responsive Grid (1 col mobile, 2 col desktop) */}
      {filteredLogs.length === 0 ? (
        <Card className="bg-zinc-900/50 border-zinc-800 p-8 text-center rounded-2xl mt-4">
          <Filter className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-300">Nessun intervento trovato</p>
          <p className="text-xs text-zinc-500 mt-1">
            Modifica i criteri di ricerca o azzera i filtri per vedere tutti gli interventi.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('Tutti');
            }}
            className="mt-3 text-xs text-orange-400 font-semibold hover:underline"
          >
            Azzera filtri
          </button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredLogs.map((log) => (
            <Card
              key={log.id}
              onClick={() => setSelectedLog(log)}
              className="bg-zinc-900/80 border-zinc-800 p-4 rounded-2xl hover:border-zinc-700 hover:bg-zinc-850/60 transition-all cursor-pointer active:scale-98 shadow-sm flex items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {log.image_url ? (
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={log.image_url}
                      alt={log.category}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : null}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className="bg-zinc-800/80 border-zinc-700 text-orange-400 text-[10px] font-semibold px-2 py-0.5"
                    >
                      {log.category}
                    </Badge>
                    <span className="text-[11px] sm:text-xs font-mono text-zinc-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      {new Date(log.date).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-zinc-200 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                    {log.description}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-[11px] sm:text-xs text-zinc-400 font-mono">
                    <span>{formatKm(log.km_hours)}</span>
                    <span>•</span>
                    <span className="font-semibold text-emerald-400">
                      {formatCurrency(log.cost)}
                    </span>
                    {log.image_url && (
                      <span className="text-orange-400 flex items-center gap-0.5 text-[10px]">
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
      )}

      {/* Dialog Dettaglio */}
      {selectedLog && (
        <MaintenanceDetailDialog
          log={selectedLog}
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
