'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { QRCodeSVG } from 'qrcode.react';
import {
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  UserCheck,
  RotateCw,
  QrCode,
  Copy,
  Check,
  Maximize2,
  Sparkles,
  Camera,
  Share2,
  Eye,
  ShieldAlert,
  ArrowRight,
  Bell,
} from 'lucide-react';
import {
  getTodayOrganolepticSession,
  triggerMBGArrivalSession,
  updateOrganolepticQC,
  SEED_SCHOOL,
} from '@/lib/services';
import { OrganolepticTest, OrganolepticKesimpulan, School } from '@/lib/types';
import { formatIndonesianDate, getJakartaDateString } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';
import { PageHeader } from '@/components/ui/PageHeader';
import { QualityCheckCard } from '@/components/operasional/QualityCheckCard';
import { Modal, ModalActions } from '@/components/ui/ModalField';

export default function KedatanganMBGPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<OrganolepticTest | null>(null);
  const [school, setSchool] = useState<School | null>(SEED_SCHOOL as unknown as School);

  // Form states
  const [waktuAktual, setWaktuAktual] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [statusKetepatan, setStatusKetepatan] = useState<'TEPAT_WAKTU' | 'TERLAMBAT'>('TEPAT_WAKTU');
  const [keterangan, setKeterangan] = useState('');
  const [kesimpulan, setKesimpulan] = useState<OrganolepticKesimpulan>('LAYAK_EDAR');
  const [isSampelDisimpan, setIsSampelDisimpan] = useState(true);
  const [statusAroma, setStatusAroma] = useState('Harum Segar (SOP)');
  const [statusRasa, setStatusRasa] = useState('Gurih Sesuai Standar');
  const [statusTekstur, setStatusTekstur] = useState('Matang Sempurna & Renyah');
  const [statusWadah, setStatusWadah] = useState('Bersih, Rapat & Higienis');
  const [fotoSampelUrl, setFotoSampelUrl] = useState<string | null>(null);

  // UI helpers
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [baseOrigin, setBaseOrigin] = useState('');
  const [qrFullscreen, setQrFullscreen] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const sess = await getTodayOrganolepticSession();
      setSession(sess);

      // Fetch school info
      if (user?.id) {
        const { data: profile } = await supabase
          .from('pengguna')
          .select('id_sekolah, schools(*)')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.schools) {
          const sch = Array.isArray(profile.schools) ? profile.schools[0] : profile.schools;
          if (sch) setSchool(sch as unknown as School);
          else setSchool(SEED_SCHOOL as any);
        } else {
          setSchool(SEED_SCHOOL as any);
        }
      } else {
        setSchool(SEED_SCHOOL as any);
      }

      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentHhMm = `${hh}:${mm}`;

      if (sess) {
        setWaktuAktual((sess.jam_tiba || currentHhMm).slice(0, 5));
        setKesimpulan(sess.kesimpulan || 'LAYAK_EDAR');
        setStatusKetepatan(sess.status_ketepatan || 'TEPAT_WAKTU');
        setIsSampelDisimpan(sess.is_sampel_disimpan ?? true);
        setStatusAroma(sess.status_aroma || 'Harum Segar (SOP)');
        setStatusRasa(sess.status_rasa || 'Gurih Sesuai Standar');
        setStatusTekstur(sess.status_tekstur || 'Matang Sempurna & Renyah');
        setStatusWadah(sess.status_wadah || 'Bersih, Rapat & Higienis');
        setFotoSampelUrl(sess.foto_sampel_url || null);
        if (sess.catatan_kelayakan) setKeterangan(sess.catatan_kelayakan);
      } else {
        setWaktuAktual(currentHhMm);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat sesi kedatangan MBG');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseOrigin(window.location.origin);
    }
    loadData();
  }, []);

  const handleTriggerMBGDatang = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const now = new Date();
    const fallbackHhMm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const effectiveJamTiba = (waktuAktual || fallbackHhMm).slice(0, 5);

    if (kesimpulan === 'LAYAK_EDAR' && !isSampelDisimpan) {
      setErrorMsg('SOP Keamanan Pangan: Harap centang konfirmasi penyimpanan 1 porsi sampel!');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const newSess = await triggerMBGArrivalSession({
        jamTiba: effectiveJamTiba,
        statusKetepatan: statusKetepatan,
        kesimpulan: kesimpulan,
        statusAroma: statusAroma,
        statusRasa: statusRasa,
        statusTekstur: statusTekstur,
        statusWadah: statusWadah,
        fotoSampelUrl: fotoSampelUrl,
        isSampelDisimpan: isSampelDisimpan,
        catatan: keterangan.trim(),
        idSekolah: school?.id || user?.id_sekolah || SEED_SCHOOL.id,
        guruPiketId: user?.id,
      });

      setSession(newSess);
      setSuccessMsg(
        `MBG Datang berhasil dicatat! Master QR (${newSess.master_qr_token}) & PIN (${newSess.kode_pin_harian}) telah aktif.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mencatat kedatangan MBG.');
    } finally {
      setSubmitting(false);
    }
  };

  const qrDeepLinkUrl = session
    ? `${(baseOrigin || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '')}/?token=${encodeURIComponent(session.master_qr_token)}`
    : '';

  const handleCopyPin = () => {
    if (session?.kode_pin_harian) {
      navigator.clipboard.writeText(session.kode_pin_harian);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleCopyQrLink = () => {
    if (qrDeepLinkUrl) {
      navigator.clipboard.writeText(qrDeepLinkUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCloseSession = async () => {
    if (!session) return;
    setSubmitting(true);
    try {
      const updated = await updateOrganolepticQC(session, {
        kesimpulan: 'TOLAK_RETUR',
        catatan_kejadian_khusus: 'Distribusi ditutup oleh Guru Piket',
      });
      setSession(updated);
      setShowCloseModal(false);
      setSuccessMsg('Distribusi MBG hari ini telah resmi ditutup.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menutup distribusi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <PageHeader
        title="Kedatangan MBG & Organoleptik (FR-2.1)"
        subtitle="Verifikasi penerimaan SPPG, Uji Keamanan Pangan 2-Klik, dan Generate Master QR Token."
        badgeText="GURU PIKET"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-bold border border-slate-200/80 shadow-sm transition active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
          >
            Live Monitor
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PageHeader>

      <FeedbackBanner
        type={errorMsg ? 'error' : 'success'}
        message={errorMsg || successMsg}
        onDismiss={() => {
          setErrorMsg('');
          setSuccessMsg('');
        }}
      />

      {/* Main Grid: QC Form on Left, Master QR & PIN Display on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Trigger & QC Organoleptik */}
        <div className="lg:col-span-7 space-y-6">
          {/* Vendor Transit Info Card */}
          <div className="rounded-3xl border border-white/20 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-brand-blue">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Mitra Penyedia MBG (SPPG)
                  </h2>
                  <p className="text-sm font-black text-brand-navy">{school?.nama_sppg_mitra || SEED_SCHOOL.nama_sppg_mitra}</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-brand-blue border border-blue-100">
                {formatIndonesianDate(getJakartaDateString())}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Jam Tiba */}
              <label className="block text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-blue" />
                  Jam Tiba SPPG (WIB)
                </span>
                <input
                  type="time"
                  value={waktuAktual}
                  onChange={(e) => setWaktuAktual(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                />
              </label>

              {/* Ketepatan Waktu */}
              <label className="block text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Status Ketepatan Waktu
                </span>
                <select
                  value={statusKetepatan}
                  onChange={(e) => setStatusKetepatan(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                >
                  <option value="TEPAT_WAKTU">Tepat Waktu (Sebelum 10:30 WIB)</option>
                  <option value="TERLAMBAT">⚠ Terlambat (Setelah 10:30 WIB)</option>
                </select>
              </label>
            </div>
          </div>

          {/* Form Bagian A: Uji Organoleptik & QC */}
          <QualityCheckCard
            conclusion={kesimpulan}
            onConclusionChange={setKesimpulan}
            sampleStored={isSampelDisimpan}
            onSampleStoredChange={setIsSampelDisimpan}
            aroma={statusAroma}
            onAromaChange={setStatusAroma}
            taste={statusRasa}
            onTasteChange={setStatusRasa}
            texture={statusTekstur}
            onTextureChange={setStatusTekstur}
            container={statusWadah}
            onContainerChange={setStatusWadah}
            photoUrl={fotoSampelUrl}
            onPhotoChange={setFotoSampelUrl}
          />

          {/* Catatan Tambahan */}
          <div className="rounded-3xl border border-white/20 bg-white/70 p-5 shadow-lg backdrop-blur-xl space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Catatan Kejadian Khusus / Menu Hari Ini (Opsional)
            </label>
            <textarea
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Contoh: Menu Nasi Ayam Fillet Saus Teriyaki + Sayur Bayam Jagung Manis + Buah Pisang Cavendish. Semua wadah dalam kondisi hangat dan tersegel rapi."
              rows={2}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          {/* Primary Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleTriggerMBGDatang()}
              disabled={submitting}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black text-base shadow-xl shadow-blue-900/30 active:scale-[0.98] transition-all duration-200 border border-white/20 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RotateCw className="w-5 h-5 animate-spin" />
                  Memproses Kedatangan MBG...
                </>
              ) : session ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  Perbarui Status Kedatangan & QC
                </>
              ) : (
                <>
                  <span className="text-xl">🍽️</span>
                  MBG DATANG (1-Klik Buka Distribusi)
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              Sistem akan otomatis me-refresh Master QR Code, mengaktifkan PIN Harian 4-Digit, dan
              mengirim Push Notification ke siswa.
            </p>
          </div>
        </div>

        {/* Right Column: Display Master QR & PIN 4-Digit (FR-2.1) */}
        <div className="lg:col-span-5 space-y-6">
          {session ? (
            <div className="rounded-3xl border border-white/20 bg-gradient-to-b from-white/90 to-white/70 p-6 shadow-xl backdrop-blur-xl text-center space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Sesi Aktif Hari Ini
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {session.kesimpulan}
                </span>
              </div>

              {/* Master QR Code Display */}
              <div>
                <p className="text-xs font-bold text-slate-600 mb-2">
                  Tampilkan Layar Ini ke Perwakilan Siswa:
                </p>
                <div className="relative mx-auto inline-block p-4 rounded-3xl bg-white border border-slate-200 shadow-md">
                  <QRCodeSVG
                    value={qrDeepLinkUrl || session.master_qr_token}
                    size={220}
                    level="H"
                    includeMargin={false}
                    className="mx-auto"
                  />
                  <button
                    onClick={() => setQrFullscreen(!qrFullscreen)}
                    className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                    title="Fullscreen QR"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-2 break-all">
                  Token: <strong>{session.master_qr_token}</strong>
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                  <CheckCircle2 className="w-3 h-3" />
                  Bisa discan via Kamera HP / Google Lens / Scanner Luar & Web App
                </div>

                {/* Deep-Link URL Configuration & Copy Link */}
                <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-left space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Link Tujuan Scan Eksternal:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyQrLink}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 shadow-sm transition"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          Link Tersalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-brand-blue" />
                          Salin Link QR
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={baseOrigin}
                    onChange={(e) => setBaseOrigin(e.target.value)}
                    placeholder="Contoh: http://192.168.1.10:3000"
                    className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-mono text-slate-700 focus:border-brand-blue focus:outline-none"
                    title="Ubah ke IP LAN (mis. http://192.168.1.x:3000) jika discan dari HP siswa di jaringan Wi-Fi lokal"
                  />
                  <p className="text-[10px] text-slate-500 font-mono truncate" title={qrDeepLinkUrl}>
                    URL: {qrDeepLinkUrl}
                  </p>
                </div>
              </div>

              {/* PIN 4-Digit Fallback Display */}
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-4 text-center">
                <p className="text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-brand-blue" />
                  PIN Fallback (Kamera Rusak / Gelap)
                </p>

                {/* Big 4-Digit Badges */}
                <div className="flex items-center justify-center gap-2.5 my-2">
                  {session.kode_pin_harian.split('').map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-14 rounded-2xl bg-white border-2 border-brand-blue text-brand-navy font-black text-2xl flex items-center justify-center shadow-md shadow-blue-500/10"
                    >
                      {digit}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition active:scale-95"
                  >
                    {copiedPin ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Tersalin!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-brand-blue" />
                        Salin PIN 4-Digit
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="pt-2 space-y-2">
                <Link
                  href="/dashboard"
                  className="w-full py-3 px-4 rounded-xl bg-brand-blue hover:bg-brand-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <UserCheck className="w-4 h-4" />
                  Buka Live Feed Monitoring Siswa
                </Link>

                <button
                  type="button"
                  onClick={() => setShowCloseModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Tutup Distribusi MBG Hari Ini
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-8 shadow-sm backdrop-blur-xl text-center space-y-4">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <QrCode className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Menunggu Kedatangan MBG</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Master QR Code dan PIN 4-Digit harian akan otomatis dibuat setelah Guru Piket menekan
                  tombol <strong>&quot;MBG Datang&quot;</strong> di samping.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-left space-y-1.5">
                <p className="text-[11px] font-bold text-slate-700">SOP Distribusi 2-Klik:</p>
                <ol className="text-[11px] text-slate-600 space-y-1 list-decimal list-inside">
                  <li>Cek jam tiba & kualitas fisik makanan (Aroma, Rasa, Wadah).</li>
                  <li>Simpan 1 sampel porsi di kulkas sekolah (SOP 2x24 Jam).</li>
                  <li>Klik tombol &quot;MBG Datang&quot; untuk menampilkan Master QR.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Push Notification Simulator Card */}
          <div className="rounded-3xl border border-white/20 bg-white/70 p-5 shadow-lg backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Web Push Notification (FR-2.1)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Notifikasi instan dikirim ke perangkat perwakilan siswa di kelas.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-purple-50/70 border border-purple-200/80 p-3 text-xs text-purple-950 flex items-start gap-2.5">
              <span className="text-base">🔔</span>
              <div>
                <p className="font-bold">Simulasi Push Notif Aktif:</p>
                <p className="text-[11px] text-purple-800 mt-0.5">
                  &quot;🍽️ MBG Telah Tiba di Transit! Gunakan PIN [
                  {session?.kode_pin_harian || '****'}] atau Scan Master QR untuk konfirmasi porsi.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button (FAB) Besar "MBG Datang" untuk Akses Cepat di Mobile */}
      {!session && (
        <div className="fixed bottom-20 right-5 z-40 lg:hidden">
          <button
            type="button"
            onClick={() => handleTriggerMBGDatang()}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-gradient-to-r from-red-600 to-rose-700 text-white font-black text-sm shadow-2xl shadow-red-900/40 border border-white/30 active:scale-95 transition"
          >
            <span className="text-lg">🍽️</span>
            MBG Datang
          </button>
        </div>
      )}

      {/* Fullscreen QR Modal */}
      <Modal
        isOpen={!!qrFullscreen && !!session}
        onClose={() => setQrFullscreen(false)}
        title="Master QR Kedatangan MBG"
        size="sm"
        className="text-center"
      >
        {session && (
          <div className="space-y-5">
            <QRCodeSVG
              value={qrDeepLinkUrl || session.master_qr_token}
              size={260}
              level="H"
              includeMargin={false}
              className="mx-auto"
            />
            <p className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl py-1.5 px-3">
              Dapat discan langsung dari Kamera HP / QR Scanner luar maupun dari menu Siswa di aplikasi.
            </p>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
              <p className="text-sm font-bold text-slate-700">Kode PIN Harian:</p>
              <p className="text-4xl font-black text-brand-navy tracking-widest my-2 font-mono">
                {session.kode_pin_harian}
              </p>
              <p className="text-sm text-slate-600">Scan dari aplikasi siswa atau input PIN</p>
            </div>
            <button
              onClick={() => setQrFullscreen(false)}
              className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition"
            >
              Tutup Tampilan Penuh
            </button>
          </div>
        )}
      </Modal>

      {/* Close Distribution Modal */}
      <Modal
        isOpen={showCloseModal}
        onClose={() => setShowCloseModal(false)}
        title="Tutup Sesi Distribusi?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="text-lg font-black text-slate-900">Tutup Sesi Distribusi?</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Setelah sesi ditutup, perwakilan siswa tidak dapat lagi melakukan konfirmasi porsi secara
            mandiri. Anda yakin ingin menutup distribusi hari ini?
          </p>
          <ModalActions
            onCancel={() => setShowCloseModal(false)}
            onSubmit={handleCloseSession}
            submitType="button"
            submitLabel="Ya, Tutup Sesi"
            submitting={submitting}
            variant="danger"
          />
        </div>
      </Modal>
    </div>
  );
}
