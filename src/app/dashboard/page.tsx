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
} from 'lucide-react';
import {
  getMonitoringOverview,
  subscribeToLiveUpdates,
  correctClassAttendance,
  syncMasterDataDapodik,
} from '@/lib/services';
import {
  OrganolepticTest,
  ClassMonitoringStatus,
  LiveActivityFeedItem,
} from '@/lib/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal, ModalInput, ModalActions } from '@/components/ui/ModalField';
import { Button, FeedbackBanner, useNotify } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function formatCurrentDateTime(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date
    .getFullYear()
    .toString()
    .slice(-2)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function DashboardPage() {
  const { user, role } = useAuth();
  const notify = useNotify();
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingMaster, setSyncingMaster] = useState(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

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

  useEffect(() => {
    const updateDateTime = () => setCurrentDateTime(formatCurrentDateTime(new Date()));

    updateDateTime();
    const intervalId = window.setInterval(updateDateTime, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const data = await getMonitoringOverview();
      setSession(data.session);
      setClasses(data.classes);
      setLiveActivities(data.liveActivities);
      setTotalTerserap(data.totalPorsiTerserap);
      setTotalSisa(data.totalPorsiSisa);
      setTotalSiswa(data.totalSiswaSemua);
      setPersenSelesai(data.persenSelesai);
    } catch (err) {
      console.error('Error loading monitoring overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Real-time subscription using Supabase Channel
    const unsubscribe = subscribeToLiveUpdates(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

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
      <div className="space-y-6 pb-20">
        {/* Top Page Header */}
      <PageHeader
        title="Live Monitoring Distribusi MBG (FR-4.1)"
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

      {actionBanner && (
        <FeedbackBanner
          type="success"
          message={actionBanner}
          onDismiss={() => setActionBanner(null)}
        />
      )}

      {/* Sesi MBG Alert Status Banner */}
      <div
        className={`rounded-2xl p-5 border shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 ${isTiba
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
              Trigger MBG Datang
            </Link>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="micro-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Sasaran</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-brand-navy">{totalSiswa}</p>
          <p className="text-[11px] text-slate-500 mt-1">Siswa terdaftar di Dapodik</p>
        </div>

        <div className="micro-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Porsi Terserap</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{totalTerserap}</p>
          <p className="text-[11px] text-slate-500 mt-1">{persenSelesai}% dari kuota harian</p>
        </div>

        <div className="micro-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sisa Porsi (Absen)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">{totalSisa}</p>
          <p className="text-[11px] text-slate-500 mt-1">Tersedia untuk klaim susulan</p>
        </div>

        <div className="micro-card rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Capaian Distribusi</span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600">{persenSelesai}%</p>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${persenSelesai}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Status Per Kelas (Left) & Live Activity Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Per Kelas (Tahap 2) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-brand-blue">
                <Layers className="h-4 w-4" />
              </div>
              <h2 className="text-base font-black text-slate-900">
                Status Per Kelas (Progress Bar & Sisa Porsi)
              </h2>
            </div>
            <Link
              href="/konfirmasi/kelas"
              className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1"
            >
              Lihat Roster
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {classes.map((cls) => {
              const isComplete = cls.jumlah_hadir >= cls.total_siswa && cls.total_siswa > 0;
              const hasStarted = cls.jumlah_hadir > 0;

              return (
                <div
                  key={cls.id_kelas}
                  className="micro-card rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${isComplete
                            ? 'bg-emerald-100 text-emerald-800'
                            : hasStarted
                              ? 'bg-blue-100 text-brand-blue'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {cls.tingkat}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{cls.nama_kelas}</h3>
                        <p className="text-[11px] text-slate-500">
                          Jurusan: <strong>{cls.jurusan}</strong> • Kuota: {cls.total_siswa} Siswa
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${isComplete
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : hasStarted
                              ? 'bg-blue-50 text-brand-blue border-blue-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                      >
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Selesai 100%
                          </span>
                        ) : hasStarted ? (
                          `${cls.jumlah_hadir} Terserap (${cls.jumlah_absen} Sisa)`
                        ) : (
                          'Belum Diambil'
                        )}
                      </span>

                      {canCorrectData && (
                        <button
                          type="button"
                          onClick={() => handleOpenCorrectionModal(cls)}
                          className="micro-tap inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200 transition"
                          title="Koreksi Data Pasca-Operasional (Kepala Sekolah / Super Admin)"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit Data
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-600 font-bold">
                      <span>Penyerapan: {cls.persen}%</span>
                      <span>
                        {cls.jumlah_hadir} / {cls.total_siswa} Porsi
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isComplete
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
                    <p className="text-[10px] text-slate-500 mt-2.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Waktu klaim terakhir:{' '}
                      {new Date(cls.waktu_terima).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      WIB
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Activity Feed Naratif (FR-4.1) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Activity className="h-4 w-4" />
              </div>
              <h2 className="text-base font-black text-slate-900">
                Live Activity Feed (FR-4.1)
              </h2>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Real-time
            </span>
          </div>

          <div className="micro-card rounded-2xl p-5 space-y-4 max-h-[580px] overflow-y-auto">
            {liveActivities.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {liveActivities.map((act) => (
                  <div key={act.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-blue border border-blue-100 shadow-sm">
                      <Utensils className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-brand-navy truncate">
                          {act.nama_kelas}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {act.waktu} WIB
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1 leading-snug">
                        {act.deskripsi}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${act.tipe === 'KOLEKTIF_KELAS'
                              ? 'bg-blue-50 text-brand-blue'
                              : act.tipe === 'SUSULAN'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                        >
                          {act.tipe === 'KOLEKTIF_KELAS' ? (
                            <>
                              <Users className="w-3 h-3" />
                              Perwakilan Kelas
                            </>
                          ) : act.tipe === 'SUSULAN' ? (
                            <>
                              <Clock className="w-3 h-3" />
                              Klaim Susulan
                            </>
                          ) : (
                            <>
                              <UserCheck className="w-3 h-3" />
                              Klaim Mandiri
                            </>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-600 font-medium inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Terverifikasi Anti-Fraud
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-700">Belum Ada Aktivitas Klaim</h3>
                  <p className="text-[11px] text-slate-600 mt-1 max-w-xs mx-auto">
                    Klaim dari perwakilan kelas atau siswa yang memindai Master QR / memasukkan PIN akan
                    langsung muncul di sini secara kronologis.
                  </p>
                </div>
              </div>
            )}
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
