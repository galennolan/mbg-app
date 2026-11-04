'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  TrendingUp,
  RotateCw,
  ArrowRight,
  ShieldAlert,
  Building,
  UserCheck,
  Utensils,
  BookOpen,
} from 'lucide-react';
import { getTodayDistribution, getDashboardStatistics } from '@/lib/services';
import { DistribusiMBG } from '@/lib/types';
import { formatWIBTime, formatIndonesianDate, getJakartaDateString } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [distribusi, setDistribusi] = useState<DistribusiMBG | null>(null);
  const [stats, setStats] = useState<any>({
    totalSiswa: 0,
    totalDiterima: 0,
    totalBelum: 0,
    persen: 0,
    totalTidakHadir: 0,
    totalTidakMengambil: 0,
    waktuPertama: null,
    waktuTerakhir: null,
    rekapKelas: [],
    rekapJurusan: [],
    recentActivities: [],
  });

  const loadDashboard = useCallback(async () => {
    try {
      const dist = await getTodayDistribution();
      setDistribusi(dist);
      const dashboardStats = await getDashboardStatistics(dist?.id);
      setStats(dashboardStats);
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    // Auto refresh every 20 seconds for real-time tracking
    const interval = setInterval(loadDashboard, 20000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Memuat data operasional dashboard...</p>
      </div>
    );
  }

  const isTiba = distribusi?.status === 'tiba';
  const isDitutup = distribusi?.status === 'ditutup';
  const isMenunggu = !distribusi || distribusi.status === 'menunggu';

  const kelasSelesaiCount = stats.rekapKelas.filter((k: any) => k.selesai).length;
  const totalKelasCount = stats.rekapKelas.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Operasional Harian
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-600 font-medium">
              {formatIndonesianDate(distribusi?.tanggal || getJakartaDateString())}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            Dashboard Distribusi MBG
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pantau status kedatangan makanan dan rekap penerimaan siswa secara langsung
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setRefreshing(true);
              loadDashboard();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Perbarui
          </button>

          <Link
            href="/kedatangan"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Truck className="w-4 h-4" />
            Kedatangan MBG
          </Link>

          <Link
            href="/konfirmasi/kelas"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-navy hover:bg-brand-navy-light text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Users className="w-4 h-4" />
            Konfirmasi Massal
          </Link>
        </div>
      </div>

      {/* Status Distribusi Alert Banner */}
      <div
        className={`rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border shadow-sm ${
          isTiba
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : isDitutup
            ? 'bg-slate-100 border-slate-300 text-slate-800'
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
              isTiba
                ? 'bg-emerald-500 text-white'
                : isDitutup
                ? 'bg-slate-500 text-white'
                : 'bg-amber-500 text-white'
            }`}
          >
            {isTiba ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isDitutup ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-75">
              Status Operasional Hari Ini
            </div>
            <div className="text-lg font-extrabold">
              {isTiba && 'MBG Telah Tiba di Sekolah'}
              {isMenunggu && 'MBG Belum Tiba (Menunggu Petugas)'}
              {isDitutup && 'Distribusi Hari Ini Ditutup'}
            </div>
            {distribusi?.waktu_kedatangan && (
              <div className="text-xs opacity-90 font-mono mt-0.5">
                Waktu Kedatangan Aktual: {formatWIBTime(distribusi.waktu_kedatangan)}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMenunggu && (
            <Link
              href="/kedatangan"
              className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition"
            >
              Catat Kedatangan Sekarang →
            </Link>
          )}
          {isTiba && (
            <Link
              href="/kedatangan"
              className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl transition"
            >
              Kelola Distribusi
            </Link>
          )}
        </div>
      </div>

      {/* 4 KARTU STATISTIK UTAMA (PRD Section 5.2) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa Aktif */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Siswa</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {stats.totalSiswa}
          </div>
          <div className="text-xs text-slate-500 mt-1">Siswa aktif terdaftar</div>
        </div>

        {/* Sudah Menerima */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sudah Menerima</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">
            {stats.totalDiterima}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Tercatat menerima ({stats.persen}%)
          </div>
        </div>

        {/* Belum Tercatat Menerima */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Belum Tercatat</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-600 tracking-tight">
            {stats.totalBelum}
          </div>
          <div className="text-xs text-slate-500 mt-1">Belum ada transaksi</div>
        </div>

        {/* Persentase Penerimaan */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-brand-blue mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tingkat Capaian</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-brand-blue tracking-tight">
            {stats.persen}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-brand-blue h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.persen)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* METRIK WAKTU OPERASIONAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Truck className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Waktu Kedatangan MBG</div>
            <div className="text-sm font-bold font-mono text-slate-800">
              {formatWIBTime(distribusi?.waktu_kedatangan)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Penerimaan Pertama</div>
            <div className="text-sm font-bold font-mono text-slate-800">
              {formatWIBTime(stats.waktuPertama)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-semibold uppercase">Penerimaan Terakhir</div>
            <div className="text-sm font-bold font-mono text-slate-800">
              {formatWIBTime(stats.waktuTerakhir)}
            </div>
          </div>
        </div>
      </div>

      {/* GRID REKAP KELAS & REKAP JURUSAN (Section 5.3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rekap Per Kelas (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Rekap Penerimaan Per Kelas</h2>
              <p className="text-xs text-slate-500">
                {kelasSelesaiCount} dari {totalKelasCount} kelas telah 100% menerima
              </p>
            </div>
            <Link
              href="/konfirmasi/kelas"
              className="text-xs font-bold text-brand-blue hover:underline"
            >
              Input Kelas →
            </Link>
          </div>

          {stats.rekapKelas.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Belum ada data kelas yang terdaftar.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.rekapKelas.map((k: any) => (
                <div
                  key={k.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{k.nama_kelas}</span>
                      <span className="text-xs text-slate-500">• {k.jurusan}</span>
                      {k.selesai && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Selesai
                        </span>
                      )}
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          k.selesai ? 'bg-emerald-500' : 'bg-brand-blue'
                        }`}
                        style={{ width: `${k.persen}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Diterima</span>
                      <span className="font-bold text-emerald-600">{k.sudah}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Belum</span>
                      <span className="font-bold text-amber-600">{k.belum}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Total</span>
                      <span className="font-bold text-slate-700">{k.total}</span>
                    </div>
                    <div className="w-12 text-right font-bold text-slate-800">{k.persen}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rekap Per Jurusan & Aktivitas Terakhir (1 Col) */}
        <div className="space-y-6">
          {/* Rekap Jurusan */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Rekap Jurusan</h2>
            {stats.rekapJurusan.length === 0 ? (
              <div className="text-center py-4 text-slate-400 text-sm">Belum ada jurusan</div>
            ) : (
              <div className="space-y-3">
                {stats.rekapJurusan.map((j: any) => (
                  <div key={j.jurusan} className="text-xs">
                    <div className="flex justify-between font-medium mb-1">
                      <span className="text-slate-700 font-semibold truncate">{j.jurusan}</span>
                      <span className="text-slate-500">
                        {j.sudah}/{j.total} ({j.persen}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-brand-navy h-1.5 rounded-full"
                        style={{ width: `${j.persen}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aktivitas Konfirmasi Terbaru */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Aktivitas Terkini</h2>
            {stats.recentActivities.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Belum ada konfirmasi hari ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.recentActivities.map((act: any) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-slate-800 truncate">{act.nama_siswa}</div>
                      <div className="text-[11px] text-slate-500">
                        {act.kelas} • {act.sumber_pencatatan === 'siswa' ? 'Scan Mandiri' : 'Input Guru'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 font-mono text-[11px] text-slate-600">
                      {formatWIBTime(act.waktu_penerimaan)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

