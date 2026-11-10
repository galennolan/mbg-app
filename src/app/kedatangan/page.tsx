'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { QRCodeSVG } from 'qrcode.react';
import {
  Truck,
  Clock,
  CheckCircle2,
  Lock,
  UserCheck,
  RotateCw,
  QrCode,
  Copy,
  Check,
  Maximize2,
  Bell,
  Utensils,
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
import {
  FeedbackBanner,
  PageHeader,
  Input,
  Select,
  Textarea,
  Button,
  Modal,
  ModalConfirm,
  useNotify,
} from '@/components/ui';
import { QualityCheckCard } from '@/components/operasional/QualityCheckCard';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function KedatanganMBGPage() {
  const { user } = useAuth();
  const notify = useNotify();
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
  const [sampleError, setSampleError] = useState('');
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
      const origin = window.location.origin;
      setBaseOrigin(origin);

      if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      ) {
        fetch('/api/network-info')
          .then((res) => res.json())
          .then((info) => {
            if (info?.lanIp && info.lanIp !== 'localhost') {
              const portPart = window.location.port ? `:${window.location.port}` : '';
              setBaseOrigin(`${window.location.protocol}//${info.lanIp}${portPart}`);
            }
          })
          .catch(() => {});
      }
    }
    loadData();
  }, []);

  const handleTriggerMBGDatang = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const now = new Date();
    const fallbackHhMm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const effectiveJamTiba = (waktuAktual || fallbackHhMm).slice(0, 5);

    if (kesimpulan === 'LAYAK_EDAR' && !isSampelDisimpan) {
      const msg = 'SOP Keamanan Pangan: Harap centang konfirmasi penyimpanan 1 porsi sampel.';
      setSampleError(msg);
      setErrorMsg(msg);
      notify.warning(msg, 'Verifikasi Sampel Wajib');
      return;
    }

    setSampleError('');
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
      const msg = `MBG Datang berhasil dicatat. Master QR (${newSess.master_qr_token}) & PIN (${newSess.kode_pin_harian}) telah aktif.`;
      setSuccessMsg(msg);

      await notify.fire({
        icon: newSess.kesimpulan === 'LAYAK_EDAR' ? 'success' : 'warning',
        title:
          newSess.kesimpulan === 'LAYAK_EDAR'
            ? 'Sesi Distribusi MBG Dibuka!'
            : 'Status Tolak / Retur Dicatat',
        text:
          newSess.kesimpulan === 'LAYAK_EDAR'
            ? 'Master QR Code dan PIN Harian 4-Digit siap dipindai oleh perwakilan kelas.'
            : 'Distribusi porsi ke siswa telah diblokir sesuai hasil pemeriksaan QC.',
        badgeText: `PIN Harian: ${newSess.kode_pin_harian}`,
        details: [
          { label: 'Jam Tiba SPPG', value: `${effectiveJamTiba} WIB` },
          { label: 'Status QC', value: newSess.kesimpulan, highlight: newSess.kesimpulan === 'LAYAK_EDAR' },
          { label: 'Master Token', value: newSess.master_qr_token },
        ],
        confirmText: 'Tampilkan QR & PIN',
      });
    } catch (err: any) {
      const errText = err.message || 'Gagal mencatat kedatangan MBG.';
      setErrorMsg(errText);
      notify.error(errText, 'Gagal Menyimpan');
    } finally {
      setSubmitting(false);
    }
  };

  const qrDeepLinkUrl = session
    ? `${(baseOrigin || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '')}/?token=${encodeURIComponent(session.master_qr_token)}&pin=${encodeURIComponent(session.kode_pin_harian)}`
    : '';

  const handleCopyPin = () => {
    if (session?.kode_pin_harian) {
      navigator.clipboard.writeText(session.kode_pin_harian);
      setCopiedPin(true);
      notify.success(`PIN Harian ${session.kode_pin_harian} disalin ke papan klip.`, 'PIN Tersalin');
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleCopyQrLink = () => {
    if (qrDeepLinkUrl) {
      navigator.clipboard.writeText(qrDeepLinkUrl);
      setCopiedLink(true);
      notify.success('Tautan Deep-Link QR berhasil disalin.', 'Tautan Tersalin');
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
      notify.info('Sesi distribusi MBG hari ini telah resmi ditutup.', 'Distribusi Ditutup');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menutup distribusi');
      notify.error(err.message || 'Gagal menutup distribusi', 'Kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['guru_piket', 'super_admin', 'kepala_sekolah', 'admin', 'guru']}>
      <div className="space-y-6 pb-20">
        {/* Page Header */}
        <PageHeader
          title="Kedatangan MBG & Organoleptik (FR-2.1)"
          subtitle="Verifikasi penerimaan SPPG, Uji Keamanan Pangan 2-Klik, dan Generate Master QR Token."
          badgeText="GURU PIKET"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadData}
            loading={loading}
            leftIcon={<RotateCw className="w-3.5 h-3.5" />}
          >
            Muat Ulang
          </Button>
          <Link
            href="/dashboard"
            className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy hover:bg-brand-navy-light text-white text-xs font-bold shadow-elev-1 micro-tap"
          >
            Buka Live Monitor
          </Link>
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
            <div className="micro-card rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3.5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue border border-brand-blue-100">
                    <Truck className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Mitra Penyedia MBG (SPPG)
                    </h2>
                    <p className="text-sm font-black text-brand-navy">
                      {school?.nama_sppg_mitra || SEED_SCHOOL.nama_sppg_mitra}
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-brand-blue-50 px-3 py-1 text-xs font-bold text-brand-blue border border-brand-blue-100">
                  {formatIndonesianDate(getJakartaDateString())}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  type="time"
                  label="Jam Tiba SPPG (WIB)"
                  required
                  value={waktuAktual}
                  onChange={(e) => setWaktuAktual(e.target.value)}
                  leftIcon={<Clock className="w-4 h-4 text-brand-blue" />}
                />

                <Select
                  label="Status Ketepatan Waktu"
                  required
                  value={statusKetepatan}
                  onValueChange={(val) => setStatusKetepatan(val as 'TEPAT_WAKTU' | 'TERLAMBAT')}
                  options={[
                    { value: 'TEPAT_WAKTU', label: 'Tepat Waktu (Sebelum 10:30 WIB)' },
                    { value: 'TERLAMBAT', label: 'Terlambat (Setelah 10:30 WIB)' },
                  ]}
                />
              </div>
            </div>

            {/* Form Bagian A: Uji Organoleptik & QC */}
            <QualityCheckCard
              conclusion={kesimpulan}
              onConclusionChange={setKesimpulan}
              sampleStored={isSampelDisimpan}
              onSampleStoredChange={(checked) => {
                setIsSampelDisimpan(checked);
                if (checked) setSampleError('');
              }}
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
              showPhotoCapture={false}
              sampleError={sampleError}
            />

            {/* Catatan Tambahan */}
            <div className="micro-card rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
              <Textarea
                label="Catatan Kejadian Khusus / Menu Hari Ini (Opsional)"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Contoh: Menu Nasi Ayam Fillet Saus Teriyaki, Sayur Bayam Jagung Manis, dan Buah Pisang Cavendish. Semua wadah dalam kondisi hangat dan tersegel rapi."
                minRows={2}
              />
            </div>

            {/* Primary Action Button */}
            <div className="pt-1">
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                loadingText="Memproses Kedatangan MBG..."
                onClick={() => handleTriggerMBGDatang()}
                leftIcon={
                  session ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Utensils className="w-5 h-5" />
                  )
                }
                className="font-black text-base shadow-elev-3"
              >
                {session
                  ? 'Perbarui Status Kedatangan & QC'
                  : 'Lapor MBG Datang & Buka Distribusi'}
              </Button>
              <p className="text-center text-xs text-slate-600 mt-2">
                Sistem akan otomatis memperbarui Master QR Code, mengaktifkan PIN Harian 4-Digit, dan
                mengirim notifikasi ke perangkat perwakilan kelas.
              </p>
            </div>
          </div>

          {/* Right Column: Display Master QR & PIN 4-Digit (FR-2.1) */}
          <div className="lg:col-span-5 space-y-6">
            {session ? (
              <div className="micro-card rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-6 text-center space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-black text-brand-navy uppercase tracking-wider">
                      Sesi Aktif Hari Ini
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                    {session.kesimpulan}
                  </span>
                </div>

                {/* Master QR Code Display */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-2">
                    Tampilkan Layar Ini ke Perwakilan Siswa:
                  </p>
                  <div className="mx-auto inline-block p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-elev-1">
                    <QRCodeSVG
                      value={qrDeepLinkUrl || session.master_qr_token}
                      size={230}
                      level="M"
                      includeMargin={true}
                      className="mx-auto block"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => setQrFullscreen(true)}
                      leftIcon={<Maximize2 className="w-3.5 h-3.5" />}
                    >
                      Perbesar QR (Layar Penuh)
                    </Button>
                  </div>
                  <p className="text-xs text-slate-600 font-mono mt-2 break-all">
                    Token: <strong>{session.master_qr_token}</strong>
                  </p>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Dapat dipindai via Kamera HP / Google Lens & Portal Siswa
                  </div>

                  {/* Deep-Link URL Configuration & Copy Link */}
                  <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-left space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="qr-base-origin"
                        className="text-[11px] font-bold uppercase tracking-wider text-slate-600"
                      >
                        Link Tujuan Scan Eksternal:
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyQrLink}
                        leftIcon={
                          copiedLink ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-brand-blue" />
                          )
                        }
                        className="min-h-[34px] py-1 px-2.5 text-[11px]"
                      >
                        {copiedLink ? 'Tersalin' : 'Salin Link QR'}
                      </Button>
                    </div>
                    <Input
                      id="qr-base-origin"
                      type="text"
                      value={baseOrigin}
                      onChange={(e) => setBaseOrigin(e.target.value)}
                      placeholder="Contoh: http://192.168.1.10:3000"
                      helperText="Sesuaikan ke IP LAN jika dipindai dari HP siswa di jaringan Wi-Fi lokal."
                      className="font-mono text-xs min-h-[40px]"
                    />
                  </div>
                </div>

                {/* PIN 4-Digit Fallback Display */}
                <div className="rounded-2xl border border-brand-blue-100 bg-brand-blue-50/70 p-4 text-center">
                  <p className="text-xs font-bold text-brand-navy mb-2 flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-brand-blue" aria-hidden="true" />
                    PIN Fallback (Kamera Buram / Gelap)
                  </p>

                  <div className="flex items-center justify-center gap-2.5 my-2">
                    {session.kode_pin_harian.split('').map((digit, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-14 rounded-xl bg-white border-2 border-brand-blue text-brand-navy font-black text-2xl font-mono flex items-center justify-center shadow-elev-1 animate-pop-in"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPin}
                      leftIcon={
                        copiedPin ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-brand-blue" />
                        )
                      }
                    >
                      {copiedPin ? 'PIN Tersalin' : 'Salin PIN 4-Digit'}
                    </Button>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div className="pt-1 space-y-2.5">
                  <Link
                    href="/dashboard"
                    className="min-h-[44px] w-full py-3 px-4 rounded-xl bg-brand-blue hover:bg-brand-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-elev-2 micro-tap"
                  >
                    <UserCheck className="w-4 h-4" aria-hidden="true" />
                    Buka Live Feed Monitoring Siswa
                  </Link>

                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowCloseModal(true)}
                    leftIcon={<Lock className="w-3.5 h-3.5" />}
                    className="hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                  >
                    Tutup Distribusi MBG Hari Ini
                  </Button>
                </div>
              </div>
            ) : (
              <div className="micro-card rounded-2xl sm:rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-4">
                <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                  <QrCode className="h-7 w-7" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-black text-brand-navy">Menunggu Kedatangan MBG</h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
                    Master QR Code dan PIN 4-Digit harian akan otomatis dibuat setelah Guru Piket menekan
                    tombol <strong>Lapor MBG Datang</strong>.
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-left space-y-1.5">
                  <p className="text-xs font-bold text-slate-800">Prosedur Operasional (SOP):</p>
                  <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside">
                    <li>Periksa jam tiba & 4 parameter organoleptik makanan.</li>
                    <li>Simpan 1 porsi sampel di kulkas sekolah (SOP 2x24 Jam).</li>
                    <li>Tekan tombol konfirmasi untuk menerbitkan Master QR & PIN.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Push Notification Info Card */}
            <div className="micro-card rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue border border-brand-blue-100">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-brand-navy uppercase tracking-wider">
                    Web Push Notification (FR-2.1)
                  </h3>
                  <p className="text-xs text-slate-600">
                    Siaran instan ke perangkat perwakilan siswa saat sesi dibuka.
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-800 flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-bold text-brand-navy">Format Siaran Notifikasi:</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    &quot;MBG Telah Tiba di Transit! Gunakan PIN [
                    {session?.kode_pin_harian || '----'}] atau Pindai Master QR untuk konfirmasi porsi.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button (FAB) for Mobile Quick Trigger */}
        {!session && (
          <div className="fixed bottom-20 right-4 z-bottom-nav lg:hidden">
            <Button
              type="button"
              variant="danger"
              size="lg"
              loading={submitting}
              onClick={() => handleTriggerMBGDatang()}
              leftIcon={<Utensils className="w-4 h-4" />}
              className="rounded-2xl shadow-elev-4"
            >
              Lapor MBG Datang
            </Button>
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
              <div className="mx-auto inline-block p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-elev-1">
                <QRCodeSVG
                  value={qrDeepLinkUrl || session.master_qr_token}
                  size={260}
                  level="M"
                  includeMargin={true}
                  className="mx-auto block"
                />
              </div>
              <p className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl py-2 px-3">
                Dapat dipindai langsung dari Kamera HP / QR Scanner luar maupun dari menu Siswa di aplikasi.
              </p>
              <div className="bg-brand-blue-50 rounded-2xl p-4 border border-brand-blue-100">
                <p className="text-xs font-bold text-slate-700 uppercase">Kode PIN Harian:</p>
                <p className="text-4xl font-black text-brand-navy tracking-widest my-2 font-mono">
                  {session.kode_pin_harian}
                </p>
                <p className="text-xs text-slate-600">Pindai dari aplikasi siswa atau masukkan PIN</p>
              </div>
              <Button
                type="button"
                variant="navy"
                fullWidth
                onClick={() => setQrFullscreen(false)}
              >
                Tutup Tampilan Penuh
              </Button>
            </div>
          )}
        </Modal>

        {/* Close Distribution Confirm Modal */}
        <ModalConfirm
          isOpen={showCloseModal}
          onClose={() => setShowCloseModal(false)}
          onConfirm={handleCloseSession}
          title="Tutup Sesi Distribusi?"
          message="Setelah sesi ditutup, perwakilan siswa tidak dapat lagi melakukan konfirmasi porsi secara mandiri. Anda yakin ingin menutup distribusi hari ini?"
          confirmLabel="Ya, Tutup Sesi"
          cancelLabel="Batal"
          variant="danger"
          loading={submitting}
        />
      </div>
    </ProtectedRoute>
  );
}
