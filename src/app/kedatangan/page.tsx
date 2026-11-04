'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  RotateCw,
  FileText,
  School,
} from 'lucide-react';
import {
  ensureTodayDistribution,
  markMBGArrival,
  closeTodayDistribution,
} from '@/lib/services';
import { DistribusiMBG } from '@/lib/types';
import { formatWIBTime, formatIndonesianDate, getJakartaDateString } from '@/lib/utils';

export default function KedatanganMBGPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [distribusi, setDistribusi] = useState<DistribusiMBG | null>(null);

  // Form states
  const [waktuAktual, setWaktuAktual] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Close distribution confirmation modal
  const [showCloseModal, setShowCloseModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const dist = await ensureTodayDistribution(user?.id);
      setDistribusi(dist);
      if (dist.waktu_kedatangan) {
        // extract HH:mm for default
        const d = new Date(dist.waktu_kedatangan);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        setWaktuAktual(`${hh}:${mm}`);
      } else {
        // current time HH:mm
        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        setWaktuAktual(`${hh}:${mm}`);
      }
      if (dist.keterangan) {
        setKeterangan(dist.keterangan);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat status distribusi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSimpanKedatangan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!distribusi) return;
    if (!waktuAktual) {
      setErrorMsg('Waktu kedatangan aktual wajib diisi');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // Build ISO string using today's date and the inputted HH:mm
      const today = getJakartaDateString();
      const [h, m] = waktuAktual.split(':');
      // Create local date object
      const dateObj = new Date();
      dateObj.setHours(parseInt(h, 10));
      dateObj.setMinutes(parseInt(m, 10));
      dateObj.setSeconds(0);

      const updated = await markMBGArrival({
        distribusiId: distribusi.id,
        waktuKedatangan: dateObj.toISOString(),
        keterangan: keterangan.trim(),
        petugasId: user?.id || '00000000-0000-0000-0000-000000000000',
      });

      setDistribusi(updated);
      setSuccessMsg('Kedatangan MBG berhasil dicatat! Portal siswa kini telah aktif.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan kedatangan MBG');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTutupDistribusi = async () => {
    if (!distribusi) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const updated = await closeTodayDistribution(
        distribusi.id,
        user?.id || '00000000-0000-0000-0000-000000000000'
      );
      setDistribusi(updated);
      setShowCloseModal(false);
      setSuccessMsg('Distribusi MBG hari ini telah resmi ditutup.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menutup distribusi');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Memuat data distribusi...</p>
      </div>
    );
  }

  const isTiba = distribusi?.status === 'tiba';
  const isDitutup = distribusi?.status === 'ditutup';
  const isMenunggu = !distribusi || distribusi.status === 'menunggu';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-brand-blue rounded-full text-xs font-semibold mb-2">
          <Truck className="w-3.5 h-3.5" />
          Operasional Distribusi
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
          Pencatatan Kedatangan MBG
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Catat waktu aktual tibanya makanan di sekolah untuk membuka akses konfirmasi siswa
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Status & Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Status Top Strip */}
        <div
          className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isTiba
              ? 'bg-emerald-50/50 border-emerald-100'
              : isDitutup
              ? 'bg-slate-100 border-slate-200'
              : 'bg-amber-50/50 border-amber-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                isTiba
                  ? 'bg-emerald-500 text-white'
                  : isDitutup
                  ? 'bg-slate-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tanggal: {formatIndonesianDate(distribusi?.tanggal || getJakartaDateString())}
              </div>
              <div className="text-lg font-black text-slate-900 capitalize">
                Status: {distribusi?.status}
              </div>
            </div>
          </div>

          <div>
            <span
              className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                isTiba
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isDitutup
                  ? 'bg-slate-200 text-slate-800 border border-slate-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {isTiba && '✓ Makanan Sudah Tiba'}
              {isMenunggu && '⏳ Belum Tiba'}
              {isDitutup && '🔒 Distribusi Ditutup'}
            </span>
          </div>
        </div>

        {/* Input Form */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSimpanKedatangan} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Waktu Kedatangan Aktual (BR-04) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Waktu Kedatangan Aktual (WIB)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <input
                    type="time"
                    required
                    disabled={isDitutup}
                    value={waktuAktual}
                    onChange={(e) => setWaktuAktual(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Bila Anda terlambat menginput, masukkan jam aktual saat kurir/katering tiba di sekolah.
                </p>
              </div>

              {/* Petugas Pencatat */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Petugas Penanggung Jawab
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    disabled
                    value={user?.nama || 'Petugas'}
                    className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Identitas akun Anda akan disimpan sebagai bukti pencatatan resmi.
                </p>
              </div>
            </div>

            {/* Keterangan / Catatan Tambahan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Catatan / Keterangan (Opsional)
              </label>
              <textarea
                rows={3}
                disabled={isDitutup}
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Makanan diantar oleh CV Berkah Pangan, 320 box kondisi hangat dan lengkap."
                className="w-full p-3.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-60"
              />
            </div>

            {/* Detail Snapshot jika sudah pernah dicatat */}
            {distribusi?.waktu_input && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <div className="font-semibold text-slate-800 mb-1">Riwayat Pencatatan Server:</div>
                <div className="flex justify-between">
                  <span>Waktu Input Server:</span>
                  <span className="font-mono font-bold">{formatWIBTime(distribusi.waktu_input)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu Kedatangan Aktual:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatWIBTime(distribusi.waktu_kedatangan)}
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {!isDitutup && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto flex-1 py-3.5 px-6 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {isTiba ? 'Perbarui Data Kedatangan' : 'Simpan Status MBG Sudah Tiba'}
                    </>
                  )}
                </button>
              )}

              {isTiba && !isDitutup && (
                <button
                  type="button"
                  onClick={() => setShowCloseModal(true)}
                  disabled={submitting}
                  className="w-full sm:w-auto py-3.5 px-6 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  Tutup Distribusi Hari Ini
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* MODAL KONFIRMASI TUTUP DISTRIBUSI (BR-09, Section 3.7) */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 text-center border border-slate-100">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Tutup Distribusi MBG Hari Ini?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              Setelah ditutup, siswa dan guru tidak dapat lagi menambahkan transaksi penerimaan baru.
              Koreksi data lanjutan hanya dapat dilakukan oleh administrator melalui audit log.
            </p>

            <div className="flex gap-2.5">
              <button
                onClick={() => setShowCloseModal(false)}
                disabled={submitting}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition"
              >
                Batal
              </button>
              <button
                onClick={handleTutupDistribusi}
                disabled={submitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs sm:text-sm transition"
              >
                {submitting ? 'Menutup...' : 'Ya, Tutup Distribusi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

