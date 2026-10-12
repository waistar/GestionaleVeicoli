'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bike, MAINTENANCE_CATEGORIES, MaintenanceCategory } from '@/lib/supabase/types';
import { createMaintenanceLog } from '@/app/actions/maintenance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  Gauge,
  CircleDollarSign,
  Target,
  Camera,
  Upload,
  CheckCircle2,
  X,
  Loader2,
  Tag,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface MaintenanceFormProps {
  bike: Bike;
}

export function MaintenanceForm({ bike }: MaintenanceFormProps) {
  const router = useRouter();

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [kmHours, setKmHours] = useState(bike.current_km_hours.toString());
  const [category, setCategory] = useState<MaintenanceCategory>('Tagliando');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');
  const [nextDueKm, setNextDueKm] = useState('');

  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const addTargetKm = (delta: number) => {
    const currentBase = parseFloat(kmHours) || Number(bike.current_km_hours) || 0;
    setNextDueKm((currentBase + delta).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedKm = parseFloat(kmHours);
    if (isNaN(parsedKm) || parsedKm < 0) {
      setErrorMessage('Inserisci un chilometraggio o ore validi.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Inserisci una breve descrizione dei lavori e dei ricambi utilizzati.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('bike_id', bike.id);
      formData.append('date', date);
      formData.append('km_hours', kmHours);
      formData.append('category', category);
      formData.append('description', description.trim());
      formData.append('cost', cost ? parseFloat(cost).toString() : '0');

      if (nextDueKm && nextDueKm.trim() !== '') {
        formData.append('next_due_km_hours', nextDueKm.trim());
      }

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await createMaintenanceLog(formData);

      if (!res.success) {
        setErrorMessage(res.error || 'Errore durante il salvataggio.');
        setIsSubmitting(false);
        return;
      }

      // Success: redirect to list of interventions
      router.push('/interventi');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(`Errore imprevisto: ${msg}`);
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-12">
      {errorMessage && (
        <div className="rounded-xl bg-rose-950/40 border border-rose-500/50 p-3.5 flex items-center gap-2.5 text-rose-200 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Categoria (Touch Chips) */}
      <Card className="bg-zinc-900/90 border-zinc-800 p-4 rounded-2xl">
        <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-orange-400" />
          Categoria Intervento *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MAINTENANCE_CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                type="button"
                key={cat}
                onClick={() => setCategory(cat)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold text-center border transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-orange-600 border-orange-500 text-white shadow-md shadow-orange-600/30'
                    : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 2. Dati Base: Data & Chilometraggio */}
      <Card className="bg-zinc-900/90 border-zinc-800 p-4 rounded-2xl space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          {/* Data */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-400" />
              Data *
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-zinc-100 text-sm h-11"
              required
            />
          </div>

          {/* Chilometraggio o Ore */}
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-orange-400" />
              Km / Ore *
            </label>
            <Input
              type="number"
              value={kmHours}
              onChange={(e) => setKmHours(e.target.value)}
              placeholder="es. 14500"
              className="bg-zinc-950 border-zinc-700 text-zinc-100 font-mono text-sm h-11"
              required
              min="0"
              step="any"
            />
          </div>
        </div>

        {/* Costo */}
        <div>
          <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
            <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Costo Sostenuto (€)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-sm">
              €
            </span>
            <Input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              className="bg-zinc-950 border-zinc-700 text-zinc-100 font-mono text-sm h-11 pl-8"
              step="0.01"
              min="0"
            />
          </div>
        </div>
      </Card>

      {/* 3. Descrizione & Ricambi */}
      <Card className="bg-zinc-900/90 border-zinc-800 p-4 rounded-2xl">
        <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-orange-400" />
          Descrizione Lavori & Ricambi Utilizzati *
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Es: Cambio olio con Bardahl XTC C60 10W40, sostituzione filtro HiFlo HF204, controllo pressione gomme e ingrassaggio catena..."
          className="bg-zinc-950 border-zinc-700 text-zinc-100 text-sm min-h-[90px] resize-none"
          required
        />
      </Card>

      {/* 4. Prossima Scadenza Prevista */}
      <Card className="bg-zinc-900/90 border-zinc-800 p-4 rounded-2xl">
        <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
          <Target className="w-3.5 h-3.5 text-amber-400" />
          Prossimo Intervento Previsto (Km o Ore target)
        </label>
        <Input
          type="number"
          value={nextDueKm}
          onChange={(e) => setNextDueKm(e.target.value)}
          placeholder="es. 20000"
          className="bg-zinc-950 border-zinc-700 text-zinc-100 font-mono text-sm h-11"
          min="0"
          step="any"
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-zinc-500 font-medium">Scelta rapida:</span>
          <button
            type="button"
            onClick={() => addTargetKm(1000)}
            className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
          >
            +1.000 km
          </button>
          <button
            type="button"
            onClick={() => addTargetKm(5000)}
            className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
          >
            +5.000 km
          </button>
          <button
            type="button"
            onClick={() => addTargetKm(10000)}
            className="text-[10px] font-mono font-semibold px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
          >
            +10.000 km
          </button>
        </div>
      </Card>

      {/* 5. Upload Foto / Scontrino */}
      <Card className="bg-zinc-900/90 border-zinc-800 p-4 rounded-2xl">
        <label className="text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-orange-400" />
          Foto Ricevuta / Pezzo Sostituito / Contachilometri
        </label>

        {imagePreview ? (
          <div className="relative rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 aspect-video max-h-48 mt-2 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt="Anteprima foto"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-900/80 text-rose-400 hover:bg-zinc-900 border border-zinc-700"
              aria-label="Rimuovi foto"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-orange-500/70 rounded-xl p-4 cursor-pointer bg-zinc-950/60 transition-colors">
            <Upload className="w-6 h-6 text-orange-400 mb-1" />
            <span className="text-xs font-semibold text-zinc-300">
              Scatta o carica foto
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5">
              JPG, PNG o WEBP (salvato su bucket Supabase)
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        )}
      </Card>

      {/* Pulsanti Azione */}
      <div className="pt-2 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex-1 h-12 rounded-xl text-sm font-semibold"
        >
          Annulla
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white flex-2 h-12 rounded-xl text-sm font-bold shadow-lg shadow-orange-600/30 active:scale-98 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvataggio...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Salva Intervento
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
