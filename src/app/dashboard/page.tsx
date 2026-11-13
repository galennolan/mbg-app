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
  const [schoolsList, setSchoolsList] = useState<School[]>([SEED_SCHOOL]);
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
    schoolsList.find((s) => s.id === activeSchoolId) || SEED_SCHOOL;

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
      <div className="space-y-5 pb-8">
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

      {/* TAHAP 3 SAAS MULTI-TENANT: Global Dashboard & Switch School View (Super Admin Only) */}
      {isSuperAdmin && (
        <div className="rounded-3xl border border-slate-800 bg-brand-navy-dark text-white p-4 sm:p-5 shadow-elev-3 space-y-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-blue text-white flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
                <Building2 className="w-5 h-5 text-cyan-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2.5 py-0.5 rounded-full">
                    SaaS Multi-Tenant Control • Super Admin
                  </span>
                </div>
                <h2 className="text-base font-black text-white mt-1">
                  Global Overview Lintas Sekolah & Switch School View
                </h2>
                <p className="text-xs text-sky-200 mt-0.5">
                  Pantau serapan MBG nasional/regional dan beralih antar sekolah mitra tanpa perlu
                  keluar sesi.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 min-w-[290px]">
              <div className="flex-1 text-slate-900">
                <Select
                  label="Switch School View (Pilih Sekolah)"
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
                className="micro-tap min-h-[44px] px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition shrink-0"
              >
                <Building2 className="w-3.5 h-3.5 text-cyan-300" />
                Kelola Sekolah
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <span className="text-sky-300 font-bold block">Total Sekolah Mitra</span>
              <span className="text-xl font-black text-white mt-0.5 block">
                {globalStats.totalSekolahAktif} Sekolah
              </span>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <span className="text-sky-300 font-bold block">Total Rombel / Kelas</span>
              <span className="text-xl font-black text-cyan-300 mt-0.5 block">
                {globalStats.totalKelasLintasSekolah} Kelas
              </span>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <span className="text-sky-300 font-bold block">Total Kuota Siswa</span>
              <span className="text-xl font-black text-emerald-300 mt-0.5 block">
                {globalStats.totalSiswaLintasSekolah} Siswa
              </span>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3">
              <span className="text-sky-300 font-bold block">Terserap Lintas Sekolah</span>
              <span className="text-xl font-black text-amber-300 mt-0.5 block">
                {globalStats.totalPorsiTerserapGlobal} Porsi
              </span>
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

      {/* Sesi MBG Alert Status Banner */}
      <div
        className={`rounded-3xl p-4 sm:p-5 border shadow-elev-2 flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${isTiba
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : isDitolak
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${isTiba ? 'bg-emerald-600' : isDitolak ? 'bg-rose-600' : 'bg-amber-500'
              }`}
          >
            {isTiba ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isDitolak ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider">
                Status Operasional Hari Ini:
              </span>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${isTiba
                    ? 'bg-emerald-100 text-emerald-800'
                    : isDitolak
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
              >
                {isTiba
                  ? 'DISTRIBUSI AKTIF (LAYAK EDAR)'
                  : isDitolak
                    ? 'DISTRIBUSI DITUTUP / RETUR'
                    : 'MENUNGGU KEDATANGAN MBG'}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-1">
              {isTiba
                ? `Tiba jam ${session.jam_tiba} WIB • PIN Harian [${session.kode_pin_harian}] • Master QR siap dipindai oleh perwakilan siswa.`
                : isDitolak
                  ? 'Makanan ditandai tidak layak edar atau distribusi telah ditutup.'
                  : 'Pihak SPPG belum tiba di sekolah. Klik tombol "QC Kedatangan" untuk membuka sesi.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-2">
              <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-center shadow-sm">
                <span className="block text-[10px] text-slate-500 font-bold uppercase">PIN Harian</span>
                <span className="block text-sm font-black text-brand-navy font-mono">
                  {session.kode_pin_harian}
                </span>
              </div>
              <Link
                href="/kedatangan"
                className="micro-tap inline-flex items-center min-h-[44px] px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold border border-slate-200 shadow-sm transition"
              >
                Tampilkan QR
              </Link>
            </div>
          ) : (
            <Link
              href="/kedatangan"
              className="micro-tap inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Utensils className="w-3.5 h-3.5" />
              Lapor MBG Datang
            </Link>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="micro-card rounded-3xl p-5 border-surface-border bg-surface-card shadow-elev-1">
          <div className="flex items-center justify-between text-text-secondary mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider">Total Sasaran</span>
            <div className="w-10 h-10 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center border border-brand-blue/10">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-text-primary tracking-tight">{totalSiswa}</p>
          <p className="text-xs text-text-secondary mt-1 opacity-80 font-medium">Siswa terdaftar di Dapodik</p>
        </div>

        <div className="micro-card rounded-3xl p-5 border-surface-border bg-surface-card shadow-elev-1">
          <div className="flex items-center justify-between text-text-secondary mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider">Porsi Terserap</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center border border-emerald-500/10">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 tracking-tight">{totalTerserap}</p>
          <p className="text-xs text-text-secondary mt-1 opacity-80 font-medium">{persenSelesai}% dari kuota harian</p>
        </div>

        <div className="micro-card rounded-3xl p-5 border-surface-border bg-surface-card shadow-elev-1">
          <div className="flex items-center justify-between text-text-secondary mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider">Sisa Porsi (Absen)</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-500/10">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-amber-600 tracking-tight">{totalSisa}</p>
          <p className="text-xs text-text-secondary mt-1 opacity-80 font-medium">Tersedia untuk klaim susulan</p>
        </div>

        <div className="micro-card rounded-3xl p-5 border-surface-border bg-surface-card shadow-elev-1">
          <div className="flex items-center justify-between text-text-secondary mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider">Capaian Distribusi</span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center border border-purple-500/10">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-purple-600 tracking-tight">{persenSelesai}%</p>
          <div className="w-full bg-surface-canvas rounded-full h-2 mt-3 overflow-hidden border border-surface-border/50">
            <div
              className="bg-purple-600 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${persenSelesai}%` }}
            />
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
        {/* Status Per Kelas (Tahap 2) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue border border-brand-blue/10">
                <Layers className="h-4.5 w-4.5" />
              </div>
              <h2 className="text-sm font-black text-text-primary uppercase tracking-tight">
                Status Per Kelas
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

          <div className="grid grid-cols-1 gap-4">
            {classes.map((cls) => {
              const isComplete = cls.jumlah_hadir >= cls.total_siswa && cls.total_siswa > 0;
              const hasStarted = cls.jumlah_hadir > 0;

              return (
                <div
                  key={cls.id_kelas}
                  className="micro-card rounded-3xl p-5 border-surface-border bg-surface-card shadow-elev-1 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 border shadow-sm ${isComplete
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : hasStarted
                              ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                              : 'bg-surface-canvas text-text-secondary border-surface-border'
                          }`}
                      >
                        {cls.tingkat}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-text-primary leading-tight truncate">{cls.nama_kelas}</h3>
                        <p className="text-[11px] text-text-secondary mt-1 font-medium truncate">
                          Jurusan: <span className="text-text-primary font-bold">{cls.jurusan}</span> • {cls.total_siswa} Siswa
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-black px-3 py-1.5 rounded-xl border tracking-wide uppercase ${isComplete
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : hasStarted
                              ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                              : 'bg-surface-canvas text-text-secondary border-surface-border'
                          }`}
                      >
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            SELESAI 100%
                          </span>
                        ) : hasStarted ? (
                          `${cls.jumlah_hadir} TERKLAIM • ${cls.jumlah_absen} SISA`
                        ) : (
                          'BELUM DIAMBIL'
                        )}
                      </span>

                      {canCorrectData && (
                        <button
                          type="button"
                          onClick={() => handleOpenCorrectionModal(cls)}
                          className="micro-tap inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 text-[10px] font-black border border-purple-500/20 transition uppercase tracking-wide"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Koreksi
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Container */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-text-secondary opacity-80">
                      <span>Progres Penyerapan: {cls.persen}%</span>
                      <span className="text-text-primary">
                        {cls.jumlah_hadir} / {cls.total_siswa} PORSI
                      </span>
                    </div>
                    <div className="w-full bg-surface-canvas rounded-full h-3.5 overflow-hidden p-0.5 border border-surface-border/50">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-in-out ${isComplete
                            ? 'bg-emerald-500'
                            : cls.persen > 50
                              ? 'bg-brand-blue'
                              : 'bg-blue-400'
                          }`}
                        style={{ width: `${cls.persen}%` }}
                      />
                    </div>
                  </div>

                  {cls.waktu_terima && (
                    <div className="mt-4 pt-3 border-t border-surface-border/30 flex items-center justify-between">
                      <div className="text-[10px] text-text-secondary font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-secondary/60" />
                        <span>Klaim terakhir: <strong>{new Date(cls.waktu_terima).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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
              placeholder="Contoh: Koreksi selisih input presensi oleh Guru Piket"
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
