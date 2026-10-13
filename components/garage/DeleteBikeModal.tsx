'use client'

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bike } from '@/lib/supabase/types';
import { deleteBike } from '@/app/actions/bikes';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteBikeModalProps {
  bike: Bike | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBikeDeleted?: (bikeId: string) => void;
}

export function DeleteBikeModal({
  bike,
  open,
  onOpenChange,
  onBikeDeleted,
}: DeleteBikeModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!bike) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const res = await deleteBike(bike.id);

    if (!res.success) {
      setError(res.error || 'Errore durante l\'eliminazione della moto.');
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    onOpenChange(false);
    if (onBikeDeleted) onBikeDeleted(bike.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 p-5 rounded-2xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-2 mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>
          <DialogTitle className="text-center text-lg font-bold text-zinc-100">
            Rimuovere {bike.name}?
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400 text-xs mt-1">
            Sei sicuro di voler eliminare questa moto dal garage? Verranno rimossi anche tutti gli interventi e le ricevute associate a questo veicolo.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="flex-1 border-zinc-800 text-zinc-300 hover:bg-zinc-850 h-11"
          >
            Annulla
          </Button>
          <Button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold h-11 shadow-md shadow-rose-600/20"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Elimina Definitivamente'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
