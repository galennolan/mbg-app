'use client';

import React, { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Camera,
  Upload,
  X,
  Sparkles,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';

export type QualityConclusion = 'LAYAK_EDAR' | 'TOLAK_RETUR';

interface QualityCheckCardProps {
  disabled?: boolean;
  conclusion: QualityConclusion;
  onConclusionChange: (value: QualityConclusion) => void;
  sampleStored: boolean;
  onSampleStoredChange: (value: boolean) => void;
  aroma: string;
  onAromaChange: Dispatch<SetStateAction<string>>;
  taste: string;
  onTasteChange: Dispatch<SetStateAction<string>>;
  texture: string;
  onTextureChange: Dispatch<SetStateAction<string>>;
  container: string;
  onContainerChange: Dispatch<SetStateAction<string>>;
  photoUrl?: string | null;
  onPhotoChange?: (url: string | null) => void;
}

const aromaOptions = ['Harum Segar (SOP)', 'Normal/Biasa', 'Bau Asam/Tengik (Tolak)'];
const tasteOptions = ['Gurih Sesuai Standar', 'Normal/Cukup', 'Asam/Basi/Aneh (Tolak)'];
const textureOptions = ['Matang Sempurna & Renyah', 'Normal', 'Lendir/Lembek Ekstrem (Tolak)'];
const containerOptions = ['Bersih, Rapat & Higienis', 'Cukup Rapi', 'Rusak/Terbuka/Kotor (Tolak)'];

export function QualityCheckCard({
  disabled = false,
  conclusion,
  onConclusionChange,
  sampleStored,
  onSampleStoredChange,
  aroma,
  onAromaChange,
  taste,
  onTasteChange,
  texture,
  onTextureChange,
  container,
  onContainerChange,
  photoUrl,
  onPhotoChange,
}: QualityCheckCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoChange) {
      const reader = new FileReader();
      reader.onload = () => {
        onPhotoChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyPresetLayak = () => {
    onAromaChange('Harum Segar (SOP)');
    onTasteChange('Gurih Sesuai Standar');
    onTextureChange('Matang Sempurna & Renyah');
    onContainerChange('Bersih, Rapat & Higienis');
    onConclusionChange('LAYAK_EDAR');
    onSampleStoredChange(true);
  };

  return (
    <section
      className="space-y-4 rounded-3xl border border-white/20 bg-white/70 p-5 shadow-lg backdrop-blur-xl sm:p-6"
      aria-labelledby="quality-check-title"
    >
      {/* Header QC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-cyan-500 text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 id="quality-check-title" className="text-sm font-black text-slate-900 tracking-tight">
              Uji Organoleptik & QC Cepat (FR-2.2)
            </h3>
            <p className="text-xs text-slate-500">
              Pemeriksaan 4 parameter keamanan pangan sebelum MBG didistribusikan.
            </p>
          </div>
        </div>

        {!disabled && (
          <button
            type="button"
            onClick={handleApplyPresetLayak}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 transition active:scale-95 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            1-Klik: Set Standar SOP Layak
          </button>
        )}
      </div>

      {/* 4 Organoleptic Parameters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Aroma */}
        <label className="block text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1 mb-1">
            <span>Aroma</span>
            <span className="text-brand-blue font-mono">*</span>
          </span>
          <select
            value={aroma}
            disabled={disabled}
            onChange={(e) => onAromaChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-60"
          >
            {aromaOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        {/* Rasa */}
        <label className="block text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1 mb-1">
            <span>Rasa</span>
            <span className="text-brand-blue font-mono">*</span>
          </span>
          <select
            value={taste}
            disabled={disabled}
            onChange={(e) => onTasteChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-60"
          >
            {tasteOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        {/* Tekstur */}
        <label className="block text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1 mb-1">
            <span>Tekstur</span>
            <span className="text-brand-blue font-mono">*</span>
          </span>
          <select
            value={texture}
            disabled={disabled}
            onChange={(e) => onTextureChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-60"
          >
            {textureOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        {/* Wadah */}
        <label className="block text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1 mb-1">
            <span>Kebersihan Wadah</span>
            <span className="text-brand-blue font-mono">*</span>
          </span>
          <select
            value={container}
            disabled={disabled}
            onChange={(e) => onContainerChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-60"
          >
            {containerOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 1-Tap Photo Capture for Food Sample & Food Bank SOP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Photo Capture */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-200 shadow-inner group">
                <img
                  src={photoUrl}
                  alt="Sampel Makanan MBG"
                  className="h-full w-full object-cover"
                />
                {!disabled && onPhotoChange && (
                  <button
                    type="button"
                    onClick={() => onPhotoChange(null)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100/70 text-brand-blue">
                <Camera className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-slate-800">
                1-Tap Photo Sampel Makanan
              </p>
              <p className="text-[11px] text-slate-500">
                {photoUrl ? 'Foto sampel tersimpan' : 'Dokumentasi fisik menu MBG hari ini'}
              </p>
            </div>
          </div>

          {!disabled && onPhotoChange && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition active:scale-95"
              >
                <Camera className="w-3.5 h-3.5 text-brand-blue" />
                {photoUrl ? 'Ganti Foto' : 'Ambil Foto'}
              </button>
            </div>
          )}
        </div>

        {/* SOP Bank Makanan & Kesimpulan */}
        <div className="space-y-2.5 flex flex-col justify-center">
          <label className="flex items-start gap-2.5 text-xs font-semibold text-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sampleStored}
              disabled={disabled}
              onChange={(e) => onSampleStoredChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
            />
            <span>
              <strong className="block text-slate-900 font-bold">
                1 Porsi Sampel Bank Makanan Disimpan (SOP 2x24 Jam)
              </strong>
              <span className="text-[11px] text-slate-500 font-normal">
                Disimpan di kulkas transit untuk uji laboratorium bila terjadi kejadian darurat.
              </span>
            </span>
          </label>

          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-700">Kesimpulan QC:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onConclusionChange('LAYAK_EDAR')}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition ${
                  conclusion === 'LAYAK_EDAR'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                LAYAK EDAR
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onConclusionChange('TOLAK_RETUR')}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold border transition ${
                  conclusion === 'TOLAK_RETUR'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <X className="w-4 h-4" />
                TOLAK / RETUR
              </button>
            </div>
          </div>
        </div>
      </div>

      {conclusion === 'TOLAK_RETUR' && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 flex items-center gap-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
          <span>
            <strong>PERINGATAN:</strong> Status <em>TOLAK / RETUR</em> akan otomatis memblokir
            distribusi porsi ke siswa untuk mencegah risiko keracunan pangan.
          </span>
        </div>
      )}
    </section>
  );
}
