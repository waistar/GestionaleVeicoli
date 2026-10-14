'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { catalogFor, vehicleType } from '@/lib/vehicle-catalog';
import { Bike, MaintenanceCategory } from '@/lib/supabase/types';
import { createMaintenanceLog } from '@/app/actions/maintenance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Calendar,
  Gauge,
  Target,
  Camera,
  Upload,
  CheckCircle2,
  X,
  Loader2,
  Tag,
  FileText,
  AlertCircle,
  Euro,
} from 'lucide-react';

interface MaintenanceFormProps {
  bike: Bike;
  initialCategory?: string;
  initialExtraordinary?: boolean;
}

export function MaintenanceForm({ bike, initialCategory = 'Tagliando', initialExtraordinary = false }: MaintenanceFormProps) {
  const router = useRouter();

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [kmHours, setKmHours] = useState(bike.current_km_hours.toString());
  const [category, setCategory] = useState<MaintenanceCategory>(initialCategory);
  const [description, setDescription] = useState('');
  const [nextDueKm, setNextDueKm] = useState('');
  const [isExtraordinary, setIsExtraordinary] = useState(initialExtraordinary);
  const [cost, setCost] = useState('');

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
      formData.append('extraordinary', isExtraordinary ? 'true' : 'false');
      formData.append('cost', isExtraordinary ? cost.trim() : '');

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
    <form onSubmit={handleSubmit} className="space-y-6 pb-12">
      {errorMessage && (
        <div className="rounded-xl bg-rose-50/40 border border-rose-500/50 p-3.5 flex items-center gap-2.5 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Primary Inputs) */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Categoria (Touch Chips) */}
          <Card className="bg-zinc-50/90 border-zinc-200 p-4 sm:p-5 rounded-2xl">
            <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-orange-700" />
              Categoria Intervento *
            </label>
<select aria-label="Categoria intervento" value={category} onChange={e => setCategory(e.target.value)} className="w-full min-h-11 rounded-xl border border-zinc-200 bg-white px-3 text-base">{[...new Set([category, 'Meccanica', ...catalogFor(vehicleType(bike)).map(c => c.label)])].map(cat => <option key={cat}>{cat}</option>)}</select>
          </Card>

          {/* 2. Dati Base: Data e Chilometraggio */}
          <Card className="bg-zinc-50/90 border-zinc-200 p-4 sm:p-5 rounded-2xl space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Data */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-orange-700" />
                  Data *
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-white border-zinc-200 text-zinc-900 text-sm h-11"
                  required
                />
              </div>

              {/* Chilometraggio o Ore */}
              <div>
                <label className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-orange-700" />
                  Km / Ore *
                </label>
                <Input
                  type="number"
                  value={kmHours}
                  onChange={(e) => setKmHours(e.target.value)}
                  placeholder="es. 14500"
                  className="bg-white border-zinc-200 text-zinc-900 font-mono text-sm h-11"
                  required
                  min="0"
                  step="any"
                />
              </div>

            </div>
          </Card>

          <Card className="bg-zinc-50/90 border-zinc-200 p-4 sm:p-5 rounded-2xl space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isExtraordinary}
                onChange={event => { setIsExtraordinary(event.target.checked); if (!event.target.checked) setCost(''); }}
                className="mt-1 h-5 w-5 accent-orange-600"
              />
              <span>
                <span className="block text-sm font-semibold text-zinc-900">Intervento straordinario con spesa</span>
                <span className="block text-xs text-zinc-600 mt-1">Attivalo solo per riparazioni o lavori fuori dalle normali scadenze. La spesa comparirà automaticamente nei totali.</span>
              </span>
            </label>
            {isExtraordinary && <div>
              <label className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1">
                <Euro className="w-3.5 h-3.5 text-orange-700" />
                Costo straordinario (€) *
              </label>
              <Input
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="es. 125,50"
                inputMode="decimal"
                maxLength={10}
                required
                className="bg-white border-zinc-200 text-zinc-900 font-mono text-sm h-11"
              />
            </div>}
          </Card>

          {/* 3. Descrizione & Ricambi */}
          <Card className="bg-zinc-50/90 border-zinc-200 p-4 sm:p-5 rounded-2xl">
            <label className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-orange-700" />
              Descrizione Lavori & Ricambi Utilizzati *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Es: Cambio olio motore Motul 7100 10W50, sostituzione filtro olio originale, pulizia e ingrassaggio catena..."
              className="bg-white border-zinc-200 text-zinc-900 text-sm min-h-[100px] resize-none"
              required
            />
          </Card>

          {/* 4. Prossima Scadenza Prevista */}
          <Card className="bg-zinc-50/90 border-zinc-200 p-4 sm:p-5 rounded-2xl">
            <label className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-amber-700" />
              Prossimo Intervento Previsto (Km o Ore target)
            </label>
            <Input
              type="number"
              value={nextDueKm}
              onChange={(e) => setNextDueKm(e.target.value)}
              placeholder="es. 20000"
              className="bg-white border-zinc-200 text-zinc-900 font-mono text-sm h-11"
              min="0"
              step="any"
            />
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="text-[10px] sm:text-xs text-zinc-500 font-medium">Scelta rapida intervallo:</span>
              <button
                type="button"
                onClick={() => addTargetKm(1000)}
                className="text-[10px] sm:text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors"
              >
                +1.000 km
              </button>
              <button
                type="button"
                onClick={() => addTargetKm(5000)}
                className="text-[10px] sm:text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors"
              >
                +5.000 km
              </button>
              <button
                type="button"
                onClick={() => addTargetKm(10000)}
                className="text-[10px] sm:text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 transition-colors"
              >
                +10.000 km
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column (Photo upload & Live Preview Summary) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 5. Documentazione fotografica */}
          <Card className="bg-zinc-50/90 border-zinc-200 p-4 sm:p-5 rounded-2xl">
            <label className="text-xs font-semibold text-zinc-700 mb-1.5 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-orange-700" />
              Foto intervento / Ricambio / Contachilometri
            </label>

            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden border border-zinc-200 bg-white aspect-video max-h-56 mt-2 flex items-center justify-center shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Anteprima foto"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-zinc-50/80 text-rose-700 hover:bg-zinc-50 border border-zinc-200"
                  aria-label="Rimuovi foto"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="mt-2 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 hover:border-orange-500/70 rounded-xl p-5 cursor-pointer bg-white/60 transition-colors">
                <Upload className="w-7 h-7 text-orange-700 mb-1.5" />
                <span className="text-xs sm:text-sm font-semibold text-zinc-700">
                  Scatta o carica foto
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">
                  Foto di lavorazioni, ricambi o contachilometri
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

          {/* 6. Live Summary Card (Desktop Preview) */}
          <Card className="bg-zinc-50/90 border-zinc-200 p-4 sm:p-5 rounded-2xl shadow-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-orange-700" />
              Riepilogo Scheda
            </h4>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-200/80">
                <span className="text-zinc-600">Veicolo</span>
                <span className="font-semibold text-zinc-800">{bike.name}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-200/80">
                <span className="text-zinc-600">Categoria</span>
                <span className="font-semibold text-orange-700">{category}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-200/80">
                <span className="text-zinc-600">Data / Km</span>
                <span className="font-mono text-zinc-800">{date} • {kmHours || '0'} km</span>
              </div>
              {isExtraordinary && <div className="flex items-center justify-between py-1 border-b border-zinc-200/80">
                <span className="text-zinc-600">Spesa straordinaria</span>
                <span className="font-mono text-zinc-800">{cost.trim() ? `${cost} €` : 'Da indicare'}</span>
              </div>}
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-600">Prossima scadenza</span>
                <span className="font-mono text-amber-700">
                  {nextDueKm ? `${nextDueKm} km` : 'Non specificata'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 pt-3.5 border-t border-zinc-200 flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-zinc-200 text-zinc-700 hover:bg-zinc-100 flex-1 h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-semibold"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white flex-2 h-11 sm:h-12 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-orange-600/30 active:scale-98 transition-all"
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
          </Card>
        </div>
      </div>
    </form>
  );
}
