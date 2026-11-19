'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  ShieldCheck,
  UserCheck,
  Utensils,
  Activity,
  Layers,
  Edit2,
  Database,
  Building2,
} from 'lucide-react';
import {
  getMonitoringOverview,
  subscribeToLiveUpdates,
  correctClassAttendance,
  syncMasterDataDapodik,
  getAllSchools,
  getGlobalMultiSchoolStats,
  SEED_SCHOOL,
} from '@/lib/services';
import {
  School,
  OrganolepticTest,
  ClassMonitoringStatus,
  LiveActivityFeedItem,
  DepartmentAbsorptionStats,
  GradeLevelAbsorptionStats,
  PeakHourBucket,
  OmprengHealthStats,
} from '@/lib/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal, ModalInput, ModalActions } from '@/components/ui/ModalField';
import { Button, Select, FeedbackBanner, useNotify } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';

function formatCurrentDateTime(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date
    .getFullYear()
    .toString()
    .slice(-2)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function DashboardPage() {
  const { user, role, activeSchoolId, setActiveSchoolId } = useAuth();
  const notify = useNotify();
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingMaster, setSyncingMaster] = useState(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  // Tahap 3: Multi-Tenant Global Overview & Switch School View State (Super Admin)
  const [schoolsList, setSchoolsList] = useState<School[]>([]);
  const [globalStats, setGlobalStats] = useState({
    totalSekolahAktif: 4,
    totalKelasLintasSekolah: 7,
    totalSiswaLintasSekolah: 193,
    totalPorsiTerserapGlobal: 0,
  });

  // Tahap 4: Correction Mode State (Kepala Sekolah & Super Admin)
  const canCorrectData =
    role === 'kepala_sekolah' || role === 'super_admin' || role === 'admin';
  const isSuperAdmin = role === 'super_admin' || role === 'admin';

  const [editingClass, setEditingClass] = useState<ClassMonitoringStatus | null>(null);
  const [corrHadir, setCorrHadir] = useState(0);
  const [corrAbsen, setCorrAbsen] = useState(0);
  const [corrReason, setCorrReason] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  const [session, setSession] = useState<OrganolepticTest | null>(null);
  const [classes, setClasses] = useState<ClassMonitoringStatus[]>([]);
  const [liveActivities, setLiveActivities] = useState<LiveActivityFeedItem[]>([]);
  const [totalTerserap, setTotalTerserap] = useState(0);
  const [totalSisa, setTotalSisa] = useState(0);
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [persenSelesai, setPersenSelesai] = useState(0);

  // Chart Data States
  const [deptStats, setDeptStats] = useState<DepartmentAbsorptionStats[]>([]);
  const [gradeStats, setGradeStats] = useState<GradeLevelAbsorptionStats[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHourBucket[]>([]);
  const [omprengStats, setOmprengStats] = useState<OmprengHealthStats>({
    utuh: 0,
    rusak: 0,
    hilang: 0,
    totalKembali: 0,
    hasReturned: false,
  });

  useEffect(() => {
    const updateDateTime = () => setCurrentDateTime(formatCurrentDateTime(new Date()));

    updateDateTime();
    const intervalId = window.setInterval(updateDateTime, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [data, allSchools, gStats] = await Promise.all([
        getMonitoringOverview(activeSchoolId),
        getAllSchools(),
        getGlobalMultiSchoolStats(),
      ]);
      setSession(data.session);
      setClasses(data.classes);
      setLiveActivities(data.liveActivities);
      setTotalTerserap(data.totalPorsiTerserap);
      setTotalSisa(data.totalPorsiSisa);
      setTotalSiswa(data.totalSiswaSemua);
      setPersenSelesai(data.persenSelesai);
      setDeptStats(data.deptStats || []);
      setGradeStats(data.gradeStats || []);
      setPeakHours(data.peakHours || []);
      setOmprengStats(
        data.omprengStats || {
          utuh: 0,
          rusak: 0,
          hilang: 0,
          totalKembali: 0,
          hasReturned: false,
        }
      );
      setSchoolsList(allSchools);
      if (allSchools.length > 0 && !allSchools.some((s) => s.id === activeSchoolId)) {
        setActiveSchoolId(allSchools[0].id);
      }
      setGlobalStats({
        totalSekolahAktif: gStats.totalSekolahAktif,
        totalKelasLintasSekolah: gStats.totalKelasLintasSekolah,
        totalSiswaLintasSekolah: gStats.totalSiswaLintasSekolah,
        totalPorsiTerserapGlobal: gStats.totalPorsiTerserapGlobal,
      });
    } catch (err) {
      console.error('Error loading monitoring overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeSchoolId]);

  useEffect(() => {
    loadData();
    // Real-time subscription using Supabase Channel
    const unsubscribe = subscribeToLiveUpdates(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  const currentSchool =
    schoolsList.find((s) => s.id === activeSchoolId) || schoolsList[0] || SEED_SCHOOL;

  const isTiba = session && session.kesimpulan === 'LAYAK_EDAR';
  const isDitolak = session && session.kesimpulan === 'TOLAK_RETUR';

  const handleOpenCorrectionModal = (cls: ClassMonitoringStatus) => {
    setEditingClass(cls);
    setCorrHadir(cls.jumlah_hadir);
    setCorrAbsen(Math.max(0, cls.total_siswa - cls.jumlah_hadir));
    setCorrReason('Koreksi selisih input presensi pasca-operasional');
  };

  const handleSaveCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClass) return;
    setSubmittingCorrection(true);
    try {
      const res = await correctClassAttendance({
        idKelas: editingClass.id_kelas,
        namaKelas: editingClass.nama_kelas,
        totalSiswa: editingClass.total_siswa,
        jumlahHadirBaru: corrHadir,
        jumlahAbsenBaru: corrAbsen,
        alasanKoreksi: corrReason,
        penggunaId: user?.id,
        namaPengguna: user?.nama || 'Kepala Sekolah',
      });
      setEditingClass(null);
      setActionBanner(res.message);
      notify.success('Koreksi Tersimpan', res.message);
      await loadData();
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const handleSyncMaster = async () => {
    setSyncingMaster(true);
    try {
      const res = await syncMasterDataDapodik(user?.id);
      const msg = `Sync Master Data Dapodik Selesai: ${res.totalKelas} Kelas & ${res.totalSiswa} Siswa telah disinkronkan.`;
      setActionBanner(msg);
      notify.fire({
        icon: 'success',
        title: 'Sinkronisasi Dapodik Berhasil',
        text: msg,
        badgeText: 'SYNC DAPODIK',
      });
      await loadData();
    } finally {
      setSyncingMaster(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru']}>
      <div className="space-y-6 pb-16">
      {/* Top Page Header */}
      <PageHeader
        title="Live Monitoring Distribusi MBG (FR-4.1)"
        subtitle={`${currentSchool.nama_sekolah} •NPSN: ${currentSchool.npsn} • Mitra: ${
          currentSchool.nama_sppg_mitra || 'SPPG Mitra'
        }`}
        badgeText={currentDateTime}
      >
        <div className="flex flex-wrap items-center gap-2">
          {isSuperAdmin && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSyncMaster}
              loading={syncingMaster}
              leftIcon={<Database className="w-3.5 h-3.5 text-amber-700" />}
            >
              {syncingMaster ? 'Syncing Dapodik...' : 'Sync Master Data'}
            </Button>
          )}

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              loadData();
            }}
            loading={refreshing}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Perbarui
          </Button>

          <Link
            href="/kedatangan"
            className="micro-tap inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Truck className="w-3.5 h-3.5" />
            QC Kedatangan
          </Link>
        </div>
      </PageHeader>

      {/* TAHAP 3 SAAS MULTI-TENANT: Compact Bar & Switch School View (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="rounded-2xl border border-sky-300/25 bg-gradient-to-r from-[#082552] via-[#0D3B7A] to-[#1565C0] text-white p-3.5 sm:p-4 shadow-elev-2">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-sky-200 flex items-center justify-center shrink-0 border border-sky-300/25">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-black text-white truncate">
                    Multi-Tenant Sekolah Mitra
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-400/20 text-sky-100 border border-sky-300/30 px-2 py-0.5 rounded-md">
                    {globalStats.totalSekolahAktif} Sekolah • {globalStats.totalKelasLintasSekolah} Kelas • {globalStats.totalSiswaLintasSekolah} Siswa
                  </span>
                </div>
                <p className="text-[11px] text-sky-200/85 mt-0.5 truncate">
                  Serapan Lintas Sekolah: <strong className="text-white">{globalStats.totalPorsiTerserapGlobal} Porsi</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-[260px]">
              <div className="flex-1 text-slate-900">
                <Select
                  value={activeSchoolId}
                  onValueChange={(val) => {
                    setActiveSchoolId(val);
                    const picked = schoolsList.find((s) => s.id === val);
                    if (picked) {
                      notify.info(
                        'Beralih Sekolah',
                        `Menampilkan dashboard operasional ${picked.nama_sekolah}.`
                      );
                    }
                  }}
                  options={schoolsList.map((s) => ({
                    value: s.id,
                    label: `${s.nama_sekolah} (${s.npsn})`,
                  }))}
                />
              </div>

              <Link
                href="/admin/sekolah"
                className="micro-tap min-h-[42px] px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition shrink-0"
              >
                <Building2 className="w-3.5 h-3.5 text-sky-200" />
                Kelola
              </Link>
            </div>
          </div>
        </div>
      )}

      {actionBanner && (
        <FeedbackBanner
          type="success"
          message={actionBanner}
          onDismiss={() => setActionBanner(null)}
        />
      )}

      {/* Ringkasan Utama: 2 Simple & Ringkas Cards (Status Sesi + Ringkasan Serapan Terpadu) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Card 1: Status Operasional & PIN Harian (5 Col) */}
        <div
          className={`lg:col-span-5 rounded-2xl p-4 border shadow-elev-1 flex flex-col justify-between gap-3 ${
            isTiba
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : isDitolak
                ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                : 'bg-amber-50/90 border-amber-200 text-amber-950'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${
                isTiba ? 'bg-emerald-600' : isDitolak ? 'bg-rose-600' : 'bg-amber-500'
              }`}
            >
              {isTiba ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isDitolak ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    isTiba
                      ? 'bg-emerald-100 text-emerald-800'
                      : isDitolak
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {isTiba
                    ? 'Distribusi Aktif'
                    : isDitolak
                      ? 'Distribusi Ditutup'
                      : 'Menunggu Kedatangan'}
                </span>
                {session && (
                  <span className="text-[11px] font-mono font-bold bg-white/90 border border-slate-200 px-2 py-0.5 rounded-md text-brand-navy">
                    PIN: {session.kode_pin_harian}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                {isTiba
                  ? `Tiba pukul ${session.jam_tiba} WIB • Master QR siap dipindai perwakilan kelas.`
                  : isDitolak
                    ? 'Makanan ditandai tidak layak edar atau sesi telah ditutup.'
                    : 'SPPG belum tercatat tiba. Buka QC Kedatangan untuk memulai sesi.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
            {session ? (
              <Link
                href="/kedatangan"
                className="micro-tap inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-sm transition"
              >
                Tampilkan Master QR
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/kedatangan"
                className="micro-tap inline-flex items-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#1E88E5] text-white text-xs font-bold shadow-sm transition"
              >
                <Utensils className="w-3.5 h-3.5" />
                Lapor MBG Datang
              </Link>
            )}
          </div>
        </div>

        {/* Card 2: Ringkasan Serapan Terpadu (7 Col - Menggabungkan Sasaran, Terserap, Sisa & Capaian dalam 1 Card Ringkas) */}
        <div className="lg:col-span-7 micro-card rounded-2xl p-4 border-surface-border bg-surface-card shadow-elev-1 flex flex-col justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-text-secondary">
                Ringkasan Distribusi Hari Ini
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-brand-blue tabular-nums">
                  {persenSelesai}%
                </span>
                <span className="text-xs font-semibold text-text-secondary">
                  ({totalTerserap} dari {totalSiswa} porsi terserap)
                </span>
              </div>
            </div>

            {/* 3 Compact Pill Metrics */}
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              <div className="rounded-xl bg-brand-blue-50/70 border border-brand-blue-100 px-3 py-2 text-center">
                <span className="block text-[10px] font-bold uppercase text-brand-blue-700">
                  Sasaran
                </span>
                <span className="block text-sm sm:text-base font-black text-brand-navy tabular-nums">
                  {totalSiswa}
                </span>
              </div>
              <div className="rounded-xl bg-emerald-50 border border-emerald-200/70 px-3 py-2 text-center">
                <span className="block text-[10px] font-bold uppercase text-emerald-700">
                  Terserap
                </span>
                <span className="block text-sm sm:text-base font-black text-emerald-700 tabular-nums">
                  {totalTerserap}
                </span>
              </div>
              <div className="rounded-xl bg-amber-50 border border-amber-200/70 px-3 py-2 text-center">
                <span className="block text-[10px] font-bold uppercase text-amber-700">
                  Sisa
                </span>
                <span className="block text-sm sm:text-base font-black text-amber-700 tabular-nums">
                  {totalSisa}
                </span>
              </div>
            </div>
          </div>

          {/* Unified Progress Bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-surface-canvas rounded-full h-2.5 overflow-hidden border border-surface-border/60">
              <div
                className="bg-gradient-to-r from-[#0D47A1] via-[#1565C0] to-[#1E88E5] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(100, persenSelesai)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-text-secondary font-medium">
              <span>Target Kuota Dapodik: {totalSiswa} Siswa</span>
              <span>Sisa Klaim Susulan: {totalSisa} Porsi</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODUL GRAFIK MONITOR: Donut Gauge, Bar Komparatif, Peak Hours Histogram, Mini Health Bar */}
      <DashboardCharts
        totalTerserap={totalTerserap}
        totalSisa={totalSisa}
        totalSiswa={totalSiswa}
        persenSelesai={persenSelesai}
        deptStats={deptStats}
        gradeStats={gradeStats}
        peakHours={peakHours}
        omprengStats={omprengStats}
      />

      {/* Main Grid: Status Per Kelas (Left) & Live Activity Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Per Kelas (Tahap 2 - Compact & Simple List Container) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue border border-brand-blue/10">
                <Layers className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Status Per Kelas ({classes.length})
              </h2>
            </div>
            <Link
              href="/konfirmasi/kelas"
              className="text-[11px] font-black text-brand-blue hover:text-brand-blue-700 transition flex items-center gap-1.5 bg-brand-blue/5 px-3 py-1.5 rounded-lg border border-brand-blue/10"
            >
              LIHAT ROSTER
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="micro-card rounded-2xl border-surface-border bg-surface-card shadow-elev-1 overflow-hidden flex flex-col max-h-[580px]">
            <div className="flex-1 overflow-y-auto divide-y divide-surface-border/60 scrollbar-thin">
              {classes.map((cls) => {
                const isComplete = cls.jumlah_hadir >= cls.total_siswa && cls.total_siswa > 0;
                const hasStarted = cls.jumlah_hadir > 0;

                return (
                  <div
                    key={cls.id_kelas}
                    className="p-3.5 sm:px-4 hover:bg-surface-canvas/60 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border ${
                            isComplete
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : hasStarted
                                ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                                : 'bg-surface-canvas text-text-secondary border-surface-border'
                          }`}
                        >
                          {cls.tingkat}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-black text-text-primary truncate">
                              {cls.nama_kelas}
                            </h3>
                            <span className="inline-flex items-center rounded bg-brand-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-blue border border-brand-blue-100">
                              {cls.jurusan}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-secondary mt-0.5 font-medium">
                            <strong className="text-text-primary tabular-nums">
                              {cls.jumlah_hadir}/{cls.total_siswa}
                            </strong>{' '}
                            Porsi ({cls.persen}%)
                            {cls.waktu_terima && (
                              <span className="ml-1.5 text-text-secondary/75">
                                •{' '}
                                {new Date(cls.waktu_terima).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                WIB
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border tracking-wide uppercase ${
                            isComplete
                              ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20'
                              : hasStarted
                                ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                                : 'bg-surface-canvas text-text-secondary border-surface-border'
                          }`}
                        >
                          {isComplete
                            ? 'Selesai'
                            : hasStarted
                              ? `${cls.jumlah_absen} Sisa`
                              : 'Menunggu'}
                        </span>

                        {canCorrectData && (
                          <button
                            type="button"
                            onClick={() => handleOpenCorrectionModal(cls)}
                            className="micro-tap inline-flex items-center gap-1 min-h-[30px] px-2.5 py-1 rounded-lg bg-brand-blue-50 hover:bg-brand-blue-100 text-brand-blue-700 text-[10px] font-extrabold border border-brand-blue-200 transition uppercase"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span className="hidden xs:inline">Koreksi</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Slim Progress Bar */}
                    <div className="w-full bg-surface-canvas rounded-full h-1.5 mt-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete
                            ? 'bg-emerald-500'
                            : cls.persen > 50
                              ? 'bg-brand-blue'
                              : 'bg-blue-400'
                        }`}
                        style={{ width: `${cls.persen}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Activity Feed (Right) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2.5 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
              <Activity className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <h2 className="text-sm font-black text-text-primary uppercase tracking-tight">
              Aktivitas Terkini (Real-time)
            </h2>
          </div>

          <div className="micro-card rounded-3xl border-surface-border bg-surface-card shadow-elev-2 overflow-hidden flex flex-col h-[600px]">
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {liveActivities.length > 0 ? (
                <div className="space-y-2 p-2">
                  {liveActivities.map((act) => (
                    <div
                      key={act.id}
                      className="group p-4 rounded-2xl border border-surface-border/50 bg-surface-canvas/50 hover:bg-surface-canvas hover:border-brand-blue/20 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0">
                          <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center border border-brand-blue/10">
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-surface-card border border-surface-border flex items-center justify-center shadow-sm">
                            <span className="text-[9px] font-black text-brand-blue">
                              {act.tipe === 'KOLEKTIF_KELAS' ? 'K' : 'I'}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] font-black text-brand-blue/80 bg-brand-blue/5 px-2 py-0.5 rounded-lg border border-brand-blue/10 truncate">
                              {act.nama_kelas}
                            </span>
                            <span className="text-[10px] font-bold text-text-secondary opacity-60 tabular-nums">
                              {act.waktu}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-text-primary leading-snug">
                            {act.deskripsi}
                          </p>
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${act.tipe === 'KOLEKTIF_KELAS'
                                ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20'
                                : 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20'
                              }`}>
                              {act.tipe === 'KOLEKTIF_KELAS' ? 'Kolektif Kelas' : 'Individu Siswa'}
                            </span>
                            <span className="text-[10px] text-text-secondary font-bold inline-flex items-center gap-1.5 opacity-60">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              VERIFIKASI QR
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                  <RotateCw className="w-12 h-12 mb-4 animate-spin-slow text-text-secondary" />
                  <p className="text-sm font-bold text-text-secondary">Menunggu aktivitas masuk...</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-surface-canvas/30 border-t border-surface-border/50 text-center">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.15em] opacity-50">
                Pencatatan Otomatis via Blockchain-Node
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tahap 4 RBAC: Modal Koreksi Data Pasca-Operasional (Kepala Sekolah / Super Admin) */}
      <Modal
        isOpen={!!editingClass}
        onClose={() => setEditingClass(null)}
        title={`Koreksi Data Kelas ${editingClass?.nama_kelas || ''}`}
        description="Hak koreksi pasca-operasional Kepala Sekolah. Setiap perubahan otomatis dicatat ke Audit Log (CORRECTION_BY_KEPSEK)."
        size="sm"
      >
        {editingClass && (
          <form onSubmit={handleSaveCorrection} className="space-y-4">
            <div className="rounded-xl bg-purple-50 border border-purple-200 p-3 text-xs text-purple-900">
              Total Kuota Dapodik Kelas <strong>{editingClass.nama_kelas}</strong>:{' '}
              <strong>{editingClass.total_siswa} Siswa</strong>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ModalInput
                label="Jumlah Hadir (Ambil)"
                type="number"
                min={0}
                max={editingClass.total_siswa}
                required
                value={String(corrHadir)}
                onChange={(e) => {
                  const val = Math.max(
                    0,
                    Math.min(editingClass.total_siswa, Number(e.target.value) || 0)
                  );
                  setCorrHadir(val);
                  setCorrAbsen(Math.max(0, editingClass.total_siswa - val));
                }}
              />

              <ModalInput
                label="Jumlah Absen (Sisa)"
                type="number"
                min={0}
                max={editingClass.total_siswa}
                required
                value={String(corrAbsen)}
                onChange={(e) =>
                  setCorrAbsen(Math.max(0, Number(e.target.value) || 0))
                }
              />
            </div>

            <ModalInput
              label="Alasan / Catatan Koreksi"
              required
              value={corrReason}
              onChange={(e) => setCorrReason(e.target.value)}
              placeholder="Contoh: Koreksi selisih input presensi oleh Guru PIC MBG"
            />

            <ModalActions
              onCancel={() => setEditingClass(null)}
              submitLabel="Simpan Koreksi & Catat Audit"
              submitting={submittingCorrection}
            />
          </form>
        )}
      </Modal>
      </div>
    </ProtectedRoute>
  );
}
