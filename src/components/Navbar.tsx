'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Truck,
  UserCheck,
  Users,
  GraduationCap,
  FileSpreadsheet,
  QrCode,
  ShieldCheck,
  History,
  LogOut,
  LogIn,
  Menu,
  X,
  ChevronDown,
  Activity,
  CheckCircle2,
  User,
  Megaphone,
  ExternalLink,
} from 'lucide-react';
import { SEED_SCHOOL } from '@/lib/services';
import { Modal, Input, Button, useNotify } from '@/components/ui';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const notify = useNotify();
  const {
    user,
    role,
    student,
    isStudent,
    loginAsDemoRole,
    signInStudent,
    updateProfileName,
    signOut,
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Active Role State for demo/testing toggle (Guru Piket vs Siswa)
  const [activeRoleView, setActiveRoleView] = useState<'guru_piket' | 'siswa'>('guru_piket');

  useEffect(() => {
    if (isStudent) {
      setActiveRoleView('siswa');
    } else if (user) {
      setActiveRoleView('guru_piket');
    }
  }, [isStudent, user]);

  const isActive = (path: string) => pathname === path;
  const isStaff = (user !== null || activeRoleView === 'guru_piket') && !isStudent;
  const isSuperAdmin = role === 'super_admin' || role === 'admin';
  const isLoggedIn = !!user || !!student;

  const displayName = user
    ? user.nama
    : student
      ? student.nama_lengkap
      : activeRoleView === 'siswa'
        ? 'Tamu (Siswa)'
        : 'Petugas Demo';

  const displaySub = user
    ? user.email
    : student
      ? `${student.nama_kelas} • ${student.no_hp}`
      : 'Klik untuk Login / Profil';

  const displayRoleLabel = user
    ? user.peran === 'super_admin'
      ? 'Super Admin'
      : user.peran === 'kepala_sekolah'
        ? 'Kepala Sekolah'
        : 'Guru Piket'
    : student
      ? `Siswa (${student.nama_kelas})`
      : activeRoleView === 'siswa'
        ? 'Mode Siswa'
        : 'Mode Guru Piket';

  const handleOpenProfileModal = () => {
    setEditNameValue(user ? user.nama : student ? student.nama_lengkap : '');
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    setProfileModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNameValue.trim()) return;
    setSavingProfile(true);
    try {
      await updateProfileName(editNameValue.trim());
      setProfileModalOpen(false);
      notify.success('Nama tampilan profil berhasil diperbarui.', 'Profil Tersimpan');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFullLogout = async () => {
    await signOut();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    notify.info('Anda telah keluar dari sesi aktif.', 'Sesi Berakhir');
    router.push('/login');
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scroll when mobile modal is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserDropdownOpen(false);
        setAdminDropdownOpen(false);
        setProfileModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const mobileModal =
    mounted && mobileMenuOpen
      ? createPortal(
        <div
          className="fixed inset-0 z-modal flex flex-col items-center justify-start overflow-y-auto bg-slate-950/80 p-3 sm:p-6 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Menu Navigasi Utama"
        >
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="relative my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-slate-800 bg-brand-navy-dark p-5 text-white shadow-elev-5 sm:p-7 space-y-5 animate-sheet-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-brand-blue text-white shadow-sm">
                  <span className="text-sm font-black tracking-tighter">BSI</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black tracking-wide text-white">
                      NUTRI KAMPUS HUB
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Aktif
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-sky-200">
                    Sistem Operasional MBG • Universitas BSI
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sky-200 hover:bg-white/20 hover:text-white micro-tap"
                aria-label="Tutup menu navigasi"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Segmented Control Role Switcher */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-sky-200">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                  Mode Navigasi (RBAC):
                </span>
                <span className="font-mono text-[10px] text-sky-300">
                  {activeRoleView === 'guru_piket' ? 'Staff Piket Aktif' : 'Portal Siswa Aktif'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-white/10 bg-slate-950/70 p-1.5">
                <button
                  type="button"
                  onClick={() => setActiveRoleView('guru_piket')}
                  className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold micro-tap ${activeRoleView === 'guru_piket'
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-sky-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <Truck className="h-4 w-4" aria-hidden="true" />
                  Guru Piket
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRoleView('siswa')}
                  className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold micro-tap ${activeRoleView === 'siswa'
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-sky-300 hover:bg-white/5 hover:text-white'
                    }`}
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  Siswa / Scan
                </button>
              </div>
            </div>

            {/* Navigation Menu Items */}
            <div className="space-y-2.5">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-4 micro-tap ${isActive('/')
                  ? 'border-cyan-400/70 bg-brand-blue/30'
                  : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white">
                    <QrCode className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white">
                        Portal Siswa (Scan Master QR)
                      </h3>
                      <span className="rounded-md border border-cyan-400/30 bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                        Siswa
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-sky-200/80">
                      Kamera scan QR atau input PIN 4-digit harian.
                    </p>
                  </div>
                </div>
              </Link>

              {isStaff && (
                <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
                  <Link
                    href="/kedatangan"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 micro-tap ${isActive('/kedatangan')
                      ? 'border-blue-400/70 bg-brand-blue/30'
                      : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white">
                      <Truck className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Kedatangan MBG</h4>
                      <p className="mt-0.5 text-[10px] text-sky-200/80">
                        Uji QC, foto sampel & QR.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 micro-tap ${isActive('/dashboard')
                      ? 'border-emerald-400/70 bg-emerald-600/30'
                      : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-green text-white">
                      <Activity className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Live Monitor</h4>
                      <p className="mt-0.5 text-[10px] text-sky-200/80">
                        Feed anti-fraud & kuota kelas.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/konfirmasi/kelas"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 micro-tap ${isActive('/konfirmasi/kelas')
                      ? 'border-blue-400/70 bg-brand-blue/30'
                      : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-navy-light text-white">
                      <Users className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Konfirmasi Kelas</h4>
                      <p className="mt-0.5 text-[10px] text-sky-200/80">
                        Checklist massal kolektif.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/laporan"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl border p-3.5 micro-tap ${isActive('/laporan')
                      ? 'border-blue-400/70 bg-brand-blue/30'
                      : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                      }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue-700 text-white">
                      <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Laporan & SPPG</h4>
                      <p className="mt-0.5 text-[10px] text-sky-200/80">
                        Export Excel & rekap ompreng.
                      </p>
                    </div>
                  </Link>
                </div>
              )}

              {isSuperAdmin && (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    Master Menu Super Admin (Marcomm UBSI)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Link
                      href="/admin/campaign"
                      onClick={() => setMobileMenuOpen(false)}
                      className="min-h-[44px] flex flex-col items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 p-2 text-center micro-tap hover:bg-amber-500/20"
                    >
                      <Megaphone className="mb-1 h-4 w-4 text-amber-300" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-white">Campaign CRM</span>
                    </Link>
                    <Link
                      href="/siswa"
                      onClick={() => setMobileMenuOpen(false)}
                      className="min-h-[44px] flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-center micro-tap hover:bg-white/10"
                    >
                      <GraduationCap className="mb-1 h-4 w-4 text-sky-300" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-white">Data Siswa</span>
                    </Link>
                    <Link
                      href="/admin/pengguna"
                      onClick={() => setMobileMenuOpen(false)}
                      className="min-h-[44px] flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-center micro-tap hover:bg-white/10"
                    >
                      <UserCheck className="mb-1 h-4 w-4 text-sky-300" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-white">Kelola Pengguna</span>
                    </Link>
                    <Link
                      href="/admin/audit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="min-h-[44px] flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2 text-center micro-tap hover:bg-white/10"
                    >
                      <History className="mb-1 h-4 w-4 text-sky-300" aria-hidden="true" />
                      <span className="text-[10px] font-bold text-white">Audit Log</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom: User Profile / Quick Login & Logout */}
            <div className="space-y-2.5 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-white/5 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-brand-blue text-white">
                    <User className="h-5 w-5" aria-hidden="true" />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 ${isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-black text-white">{displayName}</p>
                      <span className="rounded-md bg-brand-blue/40 border border-blue-400/30 px-1.5 py-0.5 text-[9px] font-bold text-cyan-200">
                        {displayRoleLabel}
                      </span>
                    </div>
                    <p className="truncate font-mono text-[10px] text-sky-300">{displaySub}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleOpenProfileModal}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 py-2.5 px-3 text-xs font-bold text-white hover:bg-white/20 micro-tap"
                >
                  <User className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                  Profil
                </button>

                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-blue-400/30 bg-brand-blue/40 py-2.5 px-3 text-xs font-bold text-sky-100 hover:bg-brand-blue/60 micro-tap"
                >
                  <LogIn className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" />
                  {isLoggedIn ? 'Ganti Akun' : 'Login'}
                </Link>

                <button
                  type="button"
                  onClick={handleFullLogout}
                  className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/20 py-2.5 px-3 text-xs font-bold text-red-200 hover:bg-red-500/30 micro-tap"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-300" aria-hidden="true" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
      : null;

  return (
    <>
      <nav className="sticky top-0 z-sticky border-b border-white/10 bg-brand-navy-dark/95 text-white shadow-elev-3 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & UBSI Brand */}
            <div className="flex items-center gap-3">
              <a
                href="https://pmbubsi.id/kampus/surakarta"
                target="_blank"
                rel="noopener noreferrer"
                title="Buka Website PMB UBSI Surakarta"
                className="group flex items-center gap-2.5 micro-tap"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-brand-blue shadow-inner group-hover:bg-brand-blue-700 transition">
                  <span className="text-sm font-black tracking-tighter text-white">BSI</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="block text-sm font-black leading-tight tracking-wider text-white group-hover:text-cyan-200 transition">
                      NUTRI KAMPUS HUB
                    </span>
                    <ExternalLink className="w-3 h-3 text-sky-300 opacity-70 group-hover:opacity-100 transition" />
                  </div>
                  <span className="block text-[10px] font-normal leading-none text-sky-200">
                    Universitas Bina Sarana Informatika Surakarta
                  </span>
                </div>
              </a>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center space-x-1 lg:flex">
              <Link
                href="/"
                className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold micro-tap ${isActive('/')
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'text-sky-200 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                Portal Siswa (Scan)
              </Link>

              {isStaff && (
                <>
                  <Link
                    href="/kedatangan"
                    className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold micro-tap ${isActive('/kedatangan')
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-sky-200 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                    Kedatangan MBG
                  </Link>

                  <Link
                    href="/dashboard"
                    className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold micro-tap ${isActive('/dashboard')
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-sky-200 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                    Live Monitor
                  </Link>

                  <Link
                    href="/konfirmasi/kelas"
                    className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold micro-tap ${isActive('/konfirmasi/kelas')
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-sky-200 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    Konfirmasi Kelas
                  </Link>

                  <Link
                    href="/laporan"
                    className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold micro-tap ${isActive('/laporan')
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-sky-200 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                    Laporan
                  </Link>

                  {isSuperAdmin && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setAdminDropdownOpen(!adminDropdownOpen);
                        }}
                        aria-expanded={adminDropdownOpen}
                        className="min-h-[40px] flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-sky-200 micro-tap hover:bg-white/10 hover:text-white"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                        Super Admin
                        <ChevronDown className="ml-0.5 h-3 w-3" aria-hidden="true" />
                      </button>

                      {adminDropdownOpen && (
                        <div
                          className="absolute right-0 z-dropdown mt-2 w-60 rounded-2xl border border-slate-700 bg-slate-900 py-2 text-white shadow-elev-4 animate-slide-up"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <Link
                            href="/admin/campaign"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-white/10"
                          >
                            <Megaphone className="h-4 w-4 text-amber-300" aria-hidden="true" />
                            Campaign Manager (CRM)
                          </Link>
                          <Link
                            href="/siswa"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-sky-100 hover:bg-white/10"
                          >
                            <GraduationCap className="h-4 w-4 text-sky-300" aria-hidden="true" />
                            Data Siswa
                          </Link>
                          <Link
                            href="/admin/pengguna"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-sky-100 hover:bg-white/10"
                          >
                            <Users className="h-4 w-4 text-sky-300" aria-hidden="true" />
                            Kelola Pengguna
                          </Link>
                          <Link
                            href="/admin/audit"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-sky-100 hover:bg-white/10"
                          >
                            <History className="h-4 w-4 text-sky-300" aria-hidden="true" />
                            Audit Log
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Action: Active User Icon + Profile, Login & Logout Dropdown */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center rounded-xl border border-white/15 bg-brand-navy p-1 text-[11px] font-bold xl:flex">
                <button
                  type="button"
                  onClick={() => setActiveRoleView('guru_piket')}
                  className={`rounded-lg px-2.5 py-1.5 micro-tap ${activeRoleView === 'guru_piket'
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-sky-300 hover:text-white'
                    }`}
                >
                  Guru Piket
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRoleView('siswa')}
                  className={`rounded-lg px-2.5 py-1.5 micro-tap ${activeRoleView === 'siswa'
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-sky-300 hover:text-white'
                    }`}
                >
                  Siswa
                </button>
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAdminDropdownOpen(false);
                    setUserDropdownOpen(!userDropdownOpen);
                  }}
                  className={`min-h-[44px] flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left micro-tap ${userDropdownOpen
                    ? 'border-cyan-400 bg-brand-navy-light ring-2 ring-cyan-400/30'
                    : 'border-white/20 bg-white/10 hover:bg-white/15'
                    }`}
                  aria-label="Menu Profil Pengguna, Login & Logout"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue text-white">
                    <User className="h-4 w-4" aria-hidden="true" />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-brand-navy-dark ${isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                    />
                  </div>
                  <div className="hidden sm:block max-w-[140px]">
                    <p className="truncate text-xs font-black text-white leading-tight">
                      {displayName}
                    </p>
                    <p className="truncate text-[10px] font-bold text-cyan-300 leading-tight">
                      {displayRoleLabel}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-sky-200 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-cyan-300' : ''
                      }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(false);
                  setAdminDropdownOpen(false);
                  setMobileMenuOpen(true);
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white hover:bg-white/20 micro-tap lg:hidden"
                aria-label="Buka navigasi menu"
              >
                <Menu className="h-5 w-5 text-sky-200" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* USER PROFILE, LOGIN & LOGOUT DROPDOWN PORTAL */}
      {mounted &&
        userDropdownOpen &&
        createPortal(
          <div className="fixed inset-0 z-overlay">
            <div
              className="fixed inset-0 bg-slate-950/25"
              onClick={() => setUserDropdownOpen(false)}
              aria-hidden="true"
            />

            <div className="fixed inset-x-0 top-[68px] z-modal mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pointer-events-none flex justify-end">
              <div
                className="pointer-events-auto w-full max-w-[340px] overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-elev-5 animate-slide-up"
                role="menu"
                aria-label="Menu Akun dan Profil Pengguna"
              >
                <div className="bg-brand-navy-dark p-4 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-brand-blue text-white">
                        <User className="h-5 w-5" aria-hidden="true" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-900 ${isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'
                            }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white leading-snug">
                          {displayName}
                        </p>
                        <p className="truncate text-[11px] font-mono text-sky-200/90 mt-0.5">
                          {displaySub}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                            {displayRoleLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen(false)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-sky-200/80 hover:bg-white/10 hover:text-white micro-tap"
                      aria-label="Tutup dropdown profil"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4 bg-white">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Simulasi Peran Cepat (RBAC)
                      </span>
                      <span className="text-[10px] font-bold text-brand-blue">1-Klik Aktif</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={async () => {
                          await loginAsDemoRole('super_admin');
                          setUserDropdownOpen(false);
                          notify.info('Beralih ke peran Super Admin (UBSI)', 'Mode RBAC');
                        }}
                        className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold text-left border micro-tap ${role === 'super_admin' && !isStudent
                          ? 'bg-amber-50 border-amber-400 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
                        <span className="truncate">Super Admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await loginAsDemoRole('guru_piket');
                          setUserDropdownOpen(false);
                          notify.info('Beralih ke peran Guru Piket', 'Mode RBAC');
                        }}
                        className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold text-left border micro-tap ${role === 'guru_piket' && !isStudent
                          ? 'bg-brand-blue-50 border-brand-blue text-brand-blue'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <Truck className="w-3.5 h-3.5 text-brand-blue shrink-0" aria-hidden="true" />
                        <span className="truncate">Guru Piket</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await loginAsDemoRole('kepala_sekolah');
                          setUserDropdownOpen(false);
                          notify.info('Beralih ke peran Kepala Sekolah', 'Mode RBAC');
                        }}
                        className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold text-left border micro-tap ${role === 'kepala_sekolah' && !isStudent
                          ? 'bg-purple-50 border-purple-400 text-purple-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" aria-hidden="true" />
                        <span className="truncate">Kepala Sekolah</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await signInStudent('Alroy Theola Ardanta', '6281234567890');
                          setUserDropdownOpen(false);
                          notify.info('Beralih ke akun Siswa (Alroy Theola Ardanta)', 'Mode RBAC');
                        }}
                        className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold text-left border micro-tap ${isStudent
                          ? 'bg-cyan-50 border-cyan-500 text-cyan-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        <GraduationCap className="w-3.5 h-3.5 text-cyan-600 shrink-0" aria-hidden="true" />
                        <span className="truncate">Akun Siswa</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={handleOpenProfileModal}
                      className="min-h-[44px] flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-800 micro-tap"
                    >
                      <span className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                        Profil Saya & Hak Akses
                      </span>
                    </button>

                    <Link
                      href="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="min-h-[44px] flex w-full items-center justify-between rounded-xl border border-brand-blue-100 bg-brand-blue-50 hover:bg-brand-blue-100/70 px-3.5 py-2.5 text-xs font-bold text-brand-navy micro-tap"
                    >
                      <span className="flex items-center gap-2.5">
                        <LogIn className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                        {isLoggedIn ? 'Ganti Akun / Halaman Login' : 'Login Petugas / Siswa'}
                      </span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleFullLogout}
                      className="min-h-[44px] flex w-full items-center justify-between rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-3.5 py-2.5 text-xs font-bold text-red-700 micro-tap"
                    >
                      <span className="flex items-center gap-2.5">
                        <LogOut className="h-4 w-4 text-red-600" aria-hidden="true" />
                        Logout (Keluar Akun)
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {mobileModal}

      {/* Modal Profil Pengguna Aktif */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Profil Pengguna Aktif"
        description={SEED_SCHOOL.nama_sekolah}
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-600">Status Sesi:</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {isLoggedIn ? 'Terautentikasi Aktif' : 'Mode Pratinjau / Tamu'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-600">Peran (RBAC):</span>
              <span className="font-black text-brand-navy uppercase">{displayRoleLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-600">
                {student ? 'Nomor WhatsApp:' : 'Email / Kontak:'}
              </span>
              <span className="font-mono font-bold text-slate-800">{displaySub}</span>
            </div>
            {student && (
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600">NISN / Kelas:</span>
                <span className="font-mono font-bold text-slate-800">
                  {student.nisn} ({student.nama_kelas})
                </span>
              </div>
            )}
          </div>

          {isLoggedIn && (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <Input
                label="Ubah Nama Tampilan"
                required
                value={editNameValue}
                onChange={(e) => setEditNameValue(e.target.value)}
              />
              <Button type="submit" variant="primary" fullWidth loading={savingProfile}>
                Simpan Nama Profil
              </Button>
            </form>
          )}

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
            <Link
              href="/login"
              onClick={() => setProfileModalOpen(false)}
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-800 micro-tap"
            >
              <LogIn className="h-4 w-4 text-brand-blue" aria-hidden="true" />
              Ganti Akun
            </Link>
            <Button type="button" variant="danger" onClick={handleFullLogout} leftIcon={<LogOut className="h-4 w-4" />}>
              Logout Sesi
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
