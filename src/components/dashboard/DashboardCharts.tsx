'use client';

import React, { useState } from 'react';
import {
  PieChart,
  BarChart3,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  DepartmentAbsorptionStats,
  GradeLevelAbsorptionStats,
  PeakHourBucket,
  OmprengHealthStats,
} from '@/lib/types';

interface DashboardChartsProps {
  totalTerserap: number;
  totalSisa: number;
  totalSiswa: number;
  persenSelesai: number;
  deptStats: DepartmentAbsorptionStats[];
  gradeStats: GradeLevelAbsorptionStats[];
  peakHours: PeakHourBucket[];
  omprengStats: OmprengHealthStats;
}

export function DashboardCharts({
  totalTerserap,
  totalSisa,
  totalSiswa,
  persenSelesai,
  deptStats,
  gradeStats,
  peakHours,
  omprengStats,
}: DashboardChartsProps) {
  const [activeTab, setActiveTab] = useState<'jurusan' | 'tingkat' | 'peak'>('jurusan');

  // 1. Donut Gauge Calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const safeTotal = Math.max(totalSiswa, 1);
  const terserapRatio = Math.min(Math.max(totalTerserap / safeTotal, 0), 1);
  const sisaRatio = Math.min(Math.max(totalSisa / safeTotal, 0), 1 - terserapRatio);
  const menungguRatio = Math.max(1 - terserapRatio - sisaRatio, 0);

  const dashTerserap = terserapRatio * circumference;
  const dashSisa = sisaRatio * circumference;
  const dashMenunggu = menungguRatio * circumference;

  // 2. Peak Hours Calculations
  const maxHistogramCount = Math.max(...peakHours.map((b) => b.count), 0);
  const totalHistogramTransactions = peakHours.reduce((sum, b) => sum + b.count, 0);
  const peakBucket = peakHours.find((b) => b.isPeak);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* CARD 1: Rasio Serapan MBG & Ringkasan Wadah Ompreng (5 Col) */}
      <div className="lg:col-span-5 micro-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Rasio Serapan &amp; Wadah</h3>
                <p className="text-[11px] text-slate-500">Proporsi porsi &amp; status ompreng</p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Live
            </span>
          </div>

          {/* Donut + Compact Legend */}
          <div className="flex items-center justify-center gap-5 py-1">
            <div className="relative w-32 h-32 shrink-0">
              <svg
                className="w-full h-full -rotate-90 transform"
                viewBox="0 0 144 144"
                role="img"
                aria-label={`Grafik donat persentase serapan ${persenSelesai}%`}
              >
                <title>Rasio Serapan Makanan Bergizi Gratis</title>
                <circle cx="72" cy="72" r={radius} stroke="#F1F5F9" strokeWidth="14" fill="none" />
                <circle
                  cx="72"
                  cy="72"
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray={`${dashMenunggu} ${circumference}`}
                  strokeDashoffset={-(dashTerserap + dashSisa)}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
                {dashSisa > 0 && (
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="#F59E0B"
                    strokeWidth="14"
                    fill="none"
                    strokeDasharray={`${dashSisa} ${circumference}`}
                    strokeDashoffset={-dashTerserap}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                )}
                {dashTerserap > 0 && (
                  <circle
                    cx="72"
                    cy="72"
                    r={radius}
                    stroke="#10B981"
                    strokeWidth="14"
                    fill="none"
                    strokeDasharray={`${dashTerserap} ${circumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-black font-mono text-slate-900 tracking-tight">
                  {persenSelesai}%
                </span>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
                  Terserap
                </span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1 text-xs">
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  Hadir
                </span>
                <span className="font-mono font-bold text-slate-900">{totalTerserap}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  Sisa
                </span>
                <span className="font-mono font-bold text-slate-900">{totalSisa}</span>
              </div>
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300 shrink-0" />
                  Kuota
                </span>
                <span className="font-mono font-bold text-slate-900">{totalSiswa}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Ompreng Asset Health Strip inside the same card */}
        <div className="rounded-xl bg-slate-50/90 border border-slate-200/70 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
              Integritas Wadah Ompreng
            </span>
            {omprengStats.hasReturned && omprengStats.totalKembali > 0 ? (
              <span className="font-mono text-[11px] font-bold text-emerald-700">
                {omprengStats.utuh} Utuh • {omprengStats.rusak} Rusak • {omprengStats.hilang} Hilang
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-slate-500">
                Masih di Kelas
              </span>
            )}
          </div>
          {omprengStats.hasReturned && omprengStats.totalKembali > 0 && (
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${(omprengStats.utuh / omprengStats.totalKembali) * 100}%` }}
              />
              <div
                className="bg-amber-500 h-full"
                style={{ width: `${(omprengStats.rusak / omprengStats.totalKembali) * 100}%` }}
              />
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${(omprengStats.hilang / omprengStats.totalKembali) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* CARD 2: Analitik Rombel & Jam Puncak (7 Col - Tabbed Jurusan / Tingkat / Jam Puncak) */}
      <div className="lg:col-span-7 micro-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3 mb-3.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-blue-50 text-brand-blue flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Komparasi Serapan &amp; Jam Puncak</h3>
                <p className="text-[11px] text-slate-500">
                  Performa serapan per jurusan, tingkat kelas, dan waktu klaim
                </p>
              </div>
            </div>

            {/* 3-Tab Segmented Switcher */}
            <div className="inline-flex bg-brand-blue-50/80 p-1 rounded-xl border border-brand-blue-200/70 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('jurusan')}
                className={`micro-tap min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  activeTab === 'jurusan'
                    ? 'bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#1E88E5] text-white shadow-sm'
                    : 'text-brand-blue-800 hover:bg-brand-blue-100/60'
                }`}
              >
                Jurusan ({deptStats.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tingkat')}
                className={`micro-tap min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  activeTab === 'tingkat'
                    ? 'bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#1E88E5] text-white shadow-sm'
                    : 'text-brand-blue-800 hover:bg-brand-blue-100/60'
                }`}
              >
                Tingkat ({gradeStats.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('peak')}
                className={`micro-tap min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  activeTab === 'peak'
                    ? 'bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#1E88E5] text-white shadow-sm'
                    : 'text-brand-blue-800 hover:bg-brand-blue-100/60'
                }`}
              >
                Jam Puncak
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'peak' ? (
            totalHistogramTransactions === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-1.5">
                <Clock className="w-7 h-7 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">
                  Belum ada log transaksi pengambilan hari ini
                </p>
                <p className="text-[11px] text-slate-400">
                  Histogram aktif otomatis saat perwakilan kelas mulai memindai QR / PIN.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-full h-36 flex items-end justify-between gap-2 pt-4 px-1">
                  {peakHours.map((bucket) => {
                    const heightPercent =
                      maxHistogramCount > 0 ? (bucket.count / maxHistogramCount) * 100 : 0;
                    return (
                      <div
                        key={bucket.label}
                        className="flex-1 flex flex-col items-center justify-end h-full group"
                      >
                        <div className="text-[10px] font-mono font-bold text-slate-700 mb-1">
                          {bucket.count > 0 ? bucket.count : ''}
                        </div>
                        <div className="w-full max-w-[38px] bg-slate-100 rounded-t-lg relative flex items-end overflow-hidden h-24">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-700 ${
                              bucket.isPeak
                                ? 'bg-gradient-to-t from-amber-500 to-amber-400'
                                : bucket.count > 0
                                  ? 'bg-gradient-to-t from-[#0D47A1] to-[#1E88E5]'
                                  : 'bg-transparent'
                            }`}
                            style={{ height: `${Math.max(heightPercent, bucket.count > 0 ? 8 : 0)}%` }}
                          />
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 text-center mt-1.5 truncate w-full">
                          {bucket.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-xl bg-slate-50 px-3 py-2 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    Total Transaksi: <strong>{totalHistogramTransactions} Siswa</strong>
                  </span>
                  {peakBucket && peakBucket.count > 0 && (
                    <span className="inline-flex items-center gap-1 text-amber-800 font-bold">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Puncak: {peakBucket.label} ({peakBucket.count} porsi)
                    </span>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="space-y-3 max-h-[210px] overflow-y-auto pr-1">
              {(activeTab === 'jurusan'
                ? deptStats.map((d) => ({
                    key: d.jurusan,
                    label: d.jurusan,
                    hadir: d.jumlahHadir,
                    total: d.totalSiswa,
                    persen: d.persen,
                  }))
                : gradeStats.map((g) => ({
                    key: g.tingkat,
                    label: `Kelas ${g.tingkat}`,
                    hadir: g.jumlahHadir,
                    total: g.totalSiswa,
                    persen: g.persen,
                  }))
              ).map((item) => {
                const isFull = item.persen >= 100;
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {isFull && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-500 text-[11px]">
                          {item.hadir}/{item.total}
                        </span>
                        <span
                          className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                            isFull
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.persen >= 60
                                ? 'bg-blue-100 text-brand-blue'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.persen}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isFull
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                            : 'bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#1E88E5]'
                        }`}
                        style={{ width: `${Math.min(item.persen, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2.5 border-t border-slate-100 mt-3 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Hijau (100%) • Biru (&gt;60%) • Kuning (&lt;60%)</span>
          <span className="font-semibold text-brand-blue">Sinkronisasi Real-time</span>
        </div>
      </div>
    </div>
  );
}
