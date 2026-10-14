'use client'

import React, { useState, useRef } from 'react';
import Link from 'next/link';
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
import { VEHICLE_TYPES, vehicleType, type VehicleType } from '@/lib/vehicle-catalog';
import { Bike } from '@/lib/supabase/types';
import { extractDominantColor } from '@/lib/image-colors';
import { updateBike } from '@/app/actions/bikes';
import { VehicleViewer } from './VehicleViewer';
import {
  Upload,
  Camera,
  CarFront,
  Sparkles,
  Loader2,
  Palette,
  AlertCircle,
  CalendarClock,
} from 'lucide-react';

interface EditBikeModalProps {
  bike: Bike | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBikeUpdated?: (bike: Bike) => void;
}

const PRESET_COLORS = [
  { name: 'Blu', hex: '#0284c7' },
  { name: 'Rosso', hex: '#dc2626' },
  { name: 'Verde', hex: '#16a34a' },
  { name: 'Arancione', hex: '#ea580c' },
  { name: 'Blu intenso', hex: '#2563eb' },
  { name: 'Nero', hex: '#27272a' },
  { name: 'Grigio', hex: '#94a3b8' },
  { name: 'Giallo', hex: '#eab308' },
];

export function EditBikeModal({ bike, open, onOpenChange, onBikeUpdated }: EditBikeModalProps) {
  const [vehicleTypeValue, setVehicleType] = useState<VehicleType>(bike ? vehicleType(bike) : 'auto');
  const [plate, setPlate] = useState(bike?.plate || '');
  const [name, setName] = useState(bike?.name || '');
  const [model, setModel] = useState(bike?.model || '');
  const [year, setYear] = useState(bike?.year ? String(bike.year) : '');
  const [kmHours, setKmHours] = useState(String(bike?.current_km_hours || 0));
  const [primaryColor, setPrimaryColor] = useState(bike?.primary_color || '#0284c7');
  const [accentColor, setAccentColor] = useState(bike?.accent_color || '#18181b');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(bike?.image_url || null);
  const [isExtractingColor, setIsExtractingColor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleImageChange = async (file: File | null) => {
    if (!file) return;

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setIsExtractingColor(true);

    try {
      const { primaryColor: detected, accentColor: detectedAccent } =
        await extractDominantColor(file);
      setPrimaryColor(detected);
      setAccentColor(detectedAccent);
    } catch (err) {
      console.warn('Color extraction warning:', err);
    } finally {
      setIsExtractingColor(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bike) return;
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Inserisci il nome o la marca del veicolo.');
      return;
    }
    if (!model.trim()) {
      setErrorMessage('Inserisci il modello del veicolo.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('vehicle_type', vehicleTypeValue);
      formData.append('plate', plate.trim());
      formData.append('name', name.trim());
      formData.append('model', model.trim());
      if (year.trim()) formData.append('year', year.trim());
      formData.append('current_km_hours', kmHours.trim() || '0');
      formData.append('primary_color', primaryColor);
      formData.append('accent_color', accentColor);

      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await updateBike(bike.id, formData);

      if (!res.success || !res.bike) {
        setErrorMessage(res.error || 'Errore durante la modifica del veicolo.');
        setIsSubmitting(false);
        return;
      }

      if (onBikeUpdated) onBikeUpdated(res.bike);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full sm:max-w-xl md:max-w-2xl bg-white border-zinc-200 text-zinc-900 p-0 overflow-hidden rounded-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-200 bg-zinc-50/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-zinc-900">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-700">
                <CarFront className="w-4 h-4" />
              </div>
              Modifica veicolo {name}
            </DialogTitle>
            <DialogDescription className="text-zinc-600 text-xs mt-1">
              Aggiorna tipo, targa, foto, chilometraggio e dati del veicolo.
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

          {/* Photo & Color */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-orange-700" />
                Foto profilo veicolo
              </span>
            </Label>

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 p-2 flex items-center gap-4">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-zinc-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Anteprima foto veicolo"
                    className="w-full h-full object-cover"
                  />
                  {isExtractingColor && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-orange-700 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-800">Foto Attuale</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-orange-700 hover:text-orange-700 underline font-semibold"
                    >
                      Sostituisci
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-600">
                    Colore del veicolo:
                  </p>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md border border-zinc-200 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-xs font-mono font-semibold text-zinc-800">{primaryColor}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 hover:border-orange-500/50 hover:bg-zinc-50/60 transition-all rounded-2xl p-5 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-6 h-6 text-zinc-600" />
                <p className="text-xs font-bold text-zinc-800">Carica una foto per questo veicolo</p>
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

          {/* Vehicle photo preview */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-700" />
              Foto del veicolo
            </Label>
            <VehicleViewer
              bike={{
                name: name || 'Veicolo',
                vehicle_type: vehicleTypeValue,
                plate,
                primary_color: primaryColor,
                accent_color: accentColor,
                image_url: previewUrl,
              }}
              height={200}
            />
          </div>

          {/* Form Fields */}
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
                className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 text-sm focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1 block">Modello *</label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 text-sm focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1 block">Anno</label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 text-sm font-mono focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-700 mb-1 block">Chilometri (km)</label>
              <Input
                type="number"
                value={kmHours}
                onChange={(e) => setKmHours(e.target.value)}
                className="bg-zinc-50 border-zinc-200 text-zinc-900 h-11 text-sm font-mono focus:border-orange-500"
              />
            </div>
          </div>

          <section className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2"><CalendarClock className="w-4 h-4 text-orange-700" />Scadenze del veicolo</h3>
              <p className="text-xs text-zinc-600 mt-1">Gestisci bollo, assicurazione, revisione, parcheggio, tagliando e cambio gomme.</p>
            </div>
            <Link href={`/promemoria?vehicle=${bike?.id || ''}`} onClick={() => onOpenChange(false)} className="min-h-11 inline-flex items-center justify-center rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white">Apri scadenzario</Link>
          </section>

          {/* Color */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-orange-700" />
                Colore del veicolo
              </Label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-zinc-200 bg-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setPrimaryColor(color.hex)}
                  className={`w-7 h-7 rounded-lg border transition-transform ${
                    primaryColor === color.hex ? 'ring-2 ring-orange-500 scale-110 border-white' : 'border-zinc-200'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Footer Submit */}
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
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-6 h-11 shadow-md shadow-orange-600/25 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvataggio...
                </>
              ) : (
                'Salva Modifiche'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
