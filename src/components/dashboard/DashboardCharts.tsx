'use client';

import React, { useState } from 'react';
import {
  PieChart,
  BarChart3,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Utensils,
  Layers,
  Sparkles,
  Info,
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
  const [activeSegmentTab, setActiveSegmentTab] = useState<'jurusan' | 'tingkat'>('jurusan');

  // ----------------------------------------------------
  // 1. Calculations for Donut Gauge
  // ----------------------------------------------------
  const radius = 58;
  const circumference = 2 * Math.PI * radius; // ~364.42
  const safeTotal = Math.max(totalSiswa, 1);
  const terserapRatio = Math.min(Math.max(totalTerserap / safeTotal, 0), 1);
  const sisaRatio = Math.min(Math.max(totalSisa / safeTotal, 0), 1 - terserapRatio);
  const menungguRatio = Math.max(1 - terserapRatio - sisaRatio, 0);

  const dashTerserap = terserapRatio * circumference;
  const dashSisa = sisaRatio * circumference;
  const dashMenunggu = menungguRatio * circumference;

  // ----------------------------------------------------
  // 2. Calculations for Histogram Peak Hours
  // ----------------------------------------------------
  const maxHistogramCount = Math.max(...peakHours.map((b) => b.count), 0);
  const totalHistogramTransactions = peakHours.reduce((sum, b) => sum + b.count, 0);
  const peakBucket = peakHours.find((b) => b.isPeak);

  return (
    <div className="space-y-6">
      {/* Grid: 2 Kolom Atas (Donut Gauge & Komparasi Serapan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 1: Donut Gauge Rasio Serapan MBG Hari Ini (5 Col) */}
        <div className="lg:col-span-5 micro-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Rasio Serapan MBG</h3>
                  <p className="text-[11px] text-slate-500">Capaian real-time distribusi hari ini</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Live Gauge
              </span>
            </div>

            {/* SVG Donut Circle */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
              <div className="relative w-40 h-40 shrink-0">
                <svg
                  className="w-full h-full -rotate-90 transform"
                  viewBox="0 0 160 160"
                  role="img"
                  aria-label={`Grafik donat persentase serapan ${persenSelesai}%`}
                >
                  <title>Rasio Serapan Makanan Bergizi Gratis</title>
                  {/* Background Track */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#F1F5F9"
                    strokeWidth="16"
                    fill="none"
                  />
                  {/* Segment Menunggu (Slate) */}
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke="#E2E8F0"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${dashMenunggu} ${circumference}`}
                    strokeDashoffset={-(dashTerserap + dashSisa)}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                  {/* Segment Sisa / Absen (Amber) */}
                  {dashSisa > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="#F59E0B"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${dashSisa} ${circumference}`}
                      strokeDashoffset={-dashTerserap}
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  )}
                  {/* Segment Terserap (Emerald) */}
                  {dashTerserap > 0 && (
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="#10B981"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${dashTerserap} ${circumference}`}
                      strokeDashoffset="0"
                      strokeLinecap="round"
                      className="transition-all duration-700"
                    />
                  )}
                </svg>

                {/* Center Percentage Display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-3xl font-black font-mono text-slate-900 tracking-tight">
                    {persenSelesai}%
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    Terserap
                  </span>
                </div>
              </div>

              {/* Legends with Real Numbers */}
              <div className="space-y-2.5 w-full sm:w-auto text-xs">
                <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-slate-600 font-medium">Terserap (Siswa Hadir)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{totalTerserap} Porsi</span>
                </div>

                <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                    <span className="text-slate-600 font-medium">Sisa Porsi (Absen)</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{totalSisa} Porsi</span>
                </div>

                <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-slate-300 shrink-0" />
                    <span className="text-slate-600 font-medium">Total Kuota Sasaran</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{totalSiswa} Siswa</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Standar PWA Glassmorphism</span>
            <span className="font-semibold text-brand-navy">Diperbarui Otomatis</span>
          </div>
        </div>

        {/* CHART 2: Bar Chart Horisontal Komparatif: Serapan per Jurusan & Tingkat (7 Col) */}
        <div className="lg:col-span-7 micro-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Komparasi Serapan Rombel</h3>
                  <p className="text-[11px] text-slate-500">
                    Performa serapan porsi per konsentrasi keahlian & tingkat kelas
                  </p>
                </div>
              </div>

              {/* Segmented Toggle Control (Touch Target >= 44px) */}
              <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveSegmentTab('jurusan')}
                  className={`micro-tap min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeSegmentTab === 'jurusan'
                      ? 'bg-white text-brand-navy shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Jurusan ({deptStats.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSegmentTab('tingkat')}
                  className={`micro-tap min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeSegmentTab === 'tingkat'
                      ? 'bg-white text-brand-navy shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Per Tingkat ({gradeStats.length})
                </button>
              </div>
            </div>

            {/* List of Bars */}
            <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
              {activeSegmentTab === 'jurusan' ? (
                deptStats.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Belum ada data jurusan yang terdaftar.
                  </div>
                ) : (
                  deptStats.map((dept) => {
                    const isFull = dept.persen >= 100;
                    return (
                      <div key={dept.jurusan} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{dept.jurusan}</span>
                            {isFull && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-slate-500 text-[11px]">
                              {dept.jumlahHadir} / {dept.totalSiswa} Siswa
                            </span>
                            <span
                              className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                                isFull
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : dept.persen >= 60
                                  ? 'bg-blue-100 text-brand-blue'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {dept.persen}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar Container */}
                        <div
                          className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"
                          role="progressbar"
                          aria-valuenow={dept.persen}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Serapan jurusan ${dept.jurusan} sebesar ${dept.persen}%`}
                        >
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isFull
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : 'bg-gradient-to-r from-brand-blue to-cyan-500'
                            }`}
                            style={{ width: `${Math.min(dept.persen, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )
              ) : gradeStats.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Belum ada data tingkat yang terdaftar.
                </div>
              ) : (
                gradeStats.map((grade) => {
                  const isFull = grade.persen >= 100;
                  return (
                    <div key={grade.tingkat} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">Kelas {grade.tingkat}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[11px]">
                            {grade.jumlahHadir} / {grade.totalSiswa} Siswa
                          </span>
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              isFull
                                ? 'bg-emerald-100 text-emerald-800'
                                : grade.persen >= 60
                                ? 'bg-blue-100 text-brand-blue'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {grade.persen}%
                          </span>
                        </div>
                      </div>

                      <div
                        className="w-full bg-slate-100 rounded-full h-3 overflow-hidden"
                        role="progressbar"
                        aria-valuenow={grade.persen}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Serapan kelas ${grade.tingkat} sebesar ${grade.persen}%`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isFull
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              : 'bg-gradient-to-r from-brand-blue to-purple-500'
                          }`}
                          style={{ width: `${Math.min(grade.persen, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Warna bar: Hijau (100% Selesai) • Biru (&gt;60%) • Kuning (&lt;60%)</span>
            <span className="font-semibold text-brand-blue">Dapodik Terverifikasi</span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Kolom Bawah (Timeline Peak Hours & Mini Health Bar Ompreng) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART 3: Timeline Histogram Puncak Jam Pengambilan (Peak Hours) (7 Col) */}
        <div className="lg:col-span-7 micro-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Puncak Jam Pengambilan (Peak Hours)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Distribusi kepadatan meja transit per interval 15 menit
                  </p>
                </div>
              </div>

              {peakBucket && peakBucket.count > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Puncak: {peakBucket.label}</span>
                </div>
              )}
            </div>

            {totalHistogramTransactions === 0 ? (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">
                  Belum ada log transaksi pengambilan hari ini
                </p>
                <p className="text-[11px] text-slate-400">
                  Grafik histogram akan aktif otomatis ketika perwakilan kelas mulai memindai QR / PIN.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* SVG Vertical Histogram */}
                <div className="w-full h-44 flex items-end justify-between gap-2 pt-6 px-1">
                  {peakHours.map((bucket) => {
                    const heightPercent =
                      maxHistogramCount > 0 ? (bucket.count / maxHistogramCount) * 100 : 0;
                    return (
                      <div
                        key={bucket.label}
                        className="flex-1 flex flex-col items-center justify-end h-full group"
                      >
                        {/* Tooltip / Value on top */}
                        <div className="text-[11px] font-mono font-bold text-slate-700 mb-1 transition-transform group-hover:scale-110">
                          {bucket.count > 0 ? bucket.count : ''}
                        </div>

                        {/* Bar */}
                        <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg relative flex items-end overflow-hidden h-28">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-700 ${
                              bucket.isPeak
                                ? 'bg-gradient-to-t from-amber-500 to-amber-400'
                                : bucket.count > 0
                                ? 'bg-gradient-to-t from-brand-blue to-cyan-400'
                                : 'bg-transparent'
                            }`}
                            style={{ height: `${Math.max(heightPercent, bucket.count > 0 ? 8 : 0)}%` }}
                          />
                        </div>

                        {/* Label Interval */}
                        <div className="text-[10px] font-bold text-slate-500 text-center mt-2 whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {bucket.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span className="text-[11px]">
                    Total Transaksi: <strong>{totalHistogramTransactions} Siswa</strong>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Interval Puncak: <strong>{peakBucket?.label || '-'}</strong> ({peakBucket?.count || 0} porsi)
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Interval 15 Menit Realistis Operasional</span>
            <span className="font-semibold text-amber-700">Waktu Indonesia Barat (WIB)</span>
          </div>
        </div>

        {/* CHART 4: Mini Health Bar: Integritas Wadah & Ompreng (5 Col) */}
        <div className="lg:col-span-5 micro-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Integritas Wadah & Ompreng</h3>
                  <p className="text-[11px] text-slate-500">
                    Akuntabilitas aset wadah SPPG pasca-konsumsi
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                Asset Health
              </span>
            </div>

            {!omprengStats.hasReturned || omprengStats.totalKembali === 0 ? (
              <div className="py-8 text-center text-slate-500 space-y-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Belum Ada Pengembalian Ompreng
                </div>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Data rasio wadah utuh, rusak, dan hilang akan otomatis teragregasi setelah perwakilan
                  kelas menyerahkan kembali ompreng ke petugas piket.
                </p>
                <div className="inline-block text-[10px] font-mono font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600">
                  Status: Wadah Masih Berada di Kelas
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Stacked Horizontal Health Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Rasio Kesehatan Wadah</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {Math.round((omprengStats.utuh / omprengStats.totalKembali) * 100)}% Utuh
                    </span>
                  </div>

                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    {omprengStats.utuh > 0 && (
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{
                          width: `${(omprengStats.utuh / omprengStats.totalKembali) * 100}%`,
                        }}
                        title={`Utuh: ${omprengStats.utuh}`}
                      />
                    )}
                    {omprengStats.rusak > 0 && (
                      <div
                        className="bg-amber-500 h-full transition-all duration-500"
                        style={{
                          width: `${(omprengStats.rusak / omprengStats.totalKembali) * 100}%`,
                        }}
                        title={`Rusak: ${omprengStats.rusak}`}
                      />
                    )}
                    {omprengStats.hilang > 0 && (
                      <div
                        className="bg-rose-500 h-full transition-all duration-500"
                        style={{
                          width: `${(omprengStats.hilang / omprengStats.totalKembali) * 100}%`,
                        }}
                        title={`Hilang: ${omprengStats.hilang}`}
                      />
                    )}
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <span className="text-[10px] font-bold uppercase text-emerald-700 block">
                      Utuh
                    </span>
                    <span className="text-lg font-black font-mono text-emerald-900 block mt-0.5">
                      {omprengStats.utuh}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">Wadah</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="text-[10px] font-bold uppercase text-amber-700 block">
                      Rusak
                    </span>
                    <span className="text-lg font-black font-mono text-amber-900 block mt-0.5">
                      {omprengStats.rusak}
                    </span>
                    <span className="text-[10px] text-amber-600 font-medium">Wadah</span>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                    <span className="text-[10px] font-bold uppercase text-rose-700 block">
                      Hilang
                    </span>
                    <span className="text-lg font-black font-mono text-rose-900 block mt-0.5">
                      {omprengStats.hilang}
                    </span>
                    <span className="text-[10px] text-rose-600 font-medium">Wadah</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Total Dikembalikan:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {omprengStats.totalKembali} dari {totalTerserap} Porsi
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Sesuai SOP Sanitasi & Pengembalian</span>
            <span className="font-semibold text-cyan-800">SPPG Partner Audit</span>
          </div>
        </div>
      </div>
    </div>
  );
}

