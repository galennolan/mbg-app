'use client';

import React, { useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Camera,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Select, Checkbox, Button, Alert } from '@/components/ui';

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
  sampleError?: string;
}

const aromaOptions = [
  { value: 'Harum Segar (SOP)', label: 'Harum Segar (SOP)' },
  { value: 'Normal/Biasa', label: 'Normal / Biasa' },
  { value: 'Bau Asam/Tengik (Tolak)', label: 'Bau Asam / Tengik (Tolak)' },
];

const tasteOptions = [
  { value: 'Gurih Sesuai Standar', label: 'Gurih Sesuai Standar' },
  { value: 'Normal/Cukup', label: 'Normal / Cukup' },
  { value: 'Asam/Basi/Aneh (Tolak)', label: 'Asam / Basi / Aneh (Tolak)' },
];

const textureOptions = [
  { value: 'Matang Sempurna & Renyah', label: 'Matang Sempurna & Renyah' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Lendir/Lembek Ekstrem (Tolak)', label: 'Lendir / Lembek Ekstrem (Tolak)' },
];

const containerOptions = [
  { value: 'Bersih, Rapat & Higienis', label: 'Bersih, Rapat & Higienis' },
  { value: 'Cukup Rapi', label: 'Cukup Rapi' },
  { value: 'Rusak/Terbuka/Kotor (Tolak)', label: 'Rusak / Terbuka / Kotor (Tolak)' },
];

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
  sampleError,
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
      className="micro-card space-y-5 rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"
      aria-labelledby="quality-check-title"
    >
      {/* Header QC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue border border-brand-blue-100">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h3 id="quality-check-title" className="text-sm sm:text-base font-black text-brand-navy tracking-tight">
              Uji Organoleptik & QC Cepat (FR-2.2)
            </h3>
            <p className="text-xs text-slate-600">
              Pemeriksaan 4 parameter keamanan pangan sebelum MBG didistribusikan.
            </p>
          </div>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyPresetLayak}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-brand-green" />}
            className="border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100"
          >
            Set Standar SOP Layak
          </Button>
        )}
      </div>

      {/* 4 Organoleptic Parameters using Accessible Custom Combobox Select */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <Select
          label="Aroma Makanan"
          required
          value={aroma}
          disabled={disabled}
          options={aromaOptions}
          onValueChange={(val) => onAromaChange(val)}
        />

        <Select
          label="Rasa Makanan"
          required
          value={taste}
          disabled={disabled}
          options={tasteOptions}
          onValueChange={(val) => onTasteChange(val)}
        />

        <Select
          label="Tekstur Makanan"
          required
          value={texture}
          disabled={disabled}
          options={textureOptions}
          onValueChange={(val) => onTextureChange(val)}
        />

        <Select
          label="Kebersihan Wadah Ompreng"
          required
          value={container}
          disabled={disabled}
          options={containerOptions}
          onValueChange={(val) => onContainerChange(val)}
        />
      </div>

      {/* 1-Tap Photo Capture for Food Sample & Food Bank SOP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* Photo Capture */}
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {photoUrl ? (
              <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 group">
                <img
                  src={photoUrl}
                  alt="Sampel Makanan MBG"
                  className="h-full w-full object-cover"
                />
                {!disabled && onPhotoChange && (
                  <button
                    type="button"
                    onClick={() => onPhotoChange(null)}
                    aria-label="Hapus foto sampel"
                    className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue border border-brand-blue-100 shrink-0">
                <Camera className="w-5 h-5" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900">
                Foto Sampel Makanan
              </p>
              <p className="text-[11px] text-slate-600 truncate">
                {photoUrl ? 'Foto sampel tersimpan' : 'Dokumentasi fisik menu MBG hari ini'}
              </p>
            </div>
          </div>

          {!disabled && onPhotoChange && (
            <div className="shrink-0">
              <input
                ref={fileInputRef}
                id="qc-sample-photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoCapture}
                aria-label="Unggah atau ambil foto sampel makanan"
                className="sr-only"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Camera className="w-3.5 h-3.5 text-brand-blue" />}
              >
                {photoUrl ? 'Ganti Foto' : 'Ambil Foto'}
              </Button>
            </div>
          )}
        </div>

        {/* SOP Bank Makanan & Kesimpulan */}
        <div className="space-y-3 flex flex-col justify-center">
          <Checkbox
            id="qc-sample-stored"
            checked={sampleStored}
            disabled={disabled}
            required
            onChange={onSampleStoredChange}
            error={sampleError}
            label="1 Porsi Sampel Bank Makanan Disimpan (SOP 2x24 Jam)"
            description="Disimpan di kulkas transit untuk uji laboratorium bila terjadi keadaan darurat."
          />

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-xs font-bold text-slate-800">Kesimpulan QC:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onConclusionChange('LAYAK_EDAR')}
                aria-pressed={conclusion === 'LAYAK_EDAR'}
                className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border micro-tap ${
                  conclusion === 'LAYAK_EDAR'
                    ? 'bg-brand-green text-white border-brand-green shadow-elev-1'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                LAYAK EDAR
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onConclusionChange('TOLAK_RETUR')}
                aria-pressed={conclusion === 'TOLAK_RETUR'}
                className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border micro-tap ${
                  conclusion === 'TOLAK_RETUR'
                    ? 'bg-brand-red text-white border-brand-red shadow-elev-1'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
                TOLAK / RETUR
              </button>
            </div>
          </div>
        </div>
      </div>

      {conclusion === 'TOLAK_RETUR' && (
        <Alert
          variant="error"
          title="Status TOLAK / RETUR Aktif"
          message="Distribusi porsi ke siswa akan otomatis diblokir untuk mencegah risiko keamanan pangan."
        />
      )}
    </section>
  );
}
