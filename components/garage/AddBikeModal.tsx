'use client'

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VEHICLE_TYPES, type VehicleType } from '@/lib/vehicle-catalog';
import { INITIAL_DEADLINE_FIELDS } from '@/lib/initial-deadlines';
import { Bike } from '@/lib/supabase/types';
import { createBike } from '@/app/actions/bikes';
import {
  Upload,
  Camera,
  CarFront,
  Loader2,
  AlertCircle,
  CalendarClock,
  X,
} from 'lucide-react';

interface AddBikeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBikeCreated?: (bike: Bike) => void;
}

export function AddBikeModal({ open, onOpenChange, onBikeCreated }: AddBikeModalProps) {
  const [vehicleTypeValue, setVehicleType] = useState<VehicleType>('auto');
  const [plate, setPlate] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [kmHours, setKmHours] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (file: File | null) => {
    if (!file) return;

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemovePhoto = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Inserisci la marca o il nome del veicolo (es. Fiat, Ford).');
      return;
    }
    if (!model.trim()) {
      setErrorMessage('Inserisci il modello del veicolo (es. Panda, Transit).');
      return;
    }

    setIsSubmitting(true);

    try {
      const formElement = e.currentTarget;
      const formData = new FormData(formElement);
      formData.set('vehicle_type', vehicleTypeValue);
      formData.set('plate', plate.trim());
      formData.set('name', name.trim());
      formData.set('model', model.trim());
      if (year.trim()) formData.append('year', year.trim());
      formData.set('current_km_hours', kmHours.trim() || '0');
      formData.set('primary_color', '#ea580c');
      formData.set('accent_color', '#18181b');

      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await createBike(formData);

      if (!res.success || !res.bike) {
        setErrorMessage(res.error || 'Errore durante la registrazione del veicolo.');
        setIsSubmitting(false);
        return;
      }

      // Success
      if (onBikeCreated) onBikeCreated(res.bike);
      formElement.reset();
      onOpenChange(false);
      resetForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setVehicleType('auto');
    setPlate('');
    setName('');
    setModel('');
    setYear('');
    setKmHours('');
    handleRemovePhoto();
    setErrorMessage(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-xl md:max-w-2xl bg-white border-zinc-200 text-zinc-900 p-0 overflow-hidden rounded-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-zinc-900">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <CarFront className="w-4 h-4" />
              </div>
              Aggiungi un veicolo
            </DialogTitle>
            <DialogDescription className="text-zinc-600 text-xs mt-1">
              Registra il veicolo e configura subito le sue scadenze principali.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-500/40 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-700" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Foto facoltativa */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-orange-700" />
                Foto del veicolo
              </span>
              <span className="text-[11px] text-zinc-500 normal-case">Foto del veicolo (facoltativa)</span>
            </Label>

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 p-2 flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Anteprima foto veicolo"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800">Foto caricata</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs text-rose-700 hover:text-rose-700 flex items-center gap-1 p-1"
                    >
                      <X className="w-3.5 h-3.5" /> Rimuovi
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-600 mt-1">Verrà usata nella scheda del veicolo.</p>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 hover:border-orange-500/50 hover:bg-zinc-50/60 transition-all rounded-2xl p-5 text-center cursor-pointer flex flex-col items-center justify-center gap-2 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-zinc-50 group-hover:bg-orange-500/10 flex items-center justify-center text-zinc-600 group-hover:text-orange-700 transition-colors">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-800 group-hover:text-orange-700 transition-colors">
                    Tocca per scattare o caricare una foto
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    JPG, PNG o WebP da smartphone o fotocamera
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleImageChange(e.target.files[0]);
                }
              }}
            />
          </div>

          {/* Dati del veicolo */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <CarFront className="w-3.5 h-3.5 text-orange-700" />
              Dati del veicolo
            </Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-sm text-zinc-700">Tipo di veicolo
                <select aria-label="Tipo di veicolo" value={vehicleTypeValue} onChange={e => setVehicleType(e.target.value as VehicleType)} className="w-full min-h-11 rounded-xl border border-zinc-200 bg-white px-3 text-base">
                  {VEHICLE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label className="text-sm text-zinc-700">Targa / identificativo
                <Input value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} maxLength={20} placeholder="Es. AB123CD" className="min-h-11 bg-white text-base" />
              </label>

              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1 block">Marca / Nome *</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="es. Fiat, Ford, Yamaha"
                  className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 text-sm focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1 block">Modello *</label>
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="es. Panda, Transit, SH 125"
                  className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 text-sm focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1 block">Anno di Immatricolazione</label>
                <Input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="es. 2023"
                  className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 text-sm font-mono focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 mb-1 block">Chilometraggio Attuale (km)</label>
                <Input
                  type="number"
                  value={kmHours}
                  onChange={(e) => setKmHours(e.target.value)}
                  placeholder="es. 12500"
                  className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 text-sm font-mono focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Scadenze iniziali */}
          <section className="space-y-4 rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4 text-orange-700" />
                Scadenze iniziali
              </Label>
              <p className="mt-1 text-xs text-zinc-600">Inserisci le date effettive riportate sui documenti. I campi non ancora noti possono restare vuoti.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INITIAL_DEADLINE_FIELDS.filter(field => 'primary' in field && field.primary).map(field => (
                <div key={field.key} className="rounded-xl border border-zinc-200 bg-white p-3">
                  <label className="text-xs font-semibold text-zinc-800" htmlFor={`${field.key}-date`}>{field.label}</label>
                  <p className="text-[11px] text-zinc-500 mb-2">{field.hint}</p>
                  <div className={'grid gap-2 ' + ('supportsKm' in field && field.supportsKm ? 'grid-cols-2' : 'grid-cols-1')}>
                    <Input id={`${field.key}-date`} name={`${field.key}_due_date`} type="date" className="min-h-11 bg-white text-base" />
                    {'supportsKm' in field && field.supportsKm && <Input name={`${field.key}_due_km`} type="number" min="0" step="1" inputMode="numeric" placeholder="Km previsti" aria-label={`Chilometraggio ${field.label}`} className="min-h-11 bg-white text-base" />}
                  </div>
                  <Input name={`${field.key}_amount`} inputMode="decimal" placeholder="Importo € (facoltativo)" aria-label={`Importo ${field.label}`} className="min-h-11 mt-2 bg-white text-base" />
                </div>
              ))}
            </div>

            <details className="rounded-xl border border-zinc-200 bg-white p-3">
              <summary className="min-h-11 flex items-center cursor-pointer text-sm font-semibold text-orange-800">Altre scadenze</summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                {INITIAL_DEADLINE_FIELDS.filter(field => !('primary' in field && field.primary)).map(field => (
                  <div key={field.key} className="text-xs font-semibold text-zinc-800">{field.label}
                    <span className="block text-[11px] font-normal text-zinc-500 mb-1">{field.hint}</span>
                    <Input name={`${field.key}_due_date`} type="date" className="min-h-11 bg-white text-base" />
                    <Input name={`${field.key}_amount`} inputMode="decimal" placeholder="Importo € (facoltativo)" aria-label={`Importo ${field.label}`} className="min-h-11 mt-2 bg-white text-base" />
                  </div>
                ))}
              </div>
            </details>

            <label className="block text-xs font-semibold text-zinc-800">Avvisami in anticipo
              <span className="block text-[11px] font-normal text-zinc-500 mb-1">Giorni prima della scadenza</span>
              <Input name="deadline_warning_days" type="number" min="0" max="365" step="1" defaultValue="30" className="min-h-11 max-w-40 bg-white text-base" />
            </label>
          </section>

          {/* Footer Submit Buttons */}
          <div className="pt-3 border-t border-zinc-200 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-zinc-200 text-zinc-700 hover:bg-zinc-100 px-4 h-11"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold px-6 h-11 shadow-lg shadow-orange-600/25 active:scale-95 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvataggio...
                </>
              ) : (
                'Salva veicolo e scadenze'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
