'use client'

import React, { useState } from 'react';
import { MaintenanceLog } from '@/lib/supabase/types';
import { formatKm } from '@/lib/reminders';
import { formatCurrency } from '@/lib/expenses';
import { maintenanceCostCents } from '@/lib/annual-costs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deleteMaintenanceLog } from '@/app/actions/maintenance';
import {
  Calendar,
  Gauge,
  Target,
  Trash2,
  ZoomIn,
  X,
  Loader2,
  Camera,
  Euro,
} from 'lucide-react';

interface MaintenanceDetailDialogProps {
  log: MaintenanceLog | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MaintenanceDetailDialog({
  log,
  isOpen,
  onClose,
}: MaintenanceDetailDialogProps) {
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!log) return null;
  const costCents = maintenanceCostCents(log.cost);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setIsDeleting(true);
    await deleteMaintenanceLog(log.id);
    setIsDeleting(false);
    setConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !isPhotoZoomed} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="bg-zinc-50 border-zinc-200 text-zinc-900 max-w-sm sm:max-w-lg md:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-700 font-semibold px-2.5 py-1">
                {log.category}
              </Badge>
              <span className="text-xs sm:text-sm font-mono text-zinc-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                {new Date(log.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-zinc-900 mt-2 text-left">
              Dettagli Intervento
            </DialogTitle>
          </DialogHeader>

          {/* Quick Stats Grid */}
          <div className={`grid grid-cols-1 ${costCents > 0 ? 'sm:grid-cols-2' : ''} gap-2.5 sm:gap-3 my-2 sm:my-3`}>
            <div className="bg-white/70 p-3 sm:p-3.5 rounded-xl border border-zinc-200">
              <span className="text-[10px] sm:text-xs text-zinc-600 uppercase font-medium flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-orange-700" /> Orometro / Km
              </span>
              <span className="text-sm sm:text-lg font-mono font-bold text-zinc-800 mt-1 block">
                {formatKm(log.km_hours)}
              </span>
            </div>
            {costCents > 0 && <div className="bg-white/70 p-3 sm:p-3.5 rounded-xl border border-zinc-200">
              <span className="text-[10px] sm:text-xs text-zinc-600 uppercase font-medium flex items-center gap-1">
                <Euro className="w-3.5 h-3.5 text-orange-700" /> Costo intervento
              </span>
              <span className="text-sm sm:text-lg font-mono font-bold text-zinc-800 mt-1 block">{formatCurrency(costCents)}</span>
            </div>}
          </div>

          {/* Target Scadenza */}
          {log.next_due_km_hours && (
            <div className="bg-white/50 p-3 sm:p-3.5 rounded-xl border border-zinc-200/80 flex items-center justify-between">
              <span className="text-xs sm:text-sm text-zinc-600 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-700" />
                Prossima Scadenza Prevista
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-700">
                {formatKm(log.next_due_km_hours)}
              </span>
            </div>
          )}

          {/* Descrizione e Ricambi */}
          <div className="mt-2.5">
            <h4 className="text-xs sm:text-sm font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
              Descrizione & Ricambi
            </h4>
            <div className="bg-white/90 p-3.5 rounded-xl border border-zinc-200 text-xs sm:text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap font-sans">
              {log.description}
            </div>
          </div>

          {/* Documentazione fotografica */}
          {log.image_url ? (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-600 uppercase tracking-wider flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-orange-700" />
                  Foto Intervento
                </h4>
                <span className="text-[10px] sm:text-xs text-zinc-500">Clicca per ingrandire</span>
              </div>
              <div
                onClick={() => setIsPhotoZoomed(true)}
                className="relative rounded-xl overflow-hidden border border-zinc-200 bg-white group cursor-pointer aspect-video max-h-48 sm:max-h-64 flex items-center justify-center shadow-inner"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={log.image_url}
                  alt="Documentazione fotografica dell’intervento"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-zinc-900 gap-1.5 text-xs font-semibold backdrop-blur-xs">
                  <ZoomIn className="w-4 h-4" /> Ingrandisci
                </div>
              </div>
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className={`text-xs ${
                confirmDelete
                  ? 'bg-rose-50 text-rose-700 border-rose-800 hover:bg-rose-50'
                  : 'text-zinc-600 border-zinc-200 hover:text-rose-700 hover:border-zinc-200'
              }`}
            >
              {isDeleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : (
                <Trash2 className="w-3.5 h-3.5 mr-1" />
              )}
              {confirmDelete ? 'Conferma Eliminazione?' : 'Elimina'}
            </Button>

            <Button
              onClick={onClose}
              className="bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs px-4"
            >
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox a schermo intero per foto ingrandita */}
      {isPhotoZoomed && log.image_url && (
        <div
          className="fixed inset-0 z-50 bg-white/95 flex flex-col justify-between p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsPhotoZoomed(false)}
        >
          <div className="flex items-center justify-between text-zinc-800 pt-safe">
            <span className="text-xs font-mono font-medium">
              Foto Intervento: {log.category} ({formatKm(log.km_hours)})
            </span>
            <button
              onClick={() => setIsPhotoZoomed(false)}
              className="p-2 rounded-full bg-zinc-100/80 text-zinc-800 hover:bg-zinc-200"
              aria-label="Chiudi ingrandimento"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center my-4 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={log.image_url}
              alt="Foto allegata ingrandita"
              className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <p className="text-center text-xs text-zinc-500 pb-safe">
            Tocca ovunque sullo sfondo per uscire
          </p>
        </div>
      )}
    </>
  );
}
