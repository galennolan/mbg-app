'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ShieldCheck,
  ChevronRight,
  UtensilsCrossed,
  Wifi,
  Zap,
} from 'lucide-react';

interface SplashScreenProps {
  /**
   * Durasi total tampilan dalam milidetik sebelum transisi keluar (default: 1800ms)
   */
  minDuration?: number;
  /**
   * Menampilkan tombol lewati (default: true)
   */
  allowSkip?: boolean;
}

export default function SplashScreen({
  minDuration = 1800,
  allowSkip = true,
}: SplashScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(12);
  const [statusMessage, setStatusMessage] = useState('Memuat modul Nutri Kampus...');

  const dismiss = useCallback(() => {
    setIsExiting(true);
    const timeout = setTimeout(() => {
      setVisible(false);
      try {
        sessionStorage.setItem('mbg_splash_dismissed', '1');
      } catch {
        // Abaikan jika storage dinonaktifkan
      }
    }, 450); // Selaras dengan durasi transisi keluar (400-450ms)

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    setMounted(true);

    // Kunci scroll halaman saat splash aktif agar terkesan fullscreen mobile native
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Cek preferensi aksesibilitas pengguna (reduced motion)
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const targetDuration = prefersReducedMotion ? 400 : minDuration;

    // Tahapan status loading realistis seperti aplikasi mobile profesional
    const t1 = setTimeout(() => {
      setProgress(46);
      setStatusMessage('Menghubungkan basis data MBG & cache offline...');
    }, targetDuration * 0.28);

    const t2 = setTimeout(() => {
      setProgress(82);
      setStatusMessage('Memeriksa izin akses & modul nutrisi...');
    }, targetDuration * 0.65);

    const t3 = setTimeout(() => {
      setProgress(100);
      setStatusMessage('Aplikasi siap digunakan!');
    }, targetDuration * 0.88);

    const t4 = setTimeout(() => {
      dismiss();
    }, targetDuration);

    // Listener custom event untuk menguji atau membuka kembali splash screen dari mana saja
    const handleReplay = () => {
      setVisible(true);
      setIsExiting(false);
      setProgress(10);
      setStatusMessage('Menyiapkan ulang aplikasi...');
      document.body.style.overflow = 'hidden';

      setTimeout(() => setProgress(50), 300);
      setTimeout(() => setProgress(88), 700);
      setTimeout(() => {
        setProgress(100);
        setStatusMessage('Aplikasi siap!');
      }, 1000);
      setTimeout(() => dismiss(), 1300);
    };

    window.addEventListener('mbg:show-splash', handleReplay);

    return () => {
      document.body.style.overflow = originalOverflow;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('mbg:show-splash', handleReplay);
    };
  }, [minDuration, dismiss]);

  // Hindari hydration mismatch pada SSR
  if (!mounted || !visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Memuat aplikasi Nutri Kampus Hub"
      className={`fixed inset-0 z-[100] flex flex-col justify-between select-none overflow-hidden transition-all duration-500 ease-out ${
        isExiting
          ? 'opacity-0 scale-105 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background:
          'radial-gradient(circle at 50% 25%, #173868 0%, #172D50 45%, #0B1626 100%)',
      }}
    >
      {/* Efek visual glow latar belakang (Mobile Ambient Glows) */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-brand-blue/25 blur-3xl"
        aria-hidden="true"
      />

      {/* Bagian Atas: Status Bar Mobile & Tombol Lewati */}
      <div className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-8">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-sky-200 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>PWA Mobile Standalone</span>
        </div>

        {allowSkip && (
          <button
            type="button"
            onClick={dismiss}
            className="group inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-sky-100 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
            aria-label="Lewati splash screen"
          >
            <span>Lewati</span>
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>

      {/* Bagian Tengah: Brand Hero & Logo Mobile */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center my-auto">
        {/* Container Ikon Brand dengan Ripple & Glassmorphism */}
        <div className="relative mb-6">
          {/* Cincin Luar Berdenyut */}
          <div
            className="absolute -inset-3 rounded-[32px] bg-gradient-to-tr from-brand-blue/40 via-cyan-400/20 to-emerald-400/30 blur-md animate-pulse"
            aria-hidden="true"
          />

          {/* Kartu Ikon Utama */}
          <div className="relative flex h-28 w-28 items-center justify-center rounded-[28px] border border-white/25 bg-gradient-to-b from-white/15 to-white/5 p-4 shadow-[0_20px_50px_rgba(8,20,40,0.5)] backdrop-blur-xl">
            {/* Lambang BSI & Makanan Bergizi */}
            <div className="relative flex flex-col items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#125386] to-[#1769AA] text-white shadow-lg border border-white/30">
                <span className="text-xl font-black tracking-tighter drop-shadow-md">
                  BSI
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-md border-2 border-[#172D50]">
                <UtensilsCrossed className="h-4 w-4 drop-shadow-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Typografi Identitas Mobile App */}
        <div className="space-y-2 max-w-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-0.5 text-[11px] font-bold text-cyan-200 tracking-wide">
            <Sparkles className="h-3 w-3 text-cyan-300" />
            <span>NUTRI KAMPUS HUB</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
            MBG Tracker Mobile
          </h1>

          <p className="text-xs sm:text-sm text-sky-200/80 leading-relaxed font-normal">
            Sistem Monitoring Distribusi Makan Bergizi Gratis & Kebugaran Siswa
          </p>
        </div>

        {/* Indikator Loading Mobile-Native */}
        <div className="mt-8 w-full max-w-xs space-y-3">
          {/* Progress Bar dengan Gradient & Glow */}
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10 p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 via-brand-blue to-emerald-400 shadow-[0_0_12px_rgba(56,189,248,0.6)] transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Animasi Kilau Cahaya (Shimmer) */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.2s_infinite]"
                style={{
                  backgroundSize: '200% 100%',
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Teks Status & Persentase */}
          <div className="flex items-center justify-between text-[11px] text-sky-200/90 font-medium">
            <span className="truncate pr-2">{statusMessage}</span>
            <span className="font-mono text-cyan-300 tabular-nums font-bold">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Metadata Institusi & Legalitas Mobile */}
      <div className="relative z-10 pb-8 px-6 text-center space-y-2">
        <div className="flex items-center justify-center gap-3 text-[11px] text-sky-200/70">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Terverifikasi UBSI
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            Fast Sync Ready
          </span>
        </div>

        <p className="text-[10px] text-sky-300/60 font-mono tracking-tight">
          Universitas Bina Sarana Informatika • Surakarta • v1.2.0
        </p>
      </div>
    </div>
  );
}
