'use client'

import React, { useState, useRef, useEffect } from 'react';
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
import { Bike, BikeCategory, BIKE_CATEGORIES } from '@/lib/supabase/types';
import { extractDominantColor } from '@/lib/image-colors';
import { updateBike } from '@/app/actions/bikes';
import { Motorcycle3DViewer } from './Motorcycle3DViewer';
import {
  Upload,
  Camera,
  Bike as BikeIcon,
  Sparkles,
  Loader2,
  Check,
  Palette,
  AlertCircle,
  X,
} from 'lucide-react';

interface EditBikeModalProps {
  bike: Bike | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBikeUpdated?: (bike: Bike) => void;
}

const PRESET_COLORS = [
  { name: 'Yamaha Blue', hex: '#0284c7' },
  { name: 'Ducati Red', hex: '#dc2626' },
  { name: 'Kawasaki Lime', hex: '#16a34a' },
  { name: 'KTM Orange', hex: '#ea580c' },
  { name: 'BMW Motorsport', hex: '#2563eb' },
  { name: 'Stealth Black', hex: '#27272a' },
  { name: 'Silver Storm', hex: '#94a3b8' },
  { name: 'Solar Yellow', hex: '#eab308' },
];

export function EditBikeModal({ bike, open, onOpenChange, onBikeUpdated }: EditBikeModalProps) {
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [kmHours, setKmHours] = useState('');
  const [category, setCategory] = useState<BikeCategory>('naked');
  const [primaryColor, setPrimaryColor] = useState('#0284c7');
  const [accentColor, setAccentColor] = useState('#18181b');
  const [extractedPalette, setExtractedPalette] = useState<string[]>([]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtractingColor, setIsExtractingColor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bike) {
      setName(bike.name || '');
      setModel(bike.model || '');
      setYear(bike.year ? String(bike.year) : '');
      setKmHours(bike.current_km_hours ? String(bike.current_km_hours) : '0');
      setCategory((bike.category as BikeCategory) || 'naked');
      setPrimaryColor(bike.primary_color || '#0284c7');
      setAccentColor(bike.accent_color || '#18181b');
      setPreviewUrl(bike.image_url || null);
      setSelectedFile(null);
      setErrorMessage(null);
    }
  }, [bike]);

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bike) return;
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Inserisci il nome o la marca della moto.');
      return;
    }
    if (!model.trim()) {
      setErrorMessage('Inserisci il modello della moto.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('model', model.trim());
      if (year.trim()) formData.append('year', year.trim());
      formData.append('current_km_hours', kmHours.trim() || '0');
      formData.append('category', category);
      formData.append('primary_color', primaryColor);
      formData.append('accent_color', accentColor);

      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await updateBike(bike.id, formData);

      if (!res.success || !res.bike) {
        setErrorMessage(res.error || 'Errore durante la modifica della moto.');
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
      <DialogContent className="max-w-full sm:max-w-xl md:max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden rounded-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-850 bg-zinc-900/80">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-zinc-100">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
                <BikeIcon className="w-4 h-4" />
              </div>
              Modifica Dati & Reference 3D {name}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-1">
              Aggiorna foto profilo, sagoma 3D, chilometraggio e specifiche tecniche.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Photo & Color */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-orange-400" />
                Foto Profilo Moto
              </span>
            </Label>

            {previewUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-900 p-2 flex items-center gap-4">
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-zinc-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Anteprima foto moto"
                    className="w-full h-full object-cover"
                  />
                  {isExtractingColor && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-200">Foto Attuale</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-orange-400 hover:text-orange-300 underline font-semibold"
                    >
                      Sostituisci
                    </button>
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    Colore livrea per il modello 3D:
                  </p>

                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md border border-zinc-600 shadow-sm"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="text-xs font-mono font-semibold text-zinc-200">{primaryColor}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 hover:border-orange-500/50 hover:bg-zinc-900/60 transition-all rounded-2xl p-5 text-center cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-6 h-6 text-zinc-400" />
                <p className="text-xs font-bold text-zinc-200">Carica una foto per questa moto</p>
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

          {/* 3D Model Live preview */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              Anteprima Modello 3D
            </Label>
            <Motorcycle3DViewer
              bike={{
                name: name || 'Moto',
                category,
                primary_color: primaryColor,
                accent_color: accentColor,
                image_url: previewUrl,
              }}
              height={200}
              showControls={false}
              autoRotateDefault={true}
            />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1 block">Marca / Nome *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 h-11 text-sm focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1 block">Modello *</label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 h-11 text-sm focus:border-orange-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1 block">Anno</label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 h-11 text-sm font-mono focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 mb-1 block">Chilometri (km)</label>
              <Input
                type="number"
                value={kmHours}
                onChange={(e) => setKmHours(e.target.value)}
                className="bg-zinc-900 border-zinc-800 text-zinc-100 h-11 text-sm font-mono focus:border-orange-500"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Sagoma / Categoria 3D
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BIKE_CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-orange-500/15 border-orange-500 text-white'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{cat.label.split('/')[0]}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-orange-400" />
                Colore Livrea 3D
              </Label>
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border border-zinc-700 bg-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setPrimaryColor(color.hex)}
                  className={`w-7 h-7 rounded-lg border transition-transform ${
                    primaryColor === color.hex ? 'ring-2 ring-orange-500 scale-110 border-white' : 'border-zinc-700'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-850 px-4 h-11"
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
