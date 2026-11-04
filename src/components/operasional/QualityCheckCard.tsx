'use client';

import type { Dispatch, SetStateAction } from 'react';
import { CheckCircle2 } from 'lucide-react';

export type QualityConclusion = 'LAYAK_EDAR' | 'TOLAK_RETUR';

interface QualityCheckCardProps {
  disabled: boolean;
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
}

const checks = [
  { key: 'aroma', label: 'Aroma' },
  { key: 'taste', label: 'Rasa' },
  { key: 'texture', label: 'Tekstur' },
  { key: 'container', label: 'Wadah' },
] as const;

export function QualityCheckCard({
  disabled,
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
}: QualityCheckCardProps) {
  const values = { aroma, taste, texture, container };
  const setters = {
    aroma: onAromaChange,
    taste: onTasteChange,
    texture: onTextureChange,
    container: onContainerChange,
  };

  return (
    <section className="space-y-4 rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white/45 p-4 shadow-sm sm:p-5" aria-labelledby="quality-check-title">
      <div>
        <div id="quality-check-title" className="flex items-center gap-2 text-sm font-black text-slate-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/20">
            <CheckCircle2 className="h-4 w-4 text-amber-600" />
          </span>
          Pemeriksaan Kelayakan Makanan
        </div>
        <p className="mt-1 text-[11px] text-slate-600">
          Lengkapi QC sebelum membuka distribusi sesuai SOP keamanan pangan.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {checks.map((check) => (
          <label key={check.key} className="text-xs font-bold text-slate-700">
            {check.label}
            <select
              value={values[check.key]}
              disabled={disabled}
              onChange={(event) => setters[check.key](event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"
            >
              <option>Baik</option>
              <option>Tidak sesuai</option>
            </select>
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <input
            type="checkbox"
            checked={sampleStored}
            disabled={disabled}
            onChange={(event) => onSampleStoredChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
          />
          1 porsi sampel bank makanan sudah disimpan
        </label>
        <select
          value={conclusion}
          disabled={disabled}
          onChange={(event) => onConclusionChange(event.target.value as QualityConclusion)}
          className={`rounded-lg border px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-blue ${
            conclusion === 'LAYAK_EDAR'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-red-300 bg-red-50 text-red-800'
          }`}
        >
          <option value="LAYAK_EDAR">LAYAK EDAR</option>
          <option value="TOLAK_RETUR">TIDAK LAYAK / RETUR</option>
        </select>
      </div>
    </section>
  );
}
