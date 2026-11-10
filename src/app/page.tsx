'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import jsQR from 'jsqr';
import {
  Utensils,
  QrCode,
  Lock,
  Camera,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Users,
  Search,
  Check,
  ShieldCheck,
  KeyRound,
  Award,
  GraduationCap,
  ExternalLink,
  X,
  Bell,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  getTodayOrganolepticSession,
  verifyStudentPinOrQr,
  extractTokenFromInput,
  getClassRoster,
  submitClassRepresentativeClaim,
  getActiveCrmCampaigns,
  SEED_CLASSES,
  SEED_SCHOOL,
} from '@/lib/services';
import { OrganolepticTest, StudentRecord, Kelas, CrmCampaign } from '@/lib/types';
import { formatIndonesianDate, getJakartaDateString } from '@/lib/utils';
import { Modal } from '@/components/ui/ModalField';
import { PageHeader, Input, Select, Button, Alert, useNotify } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

export default function StudentPortalPage() {
  const { student, user } = useAuth();
  const notify = useNotify();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<OrganolepticTest | null>(null);
  const [classes, setClasses] = useState<Kelas[]>(SEED_CLASSES as any);
  const [activeCampaigns, setActiveCampaigns] = useState<CrmCampaign[]>([]);

  // Verification step state
  const [verificationMode, setVerificationMode] = useState<'qr' | 'pin'>('pin');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [qrInput, setQrInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedViaExternalQr, setVerifiedViaExternalQr] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  // Camera scanner simulation
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // Step 2: Class & Checklist state
  const [selectedClassId, setSelectedClassId] = useState<string>(SEED_CLASSES[0]?.id || '');
  const [roster, setRoster] = useState<StudentRecord[]>([]);
  const [selectedNisns, setSelectedNisns] = useState<Set<string>>(new Set());
  const [searchRoster, setSearchRoster] = useState('');
  const [submittingClaim, setSubmittingClaim] = useState(false);

  // Success Confirmation Modal
  const [claimSuccess, setClaimSuccess] = useState<{
    berhasilCount: number;
    dilewatiCount: number;
    message: string;
    className: string;
  } | null>(null);

  // Floating notification banner state
  const [pushNotification, setPushNotification] = useState<{
    title: string;
    body: string;
    timestamp: string;
  } | null>(null);

  // Load today's active session
  const loadSession = async () => {
    try {
      const sess = await getTodayOrganolepticSession();
      setSession(sess);

      // Fetch classes for this session's school if connected to Supabase
      try {
        const { data: classData } = await supabase
          .from('classes')
          .select('*')
          .eq('status_aktif', true)
          .order('nama_kelas');
        if (classData && classData.length > 0) {
          setClasses(classData as any);
          if (!selectedClassId) setSelectedClassId(classData[0].id);
        } else {
          setClasses(SEED_CLASSES as any);
        }
      } catch (e) {
        setClasses(SEED_CLASSES as any);
      }
    } catch (e) {
      console.error('Error loading session:', e);
      setClasses(SEED_CLASSES as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();

    // Auto-verify Deep-Link dari QR Scanner Eksternal (Kamera HP / Google Lens / QR App Luar)
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const externalToken =
        params.get('token') || params.get('qr') || params.get('pin') || params.get('code');

      if (externalToken) {
        const cleanToken = extractTokenFromInput(externalToken);
        setQrInput(cleanToken);
        setVerifying(true);
        verifyStudentPinOrQr(cleanToken)
          .then((res) => {
            if (res.valid && res.session) {
              setIsVerified(true);
              setVerifiedViaExternalQr(true);
              setSession(res.session);
              notify.success('QR Terverifikasi', 'Akses daftar hadir kelas telah dibuka.');
              // Bersihkan query string dari address bar agar rapi
              window.history.replaceState({}, '', window.location.pathname);
            } else {
              setVerificationError(res.message);
            }
          })
          .catch((err: any) => {
            setVerificationError(err?.message || 'Gagal memverifikasi QR eksternal');
          })
          .finally(() => {
            setVerifying(false);
          });
      }
    }

    // Listen to simulated push notifications
    const handlePushEvent = (e: any) => {
      if (e.detail) {
        setPushNotification(e.detail);
        setTimeout(() => setPushNotification(null), 8000);
      }
    };
    window.addEventListener('mbg-push-notification', handlePushEvent);
    return () => window.removeEventListener('mbg-push-notification', handlePushEvent);
  }, []);

  // Update roster when class changes or verified
  useEffect(() => {
    async function fetchRoster() {
      if (selectedClassId) {
        const list = await getClassRoster(selectedClassId);
        setRoster(list);

        // FR-3.2: "Select All" default hadir (hanya siswa yang belum ambil yang dicentang otomatis)
        const availableNisns = list.filter((s) => !s.sudah_ambil).map((s) => s.nisn);
        setSelectedNisns(new Set(availableNisns));
      }
    }
    fetchRoster();
    // Fetch active CRM campaigns targeted to student's jurusan
    const currentCls = classes.find((c) => c.id === selectedClassId);
    const targetJurusan = student?.jurusan || currentCls?.jurusan;
    getActiveCrmCampaigns(targetJurusan).then(setActiveCampaigns).catch(() => {});
  }, [selectedClassId, isVerified, student, classes]);

  useEffect(() => {
    if (student?.id_kelas) {
      setSelectedClassId(student.id_kelas);
    }
  }, [student]);

  // Handle PIN input box typing
  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...pinDigits];
    newDigits[index] = value.slice(-1);
    setPinDigits(newDigits);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      nextInput?.focus();
    }

    // If 4 digits filled, auto-verify
    if (index === 3 && value && newDigits.every((d) => d !== '')) {
      handleVerifyCode(newDigits.join(''));
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      const prevInput = document.getElementById(`pin-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Verify PIN or QR Token
  const handleVerifyCode = async (codeOverride?: string) => {
    const code = codeOverride || (verificationMode === 'pin' ? pinDigits.join('') : qrInput.trim());
    if (!code) {
      setVerificationError('Harap masukkan PIN 4-digit atau scan QR Code');
      return;
    }

    setVerifying(true);
    setVerificationError('');

    try {
      const res = await verifyStudentPinOrQr(code);
      if (res.valid && res.session) {
        setIsVerified(true);
        setSession(res.session);
        notify.success('Verifikasi Berhasil', 'Silakan cek daftar hadir siswa kelas Anda.');
      } else {
        setVerificationError(res.message);
        notify.error('Verifikasi Gagal', res.message);
      }
    } catch (err: any) {
      const msg = err.message || 'Verifikasi gagal';
      setVerificationError(msg);
      notify.error('Verifikasi Gagal', msg);
    } finally {
      setVerifying(false);
    }
  };

  // Camera scanner toggle
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError('');
    setCameraActive(true);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraActive(false);
      setCameraError(
        'Kamera tidak tersedia. Akses kamera hanya berjalan pada HTTPS atau localhost. Gunakan input PIN sebagai alternatif.'
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch {
        // Fallback untuk perangkat yang tidak mendukung facingMode constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      // Tunggu video element ter-mount setelah state cameraActive = true
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {
            /* autoplay bisa diblokir; muted + playsInline membantu */
          });
        } else {
          stream.getTracks().forEach((t) => t.stop());
        }
      });
    } catch (err: any) {
      console.warn('Camera stream not supported or denied:', err);
      setCameraActive(false);
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setCameraError('Izin kamera ditolak. Aktifkan izin kamera di pengaturan browser, atau gunakan input PIN.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraError('Kamera tidak ditemukan pada perangkat ini. Gunakan input PIN sebagai alternatif.');
      } else if (name === 'NotReadableError') {
        setCameraError('Kamera sedang dipakai aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.');
      } else {
        setCameraError('Gagal membuka kamera. Pastikan akses via HTTPS/localhost dan gunakan input PIN bila tetap gagal.');
      }
    }
  };

  // Pastikan kamera berhenti saat unmount / ganti mode
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Real-time QR Scanner di dalam Web App menggunakan jsQR (Canvas 2D universal semua browser) + BarcodeDetector
  useEffect(() => {
    if (!cameraActive || verificationMode !== 'qr' || isVerified) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let detector: any = null;
    if ('BarcodeDetector' in window) {
      try {
        const BarcodeDetectorClass = (window as any).BarcodeDetector;
        detector = new BarcodeDetectorClass({ formats: ['qr_code'] });
      } catch {
        detector = null;
      }
    }

    const onRawQrDetected = (rawValue: string) => {
      if (cancelled || !rawValue) return;
      const extracted = extractTokenFromInput(rawValue);
      if (extracted) {
        cancelled = true;
        setQrInput(extracted);
        stopCamera();
        handleVerifyCode(rawValue);
      }
    };

    const intervalId = setInterval(async () => {
      const video = videoRef.current;
      if (cancelled || !video || video.readyState < 2) return;

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;

      // 1. Decode via jsQR (bekerja di 100% browser Desktop & Mobile: Chrome, Firefox, Safari, iOS, Android)
      if (ctx) {
        try {
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(video, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) {
            onRawQrDetected(code.data);
            return;
          }
        } catch {
          // Lanjut ke fallback BarcodeDetector bila ada
        }
      }

      // 2. Fallback tambahan via native BarcodeDetector API
      if (detector) {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
            onRawQrDetected(barcodes[0].rawValue);
          }
        } catch {
          // Abaikan frame error sementara
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [cameraActive, verificationMode, isVerified]);

  // Decode QR dari Foto Kamera HP / File Gambar (Berjalan bahkan tanpa HTTPS di IP LAN!)
  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVerificationError('');
    setCameraError('');
    setVerifying(true);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setVerifying(false);
          setVerificationError('Gagal memproses gambar QR.');
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          const extracted = extractTokenFromInput(code.data);
          setQrInput(extracted);
          stopCamera();
          handleVerifyCode(code.data);
        } else {
          setVerifying(false);
          setVerificationError(
            'QR Code tidak terbaca pada foto. Pastikan gambar QR terlihat jelas & terang, atau gunakan PIN 4-digit.'
          );
        }
      };
      img.onerror = () => {
        setVerifying(false);
        setVerificationError('Gagal memuat file gambar QR.');
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Simulate scanning today's QR
  const handleSimulateScan = async () => {
    const activeSess = session || (await getTodayOrganolepticSession());
    if (activeSess?.master_qr_token) {
      setSession(activeSess);
      setQrInput(activeSess.master_qr_token);
      handleVerifyCode(activeSess.master_qr_token);
      stopCamera();
    } else {
      const fallbackToken = `MBG-${getJakartaDateString().replace(/-/g, '')}-DEMO`;
      setQrInput(fallbackToken);
      handleVerifyCode(fallbackToken);
      stopCamera();
    }
  };

  // Toggle Single Student Checkbox
  const toggleStudent = (nisn: string, sudahAmbil: boolean) => {
    if (sudahAmbil) return; // Idempotency: locked!
    const updated = new Set(selectedNisns);
    if (updated.has(nisn)) {
      updated.delete(nisn);
    } else {
      updated.add(nisn);
    }
    setSelectedNisns(updated);
  };

  // Toggle Select All
  const availableStudents = roster.filter((s) => !s.sudah_ambil);
  const isAllSelected =
    availableStudents.length > 0 && availableStudents.every((s) => selectedNisns.has(s.nisn));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNisns(new Set());
    } else {
      setSelectedNisns(new Set(availableStudents.map((s) => s.nisn)));
    }
  };

  // Submit Claim (FR-3.2, FR-3.3)
  const handleSubmitClaim = async () => {
    if (selectedNisns.size === 0) {
      notify.warning('Belum Ada Siswa Terpilih', 'Pilih minimal 1 siswa yang hadir untuk menerima MBG.');
      return;
    }

    setSubmittingClaim(true);
    const pinOrToken = session?.kode_pin_harian || pinDigits.join('') || qrInput;
    const currentClass = classes.find((c) => c.id === selectedClassId);

    try {
      const res = await submitClassRepresentativeClaim({
        classId: selectedClassId,
        attendedNisns: Array.from(selectedNisns),
        pinOrToken: pinOrToken,
      });

      if (res.success) {
        setClaimSuccess({
          berhasilCount: res.berhasilCount,
          dilewatiCount: res.dilewatiCount,
          message: res.message,
          className: currentClass?.nama_kelas || 'Kelas',
        });
        notify.success(
          'Penerimaan Dikunci',
          `${res.berhasilCount} porsi untuk ${currentClass?.nama_kelas || 'Kelas'} berhasil dicatat.`
        );
        // Reload roster
        const updated = await getClassRoster(selectedClassId);
        setRoster(updated);
      } else {
        notify.error('Gagal Menyimpan Klaim', res.message);
      }
    } catch (err: any) {
      notify.error('Gagal Menyimpan Klaim', err.message || 'Gagal menyimpan klaim porsi.');
    } finally {
      setSubmittingClaim(false);
    }
  };

  // Filtered roster by search
  const filteredRoster = roster.filter(
    (s) =>
      s.nama_lengkap.toLowerCase().includes(searchRoster.toLowerCase()) ||
      s.nisn.includes(searchRoster)
  );

  const hadirCount = selectedNisns.size;
  const absenCount = Math.max(0, roster.length - hadirCount);

  return (
    <div className="space-y-6 pb-24">
      {/* Floating Push Notification Banner */}
      {pushNotification && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-toast animate-toast-in">
          <div className="rounded-2xl border border-blue-300 bg-brand-navy text-white p-4 shadow-modal flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-800 text-cyan-300 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-sky-200">
                {pushNotification.title}
              </p>
              <p className="text-xs text-white mt-0.5">{pushNotification.body}</p>
              <span className="text-[10px] text-sky-300 font-mono mt-1 block">
                {pushNotification.timestamp} WIB
              </span>
            </div>
            <button
              onClick={() => setPushNotification(null)}
              className="text-sky-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              aria-label="Tutup notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Standardized PageHeader (R-09, R-10) */}
      <PageHeader
        title="Klaim Penerimaan MBG (FR-3.1, FR-3.2)"
        subtitle={`Verifikasi Master QR atau PIN Harian dari Guru Piket (${formatIndonesianDate(
          getJakartaDateString()
        )}), lalu konfirmasi daftar siswa yang hadir mengambil makanan.`}
        badgeText="PWA SISWA & PERWAKILAN KELAS"
      >
        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard"
            className="micro-tap inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition"
          >
            <Users className="w-3.5 h-3.5 text-brand-blue" />
            Live Monitor
          </Link>
          <Link
            href="/kedatangan"
            className="micro-tap inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Utensils className="w-3.5 h-3.5" />
            Piket Guru
          </Link>
        </div>
      </PageHeader>

      {/* STEP 1: DUAL VERIFICATION (FR-3.1 QR SCANNER & 4-DIGIT PIN FALLBACK) */}
      {!isVerified ? (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="micro-card rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Verifikasi Lokasi & Hak Ambil MBG
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Scan Master QR Code di meja Guru Piket atau masukkan 4-digit PIN harian sebagai fallback
                jika kamera buram atau tidak tersedia.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setVerificationMode('pin');
                  stopCamera();
                }}
                className={`micro-tap min-h-[44px] py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                  verificationMode === 'pin'
                    ? 'bg-white text-brand-blue shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Lock className="w-4 h-4" />
                Input PIN 4-Digit
              </button>

              <button
                type="button"
                onClick={() => {
                  setVerificationMode('qr');
                  startCamera();
                }}
                className={`micro-tap min-h-[44px] py-2.5 text-xs font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                  verificationMode === 'qr'
                    ? 'bg-white text-brand-blue shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4" />
                Scan Master QR
              </button>
            </div>

            {/* Error Feedback */}
            {verificationError && (
              <Alert
                variant="error"
                message={verificationError}
                onDismiss={() => setVerificationError('')}
              />
            )}

            {/* PIN 4-DIGIT INPUT */}
            {verificationMode === 'pin' && (
              <div className="space-y-4">
                <div className="flex justify-center gap-3" role="group" aria-label="Input 4 digit PIN harian">
                  {pinDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`pin-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      aria-label={`Digit PIN ke-${idx + 1}`}
                      value={digit}
                      onChange={(e) => handlePinChange(idx, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(idx, e)}
                      className="w-14 h-16 text-center text-3xl font-black text-brand-navy rounded-xl border-2 border-slate-300 bg-white focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/15 shadow-sm transition"
                    />
                  ))}
                </div>

                {/* Quick Auto-Fill for Testing if Session Exists */}
                {session && (
                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const digits = session.kode_pin_harian.split('');
                        setPinDigits(digits);
                        handleVerifyCode(session.kode_pin_harian);
                      }}
                      className="micro-tap inline-flex items-center gap-1.5 text-xs font-bold text-brand-blue hover:underline bg-blue-50 px-3.5 py-2 rounded-full border border-blue-200"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      Gunakan PIN Hari Ini: [{session.kode_pin_harian}] (1-Klik Tes)
                    </button>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => handleVerifyCode()}
                  disabled={verifying || pinDigits.some((d) => !d)}
                  loading={verifying}
                  fullWidth
                  size="lg"
                >
                  Verifikasi PIN & Lanjut Roster
                </Button>
              </div>
            )}

            {/* QR SCANNER */}
            {verificationMode === 'qr' && (
              <div className="space-y-4">
                <div className="relative mx-auto max-w-sm rounded-2xl overflow-hidden bg-black aspect-square flex flex-col items-center justify-center border-4 border-slate-800 shadow-inner">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-2 text-slate-400">
                      <Camera className="w-10 h-10 mx-auto text-slate-500" />
                      <p className="text-xs">Kamera siap untuk memindai Master QR</p>
                    </div>
                  )}

                  {/* Viewfinder Target Overlay */}
                  <div className="absolute inset-8 border-2 border-cyan-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                    <div className="flex justify-between">
                      <span className="w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                      <span className="w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                    </div>
                    <p className="text-[10px] text-cyan-200 text-center font-bold bg-black/60 py-0.5 rounded-md px-2 self-center">
                      Arahkan ke Master QR Guru Piket
                    </p>
                    <div className="flex justify-between">
                      <span className="w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                      <span className="w-4 h-4 border-b-2 border-r-2 border-cyan-400" />
                    </div>
                  </div>
                </div>

                {cameraError && <Alert variant="error" message={cameraError} />}

                {/* Native Camera Photo Fallback & Manual Token Input */}
                <div className="space-y-2.5">
                  <label className="micro-tap w-full min-h-[44px] py-3 px-4 rounded-xl bg-brand-blue hover:bg-brand-blue-700 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer">
                    <Camera className="w-5 h-5" />
                    <span>Ambil Foto QR / Pilih Gambar QR (Semua HP)</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleQrImageUpload}
                      className="hidden"
                      aria-label="Unggah foto QR Code"
                    />
                  </label>

                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        type="text"
                        placeholder="Atau tempel token QR manual..."
                        value={qrInput}
                        onChange={(e) => setQrInput(e.target.value)}
                        aria-label="Token QR manual"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleVerifyCode(qrInput)}
                      size="md"
                    >
                      Cek Token
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* STEP 2: INTERACTIVE CHECKLIST ROSTER & IDEMPOTENCY LOCK (FR-3.2) */
        <div className="space-y-6">
          {/* Top Verification Success Banner */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Verifikasi Berhasil • Transit MBG Dibuka
                  </p>
                  {verifiedViaExternalQr && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      <QrCode className="w-3 h-3" />
                      Terverifikasi via QR Scanner Eksternal
                    </span>
                  )}
                </div>
                <p className="text-xs text-emerald-950 font-medium mt-0.5">
                  {SEED_SCHOOL.nama_sekolah} • SPPG: {SEED_SCHOOL.nama_sppg_mitra}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {user && (
                <Link
                  href="/dashboard"
                  className="micro-tap inline-flex items-center gap-1.5 min-h-[44px] rounded-xl bg-brand-blue hover:bg-brand-blue-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Lihat Live Dashboard
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsVerified(false);
                  setVerifiedViaExternalQr(false);
                  setPinDigits(['', '', '', '']);
                }}
              >
                Ganti Kode / Sesi Lain
              </Button>
            </div>
          </div>

          {/* Class Selector & Search Bar */}
          <div className="micro-card rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Select
              label="Pilih Kelas Distribusi"
              value={selectedClassId}
              onValueChange={(val) => setSelectedClassId(val)}
              options={classes.map((c) => ({
                value: c.id,
                label: `${c.nama_kelas} (${c.jurusan} • ${c.total_siswa_dapodik} Siswa)`,
              }))}
            />

            <Input
              label="Cari Siswa di Kelas Ini"
              value={searchRoster}
              onChange={(e) => setSearchRoster(e.target.value)}
              placeholder="Ketik nama atau NISN siswa..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Roster Table Card */}
          <div className="micro-card rounded-2xl p-5 sm:p-6 space-y-4">
            {/* Table Action Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant={isAllSelected ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={handleToggleSelectAll}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  {isAllSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua Hadir (Default)'}
                </Button>
                <span className="text-xs text-slate-600 font-medium">
                  {selectedNisns.size} dari {roster.length} terpilih
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Indikator Alergi Makanan
                </span>
              </div>
            </div>

            {/* Student Roster List */}
            <div className="divide-y divide-slate-100">
              {filteredRoster.map((studentItem) => {
                const isSelected = selectedNisns.has(studentItem.nisn);
                const isAlreadyClaimed = studentItem.sudah_ambil;

                return (
                  <div
                    key={studentItem.nisn}
                    role="checkbox"
                    aria-checked={isAlreadyClaimed || isSelected}
                    aria-disabled={isAlreadyClaimed}
                    tabIndex={isAlreadyClaimed ? -1 : 0}
                    onClick={() => toggleStudent(studentItem.nisn, isAlreadyClaimed)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        toggleStudent(studentItem.nisn, isAlreadyClaimed);
                      }
                    }}
                    className={`min-h-[52px] py-3.5 px-3 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer select-none ${
                      isAlreadyClaimed
                        ? 'opacity-60 bg-slate-50 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-50/70 border border-blue-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Left: Checkbox & Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition flex-shrink-0 ${
                          isAlreadyClaimed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : isSelected
                            ? 'bg-brand-blue border-brand-blue text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {(isSelected || isAlreadyClaimed) && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold ${
                              isAlreadyClaimed ? 'text-slate-500 line-through' : 'text-slate-900'
                            }`}
                          >
                            {studentItem.nama_lengkap}
                          </span>
                          {studentItem.is_perwakilan_kelas && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full border border-purple-200">
                              <Award className="w-3 h-3" />
                              Perwakilan Kelas
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">
                          NISN: {studentItem.nisn} • {studentItem.nama_kelas}
                        </p>
                      </div>
                    </div>

                    {/* Right: Allergy Warning or Idempotency Lock Badge */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {studentItem.alergi_makanan && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {studentItem.alergi_makanan}
                        </span>
                      )}

                      {isAlreadyClaimed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Sudah Ambil
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg ${
                            isSelected ? 'text-brand-blue' : 'text-slate-400'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3 h-3" />
                              Hadir
                            </>
                          ) : (
                            'Absen'
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Bottom Counter & Submit Bar (FR-3.2, FR-3.3) */}
          <div className="sticky bottom-4 z-sticky rounded-2xl border border-slate-800 bg-brand-navy text-white p-4 sm:p-5 shadow-modal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <span className="block text-[11px] text-sky-200 font-bold uppercase tracking-wider">
                  Rekapitulasi Kehadiran Kelas
                </span>
                <p className="text-sm font-black text-white mt-0.5">
                  <span className="text-emerald-400">Hadir = {hadirCount} Siswa</span>
                  <span className="text-slate-400 mx-2">|</span>
                  <span className="text-amber-300">Absen (Sisa) = {absenCount} Siswa</span>
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="danger"
              size="lg"
              onClick={handleSubmitClaim}
              disabled={submittingClaim || hadirCount === 0}
              loading={submittingClaim}
              leftIcon={<Utensils className="w-4 h-4" />}
            >
              Konfirmasi Terima MBG ({hadirCount} Porsi)
            </Button>
          </div>
        </div>
      )}

      {/* Celebratory Success Modal */}
      <Modal
        isOpen={!!claimSuccess}
        onClose={() => setClaimSuccess(null)}
        title="Penerimaan MBG Berhasil Dikunci"
        size="md"
        className="text-center"
      >
        {claimSuccess && (
          <div className="space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <p className="text-base text-slate-600 mt-1">
                Klaim untuk kelas <strong>{claimSuccess.className}</strong> telah dicatat ke audit
                anti-fraud dan feed live monitoring Guru Piket.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Porsi Terserap:</span>
                <span className="font-bold text-emerald-600">{claimSuccess.berhasilCount} Porsi</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Porsi Dilewati (Sudah Ambil):</span>
                <span className="font-bold text-slate-700">{claimSuccess.dilewatiCount} Porsi</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Waktu Validasi:</span>
                <span className="font-bold text-slate-700">
                  {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}{' '}
                  WIB
                </span>
              </div>
            </div>

            {/* Smart EdTech CRM Beasiswa UBSI Banner (Controlled by Super Admin /admin/campaign) */}
            {activeCampaigns.length > 0 && (
              <div className="rounded-2xl bg-brand-navy p-4 text-white text-left space-y-2 shadow-sm overflow-hidden relative">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-cyan-300" />
                    <span className="text-xs font-black uppercase text-cyan-200">
                      {activeCampaigns[0].rekomendasi_fakultas_ubsi || 'Info Kuliah & Beasiswa UBSI'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full text-sky-200">
                    +{activeCampaigns[0].poin_interaksi} Poin
                  </span>
                </div>
                <p className="text-sm font-bold text-white leading-snug">
                  {activeCampaigns[0].judul_promo}
                </p>
                <a
                  href={activeCampaigns[0].cta_url_template || 'https://bsi.ac.id'}
                  target="_blank"
                  rel="noreferrer"
                  className="micro-tap inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition"
                >
                  Konsultasi WhatsApp / Daftar PMB UBSI
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <Button
              type="button"
              onClick={() => setClaimSuccess(null)}
              fullWidth
              size="lg"
            >
              Tutup & Selesai
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
