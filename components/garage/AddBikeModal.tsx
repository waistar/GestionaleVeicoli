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
import { Bike } from '@/lib/supabase/types';
import { extractDominantColor } from '@/lib/image-colors';
import { createBike } from '@/app/actions/bikes';
import { VehicleViewer } from './VehicleViewer';
import {
  Upload,
  Camera,
  CarFront,
  Sparkles,
  Loader2,
  Palette,
  AlertCircle,
  X,
} from 'lucide-react';

interface AddBikeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBikeCreated?: (bike: Bike) => void;
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

export function AddBikeModal({ open, onOpenChange, onBikeCreated }: AddBikeModalProps) {
  const [vehicleTypeValue, setVehicleType] = useState<VehicleType>('auto');
  const [plate, setPlate] = useState('');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [kmHours, setKmHours] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0284c7');
  const [accentColor, setAccentColor] = useState('#18181b');
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      const { primaryColor: detected, accentColor: detectedAccent, palette } =
        await extractDominantColor(file);
      setPrimaryColor(detected);
      setAccentColor(detectedAccent);
      setExtractedPalette(palette);
    } catch (err) {
      console.warn('Color extraction warning:', err);
    } finally {
      setIsExtractingColor(false);
    }
  };

  const handleRemovePhoto = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedPalette([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

      const res = await createBike(formData);

      if (!res.success || !res.bike) {
        setErrorMessage(res.error || 'Errore durante la registrazione del veicolo.');
        setIsSubmitting(false);
        return;
      }

      // Success
      if (onBikeCreated) onBikeCreated(res.bike);
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
    setPrimaryColor('#0284c7');
    setAccentColor('#18181b');
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
              Inserisci i dati del veicolo e una foto per aggiornare il parco veicoli.
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

          {/* SECTION 1: Photo Upload & Color Extraction */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-orange-700" />
                1. Foto Profilo Iniziale
              </span>
              <span className="text-[11px] text-zinc-500 normal-case">Foto del veicolo (facoltativa)</span>
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
                    <span className="text-xs font-bold text-zinc-800">Foto Caricata</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs text-rose-700 hover:text-rose-700 flex items-center gap-1 p-1"
                    >
                      <X className="w-3.5 h-3.5" /> Rimuovi
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-600">
                    Colore rilevato dalla carrozzeria:
                  </p>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md border border-zinc-200 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-xs font-mono font-semibold text-zinc-800">{primaryColor}</span>
                    <span className="text-[10px] text-emerald-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Auto-rilevato
                    </span>
                  </div>
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

          {/* SECTION 2: VEHICLE PREVIEW */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-700" />
                2. Anteprima del veicolo
              </span>
              <span className="text-[10px] text-orange-700 font-mono">Scheda veicolo</span>
            </Label>

            <VehicleViewer
              staticPreview
              bike={{
                name: name || 'Nuovo veicolo',
                vehicle_type: vehicleTypeValue,
                plate,
                primary_color: primaryColor,
                accent_color: accentColor,
                image_url: previewUrl,
              }}
              height={220}
              showControls={false}
              autoRotateDefault={true}
            />
          </div>

          {/* SECTION 3: BIKE SPECS */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <CarFront className="w-3.5 h-3.5 text-orange-700" />
              3. Dati Principali del Veicolo
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

          {/* SECTION 5: LIVERY COLOR PALETTE */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-orange-700" />
                4. Colore del veicolo
              </Label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-zinc-600">{primaryColor}</span>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer border border-zinc-200 bg-transparent"
                  title="Scegli colore personalizzato"
                />
              </div>
            </div>

            {/* Extracted or Preset swatches */}
            <div className="flex flex-wrap gap-2 items-center">
              {extractedPalette.length > 0 && (
                <div className="flex items-center gap-1.5 pr-2 border-r border-zinc-200">
                  {extractedPalette.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => setPrimaryColor(hex)}
                      className={`w-7 h-7 rounded-lg border transition-transform active:scale-95 ${
                        primaryColor === hex
                          ? 'ring-2 ring-orange-500 scale-110 border-white'
                          : 'border-zinc-200 hover:scale-105'
                      }`}
                      style={{ backgroundColor: hex }}
                      title={`Colore estratto: ${hex}`}
                    />
                  ))}
                </div>
              )}

              {PRESET_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setPrimaryColor(color.hex)}
                  className={`w-7 h-7 rounded-lg border transition-transform active:scale-95 ${
                    primaryColor === color.hex
                      ? 'ring-2 ring-orange-500 scale-110 border-white'
                      : 'border-zinc-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

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
                'Salva nel Garage'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
