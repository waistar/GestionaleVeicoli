'use client'

import React, { useState } from 'react';
import { MaintenanceLog } from '@/lib/supabase/types';
import { formatCurrency, formatKm } from '@/lib/reminders';
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
  CircleDollarSign,
  Target,
  Trash2,
  ZoomIn,
  X,
  Loader2,
  Receipt,
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
        <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[calc(100%-1.5rem)] sm:w-full max-w-lg md:max-w-xl rounded-2xl max-h-[90vh] overflow-y-auto p-3.5 sm:p-6">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <Badge variant="outline" className="bg-orange-500/10 border-orange-500/30 text-orange-400 font-semibold px-2.5 py-1">
                {log.category}
              </Badge>
              <span className="text-xs sm:text-sm font-mono text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                {new Date(log.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-zinc-100 mt-2 text-left">
              Dettagli Intervento
            </DialogTitle>
          </DialogHeader>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2 xs:gap-2.5 sm:gap-3 my-2 sm:my-3">
            <div className="bg-zinc-950/70 p-2.5 xs:p-3 sm:p-3.5 rounded-xl border border-zinc-800 min-w-0">
              <span className="text-[10px] sm:text-xs text-zinc-400 uppercase font-medium flex items-center gap-1 truncate">
                <Gauge className="w-3.5 h-3.5 text-orange-400 shrink-0" /> Orometro / Km
              </span>
              <span className="text-xs xs:text-sm sm:text-lg font-mono font-bold text-zinc-200 mt-1 block truncate">
                {formatKm(log.km_hours)}
              </span>
            </div>

            <div className="bg-zinc-950/70 p-2.5 xs:p-3 sm:p-3.5 rounded-xl border border-zinc-800 min-w-0">
              <span className="text-[10px] sm:text-xs text-zinc-400 uppercase font-medium flex items-center gap-1 truncate">
                <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Spesa Sostenuta
              </span>
              <span className="text-xs xs:text-sm sm:text-lg font-mono font-bold text-emerald-400 mt-1 block truncate">
                {formatCurrency(log.cost)}
              </span>
            </div>
          </div>

          {/* Target Scadenza */}
          {log.next_due_km_hours && (
            <div className="bg-zinc-950/50 p-3 sm:p-3.5 rounded-xl border border-zinc-800/80 flex items-center justify-between">
              <span className="text-xs sm:text-sm text-zinc-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                Prossima Scadenza Prevista
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">
                {formatKm(log.next_due_km_hours)}
              </span>
            </div>
          )}

          {/* Descrizione e Ricambi */}
          <div className="mt-2.5">
            <h4 className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
              Descrizione & Ricambi
            </h4>
            <div className="bg-zinc-950/90 p-3.5 rounded-xl border border-zinc-800 text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">
              {log.description}
            </div>
          </div>

          {/* Foto allegata / Scontrino */}
          {log.image_url ? (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs sm:text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Receipt className="w-3.5 h-3.5 text-orange-400" />
                  Foto / Scontrino Allegato
                </h4>
                <span className="text-[10px] sm:text-xs text-zinc-500">Clicca per ingrandire</span>
              </div>
              <div
                onClick={() => setIsPhotoZoomed(true)}
                className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group cursor-pointer aspect-video max-h-48 sm:max-h-64 flex items-center justify-center shadow-inner"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={log.image_url}
                  alt="Ricevuta o pezzo moto"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1.5 text-xs font-semibold backdrop-blur-xs">
                  <ZoomIn className="w-4 h-4" /> Ingrandisci
                </div>
              </div>
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className={`text-xs ${
                confirmDelete
                  ? 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
                  : 'text-zinc-400 border-zinc-800 hover:text-rose-400 hover:border-zinc-700'
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
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-4"
            >
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox a schermo intero per foto ingrandita */}
      {isPhotoZoomed && log.image_url && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsPhotoZoomed(false)}
        >
          <div className="flex items-center justify-between text-zinc-200 pt-safe">
            <span className="text-xs font-mono font-medium">
              Foto Intervento: {log.category} ({formatKm(log.km_hours)})
            </span>
            <button
              onClick={() => setIsPhotoZoomed(false)}
              className="p-2 rounded-full bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700"
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
