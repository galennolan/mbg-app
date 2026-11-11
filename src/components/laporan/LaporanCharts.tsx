'use client';

import React from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  UtensilsCrossed,
  ShieldCheck,
  TrendingUp,
  Percent,
  Flame,
  Scale,
} from 'lucide-react';
import {
  Kelas,
  DistribusiMBG,
  OrganolepticTest,
} from '@/lib/types';
import { formatWIBTime, formatDateDDMMYYYY } from '@/lib/utils';

interface LaporanChartsProps {
  kelasList: Kelas[];
  distribusi: DistribusiMBG | null;
  selectedDate: string;
  totalSiswaSekolah: number;
  totalDiterima: number;
  totalBelum: number;
  persentaseSekolah: number;
}

export function LaporanCharts({
  kelasList,
  distribusi,
  selectedDate,
  totalSiswaSekolah,
  totalDiterima,
  totalBelum,
  persentaseSekolah,
}: LaporanChartsProps) {
  // Sort classes for clear comparison
  const sortedClasses = [...kelasList].sort((a, b) =>
    (a.nama_kelas || '').localeCompare(b.nama_kelas || '')
  );

  // Maximum student count in any class for scaling the bars
  const maxClassSiswa = Math.max(
    ...sortedClasses.map((k: any) => k.total_siswa_dapodik || k.siswa?.length || 30),
    35
  );

  // Food Waste calculations (approx. 350 grams per student portion standard)
  const porsiSisa = totalBelum;
  const estimasiWasteKg = (porsiSisa * 0.35).toFixed(1);
  const persentaseSisa =
    totalSiswaSekolah > 0 ? ((porsiSisa / totalSiswaSekolah) * 100).toFixed(1) : '0';

  // SPPG Arrival compliance
  const waktuTiba = distribusi?.waktu_kedatangan || null;
  let isTepatWaktu = true;
  let selisihMenit = 0;
  let waktuTibaFormatted = '-';

  if (waktuTiba) {
    waktuTibaFormatted = formatWIBTime(waktuTiba);
    try {
      const d = new Date(waktuTiba);
      const targetArrivalMinutes = 10 * 60 + 30; // 10:30 WIB target
      const actualMinutes = d.getHours() * 60 + d.getMinutes();
      selisihMenit = targetArrivalMinutes - actualMinutes;
      isTepatWaktu = actualMinutes <= targetArrivalMinutes;
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 1. INTERACTIVE VISUALIZATION CARDS (Hidden on Print)    */}
      {/* ======================================================== */}
      <div className="no-print space-y-6">
        {/* ROW 1: Multi-Bar Comparison Chart per Kelas (With Benchmark Line) */}
        <div className="micro-card rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Komparasi Serapan Porsi per Kelas
                </h3>
                <p className="text-[11px] text-slate-500">
                  Perbandingan porsi diterima (hadir) vs tidak hadir dengan benchmark rata-rata sekolah ({persentaseSekolah}%)
                </p>
              </div>
            </div>

            {/* Legend & Target Line Indicator */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-slate-600 font-medium text-[11px]">Diterima</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-slate-600 font-medium text-[11px]">Tidak Hadir</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <span className="w-4 h-0.5 border-t-2 border-dashed border-brand-navy" />
                <span className="text-brand-navy font-bold text-[11px]">
                  Target ({persentaseSekolah}%)
                </span>
              </div>
            </div>
          </div>

          {/* Chart Canvas: Horizontal Stacked Multi-Bar per Rombel */}
          <div className="space-y-3 pt-2">
            {sortedClasses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada data kelas yang terdaftar.
              </div>
            ) : (
              sortedClasses.map((cls: any) => {
                const total = cls.total_siswa_dapodik || cls.siswa?.length || 30;
                const sudah =
                  typeof cls.jumlah_hadir === 'number'
                    ? cls.jumlah_hadir
                    : 0;
                const belum =
                  typeof cls.jumlah_absen === 'number'
                    ? cls.jumlah_absen
                    : Math.max(0, total - sudah);
                const classPersen = total > 0 ? Math.round((sudah / total) * 100) : 0;
                const isAboveBenchmark = classPersen >= persentaseSekolah;

                return (
                  <div key={cls.id || cls.nama_kelas} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 min-w-[70px]">
                          {cls.nama_kelas}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({cls.jurusan} • Tingkat {cls.tingkat})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-slate-500">
                          <strong className="text-emerald-700">{sudah}</strong> / {total} Siswa
                        </span>
                        <span
                          className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                            classPersen === 100
                              ? 'bg-emerald-100 text-emerald-800'
                              : isAboveBenchmark
                              ? 'bg-blue-100 text-brand-navy'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {classPersen}%
                        </span>
                      </div>
                    </div>

                    {/* Stacked Bar with Benchmark Marker */}
                    <div className="relative w-full bg-slate-100 rounded-full h-4 overflow-hidden flex shadow-inner">
                      {/* Portion Hadir / Diterima */}
                      {sudah > 0 && (
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500"
                          style={{ width: `${(sudah / total) * 100}%` }}
                          title={`Diterima: ${sudah} siswa`}
                        />
                      )}
                      {/* Portion Tidak Hadir */}
                      {belum > 0 && (
                        <div
                          className="bg-amber-400 h-full transition-all duration-500"
                          style={{ width: `${(belum / total) * 100}%` }}
                          title={`Tidak hadir: ${belum} siswa`}
                        />
                      )}

                      {/* Benchmark Dashed Line Marker */}
                      {persentaseSekolah > 0 && (
                        <div
                          className="absolute top-0 bottom-0 border-r-2 border-dashed border-brand-navy z-10 pointer-events-none"
                          style={{ left: `${persentaseSekolah}%` }}
                          title={`Benchmark Rata-rata Sekolah: ${persentaseSekolah}%`}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Garis putus-putus biru tua menandakan target benchmark serapan rata-rata sekolah.</span>
            <span className="font-semibold text-emerald-700">Komparasi Hadir vs Absen</span>
          </div>
        </div>

        {/* ROW 2: Evaluasi QC, Food Waste, dan Kepatuhan Waktu SPPG */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Card 1: Breakdown QC & Food Waste (7 Col) */}
          <div className="lg:col-span-7 micro-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Evaluasi Kelayakan & Potensi Sisa Makanan
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Analisis food waste harian dari sisa porsi yang tidak diambil
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                  Waste Audit
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Metric 1: Estimasi Sisa Porsi Makanan */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      Sisa Porsi (Absen)
                    </span>
                    <Scale className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {porsiSisa} <span className="text-xs font-normal text-slate-500">Porsi</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Rasio Sisa: <strong>{persentaseSisa}%</strong> dari total kuota sekolah.
                  </div>
                </div>

                {/* Metric 2: Estimasi Berat Food Waste */}
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-amber-700">
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      Estimasi Berat Makanan
                    </span>
                    <Flame className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black text-amber-900 font-mono">
                    ± {estimasiWasteKg}{' '}
                    <span className="text-xs font-normal text-amber-700">Kg</span>
                  </div>
                  <div className="text-[11px] text-amber-800">
                    Dihitung dengan standar 350g/ompreng menu gizi seimbang.
                  </div>
                </div>
              </div>

              {/* Status Alokasi Sisa Porsi */}
              <div className="mt-4 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/60 text-xs text-blue-900 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">SOP Penyaluran Sisa Porsi MBG:</span>
                  <span className="text-blue-800 text-[11px]">
                    Porsi sisa tidak terbuang percuma; dialokasikan ke meja transit untuk klaim
                    susulan siswa piket, kegiatan ekstrakurikuler, atau program sosial sekolah.
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Rasio Porsi Terserap: {persentaseSekolah}%</span>
              <span className="font-semibold text-brand-navy">Kebijakan Zero Food Waste</span>
            </div>
          </div>

          {/* Card 2: Kepatuhan Waktu Tiba SPPG (5 Col) */}
          <div className="lg:col-span-5 micro-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Kepatuhan Waktu Tiba SPPG</h3>
                    <p className="text-[11px] text-slate-500">
                      Standar tiba sebelum pukul 10:30 WIB
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                    isTepatWaktu
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {isTepatWaktu ? 'Tepat Waktu' : 'Terlambat'}
                </span>
              </div>

              <div className="space-y-4">
                <div className="text-center p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Waktu Kedatangan Aktual
                  </span>
                  <div className="text-3xl font-black font-mono text-slate-900 mt-1">
                    {waktuTibaFormatted}
                  </div>
                  <span
                    className={`inline-block text-xs font-bold mt-1.5 px-3 py-1 rounded-full ${
                      isTepatWaktu
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {isTepatWaktu
                      ? selisihMenit > 0
                        ? `✓ Lebih Awal ${selisihMenit} Menit`
                        : '✓ Tepat Waktu'
                      : `✕ Terlambat ${Math.abs(selisihMenit)} Menit`}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                    <span className="text-slate-500">Target Kedatangan Maksimal:</span>
                    <span className="font-mono font-bold">10:30 WIB</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-slate-700">
                    <span className="text-slate-500">Mitra SPPG Terkait:</span>
                    <span className="font-bold text-slate-900">
                      {distribusi?.nama_sppg_aktual || 'SPPG Mitra Resmi'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 mt-4 text-[11px] text-slate-500 flex items-center justify-between">
              <span>SOP Distribusi MBG Jam Istirahat</span>
              <span className="font-semibold text-purple-700">SLA Mitra Terpenuhi</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. PRINT ISOLATION SECTION (Only visible on @media print)*/}
      {/* ======================================================== */}
      <div className="hidden print:block mt-6 pt-4 border-t border-slate-400 text-xs">
        <h3 className="text-sm font-bold uppercase text-slate-900 mb-2">
          Rangkuman Analitik Distribusi MBG & Kepatuhan SPPG
        </h3>
        <table className="w-full text-left border border-slate-400 mb-4">
          <thead className="bg-slate-100 font-bold uppercase border-b border-slate-400">
            <tr>
              <th className="py-2 px-3 border-r border-slate-400">Rombel / Kelas</th>
              <th className="py-2 px-3 border-r border-slate-400">Jurusan</th>
              <th className="py-2 px-3 border-r border-slate-400 text-right">Kuota Siswa</th>
              <th className="py-2 px-3 border-r border-slate-400 text-right">Porsi Hadir</th>
              <th className="py-2 px-3 border-r border-slate-400 text-right">Porsi Absen</th>
              <th className="py-2 px-3 text-right">Persentase</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-300">
            {sortedClasses.map((cls: any) => {
              const total = cls.total_siswa_dapodik || cls.siswa?.length || 30;
              const sudah =
                typeof cls.jumlah_hadir === 'number'
                  ? cls.jumlah_hadir
                  : 0;
              const belum =
                typeof cls.jumlah_absen === 'number'
                  ? cls.jumlah_absen
                  : Math.max(0, total - sudah);
              const classPersen = total > 0 ? Math.round((sudah / total) * 100) : 0;

              return (
                <tr key={cls.id || cls.nama_kelas}>
                  <td className="py-1.5 px-3 border-r border-slate-300 font-bold">
                    {cls.nama_kelas}
                  </td>
                  <td className="py-1.5 px-3 border-r border-slate-300">{cls.jurusan}</td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-right font-mono">
                    {total}
                  </td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-right font-mono font-bold">
                    {sudah}
                  </td>
                  <td className="py-1.5 px-3 border-r border-slate-300 text-right font-mono">
                    {belum}
                  </td>
                  <td className="py-1.5 px-3 text-right font-mono font-bold">
                    {classPersen}%
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 font-bold border-t border-slate-400">
            <tr>
              <td colSpan={2} className="py-2 px-3 border-r border-slate-400">
                TOTAL KESELURUHAN SEKOLAH
              </td>
              <td className="py-2 px-3 border-r border-slate-400 text-right font-mono">
                {totalSiswaSekolah}
              </td>
              <td className="py-2 px-3 border-r border-slate-400 text-right font-mono">
                {totalDiterima}
              </td>
              <td className="py-2 px-3 border-r border-slate-400 text-right font-mono">
                {totalBelum}
              </td>
              <td className="py-2 px-3 text-right font-mono text-emerald-800">
                {persentaseSekolah}%
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 border border-slate-400 rounded">
            <strong>Kepatuhan Waktu Kedatangan:</strong> {waktuTibaFormatted} WIB{' '}
            {isTepatWaktu ? '(Tepat Waktu)' : '(Terlambat)'}
          </div>
          <div className="p-3 border border-slate-400 rounded">
            <strong>Estimasi Sisa Porsi Makanan:</strong> {porsiSisa} Porsi (± {estimasiWasteKg} Kg)
          </div>
        </div>
      </div>
    </div>
  );
}

