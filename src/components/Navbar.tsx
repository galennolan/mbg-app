'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Utensils,
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
  Sparkles,
  ArrowRight,
  Activity,
  CheckCircle2,
  Lock,
  Layers,
  School,
  User,
  Megaphone,
  Settings,
  Edit2,
  Mail,
  Phone,
} from 'lucide-react';
import { SEED_SCHOOL } from '@/lib/services';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
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
    } finally {
      setSavingProfile(false);
    }
  };

  const handleFullLogout = async () => {
    await signOut();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
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
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
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

  // ========================================================
  // TOP GLASSMORPHISM MODAL MENU PORTAL (Rendered at Root Body)
  // ========================================================
  const mobileModal =
    mounted && mobileMenuOpen ? (
      createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-start overflow-y-auto bg-slate-950/85 p-3 sm:p-6 backdrop-blur-2xl transition-all duration-300"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop click to close */}
          <div
            className="fixed inset-0 -z-10"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Floating Sheet Container */}
          <div className="relative my-auto w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.85)] sm:p-7 space-y-5 animate-fade-in">
            {/* Ambient Background Glow Orbs */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-600/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/25 blur-3xl" />

            {/* Modal Header */}
            <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-gradient-to-br from-blue-700 to-indigo-900 shadow-xl shadow-blue-900/50">
                  <span className="text-base font-black tracking-tighter text-white">BSI</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black tracking-wide text-white">
                      OMPRENG HUB
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
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
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-sky-200 shadow-sm transition hover:bg-white/20 hover:text-white active:scale-95"
                aria-label="Tutup menu navigasi"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Segmented Control Role Switcher */}
            <div className="relative z-10 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-sky-200">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
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
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition ${
                    activeRoleView === 'guru_piket'
                      ? 'border border-white/25 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-sky-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Truck className="h-4 w-4" />
                  Guru Piket
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRoleView('siswa')}
                  className={`flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-bold transition ${
                    activeRoleView === 'siswa'
                      ? 'border border-white/25 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-sky-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  Siswa / Scan
                </button>
              </div>
            </div>

            {/* Bento Grid Menu Items */}
            <div className="relative z-10 space-y-2.5">
              {/* Primary Student Card */}
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`group flex items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                  isActive('/')
                    ? 'border-cyan-400/70 bg-blue-600/30 shadow-lg shadow-cyan-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 transition group-hover:scale-105">
                    <QrCode className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-white transition group-hover:text-cyan-200">
                        Portal Siswa (Scan Master QR)
                      </h3>
                      <span className="rounded-md border border-cyan-400/30 bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200">
                        Siswa
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-sky-200/80">
                      Kamera scan QR atau input PIN 4-digit harian.
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-sky-300 transition group-hover:translate-x-1 group-hover:text-white" />
              </Link>

              {/* Staff Menus */}
              {isStaff && (
                <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-2">
                  {/* Kedatangan MBG */}
                  <Link
                    href="/kedatangan"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                      isActive('/kedatangan')
                        ? 'border-blue-400/70 bg-blue-600/30 shadow-lg shadow-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md transition group-hover:scale-105">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white transition group-hover:text-sky-200">
                          Kedatangan MBG
                        </h4>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-sky-200/80">
                          Uji QC, foto sampel & QR.
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-sky-300 transition group-hover:translate-x-1" />
                  </Link>

                  {/* Live Monitoring */}
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                      isActive('/dashboard')
                        ? 'border-emerald-400/70 bg-emerald-600/30 shadow-lg shadow-emerald-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md transition group-hover:scale-105">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white transition group-hover:text-emerald-200">
                          Live Monitor
                        </h4>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-sky-200/80">
                          Feed anti-fraud & kuota kelas.
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-sky-300 transition group-hover:translate-x-1" />
                  </Link>

                  {/* Konfirmasi Kelas */}
                  <Link
                    href="/konfirmasi/kelas"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                      isActive('/konfirmasi/kelas')
                        ? 'border-indigo-400/70 bg-indigo-600/30 shadow-lg shadow-indigo-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-md transition group-hover:scale-105">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white transition group-hover:text-indigo-200">
                          Konfirmasi Kelas
                        </h4>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-sky-200/80">
                          Checklist massal kolektif.
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-sky-300 transition group-hover:translate-x-1" />
                  </Link>

                  {/* Laporan */}
                  <Link
                    href="/laporan"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                      isActive('/laporan')
                        ? 'border-purple-400/70 bg-purple-600/30 shadow-lg shadow-purple-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-700 text-white shadow-md transition group-hover:scale-105">
                        <FileSpreadsheet className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white transition group-hover:text-pink-200">
                          Laporan & SPPG
                        </h4>
                        <p className="mt-0.5 line-clamp-1 text-[10px] text-sky-200/80">
                          Export Excel & rekap ompreng.
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-sky-300 transition group-hover:translate-x-1" />
                  </Link>
                </div>
              )}

              {/* Super Admin Quick Links */}
              {isSuperAdmin && (
                <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Master Menu Super Admin (Marcomm UBSI)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Link
                      href="/admin/campaign"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-xl border border-amber-400/30 bg-amber-500/10 p-2 text-center transition hover:bg-amber-500/20"
                    >
                      <Megaphone className="mx-auto mb-1 h-4 w-4 text-amber-300" />
                      <span className="block text-[10px] font-bold text-white">Campaign CRM</span>
                    </Link>
                    <Link
                      href="/siswa"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-xl border border-white/10 bg-white/5 p-2 text-center transition hover:bg-white/10"
                    >
                      <GraduationCap className="mx-auto mb-1 h-4 w-4 text-sky-300" />
                      <span className="block text-[10px] font-bold text-white">Data Siswa</span>
                    </Link>
                    <Link
                      href="/admin/pengguna"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-xl border border-white/10 bg-white/5 p-2 text-center transition hover:bg-white/10"
                    >
                      <UserCheck className="mx-auto mb-1 h-4 w-4 text-sky-300" />
                      <span className="block text-[10px] font-bold text-white">Kelola Pengguna</span>
                    </Link>
                    <Link
                      href="/admin/audit"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-xl border border-white/10 bg-white/5 p-2 text-center transition hover:bg-white/10"
                    >
                      <History className="mx-auto mb-1 h-4 w-4 text-sky-300" />
                      <span className="block text-[10px] font-bold text-white">Audit Log</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom: User Profile / Student Profile / Quick Login & Logout */}
            <div className="relative z-10 space-y-2.5 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/15 bg-white/5 p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/25 bg-gradient-to-br from-blue-600 to-cyan-600 text-sm font-black text-white shadow-md">
                    <User className="h-5 w-5" />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 ${
                        isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-black text-white">{displayName}</p>
                      <span className="rounded-md bg-blue-500/30 border border-blue-400/30 px-1.5 py-0.5 text-[9px] font-bold text-cyan-200">
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
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/10 py-2.5 px-3 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95"
                >
                  <User className="h-3.5 w-3.5 text-cyan-300" />
                  Profil
                </button>

                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-400/30 bg-blue-600/30 py-2.5 px-3 text-xs font-bold text-sky-100 transition hover:bg-blue-600/50 active:scale-95"
                >
                  <LogIn className="h-3.5 w-3.5 text-sky-300" />
                  {isLoggedIn ? 'Ganti Akun' : 'Login'}
                </Link>

                <button
                  type="button"
                  onClick={handleFullLogout}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/20 py-2.5 px-3 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30 active:scale-95"
                >
                  <LogOut className="h-3.5 w-3.5 text-rose-300" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )
    ) : null;

  return (
    <>
      <nav className="sticky top-0 z-[100] border-b border-white/10 bg-blue-950/95 text-white shadow-[0_8px_30px_rgba(15,30,54,0.25)] backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & UBSI Brand (DBD Section 3.1) */}
            <div className="flex items-center gap-3">
              <Link href="/" className="group flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-blue-900 shadow-inner transition group-hover:scale-105">
                  <span className="text-sm font-black tracking-tighter text-white">BSI</span>
                </div>
                <div>
                  <span className="block text-sm font-black leading-tight tracking-wider text-white">
                    OMPRENG HUB
                  </span>
                  <span className="block text-[10px] font-normal leading-none text-sky-200">
                    Universitas Bina Sarana Informatika
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - RBAC Protected */}
            <div className="hidden items-center space-x-1 lg:flex">
              {/* Always accessible: Siswa Scan Portal */}
              <Link
                href="/"
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  isActive('/')
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                    : 'text-sky-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                Portal Siswa (Scan)
              </Link>

              {/* Guru Piket & Staff Accessible Menus (RBAC Tahap 4) */}
              {isStaff && (
                <>
                  <Link
                    href="/kedatangan"
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive('/kedatangan')
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                        : 'text-sky-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Truck className="h-3.5 w-3.5" />
                    Kedatangan MBG
                  </Link>

                  <Link
                    href="/dashboard"
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive('/dashboard')
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                        : 'text-sky-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Live Monitor
                  </Link>

                  <Link
                    href="/konfirmasi/kelas"
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive('/konfirmasi/kelas')
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                        : 'text-sky-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Users className="h-3.5 w-3.5" />
                    Konfirmasi Kelas
                  </Link>

                  <Link
                    href="/laporan"
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                      isActive('/laporan')
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                        : 'text-sky-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                    Laporan
                  </Link>

                  {/* Super Admin Manage Dropdown */}
                  {isSuperAdmin && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setAdminDropdownOpen(!adminDropdownOpen);
                        }}
                        className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-sky-200 transition hover:bg-white/10 hover:text-white"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                        Super Admin
                        <ChevronDown className="ml-0.5 h-3 w-3" />
                      </button>

                      {adminDropdownOpen && (
                        <div
                          className="absolute right-0 z-[200] mt-2 w-60 rounded-2xl border border-slate-700 bg-slate-900 py-2 text-white shadow-2xl animate-fade-in"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <Link
                            href="/admin/campaign"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-white/10"
                          >
                            <Megaphone className="h-4 w-4 text-amber-300" />
                            Campaign Manager (CRM)
                          </Link>
                          <Link
                            href="/siswa"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-sky-100 hover:bg-white/10"
                          >
                            <GraduationCap className="h-4 w-4 text-sky-300" />
                            Data Siswa
                          </Link>
                          <Link
                            href="/admin/pengguna"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-sky-100 hover:bg-white/10"
                          >
                            <Users className="h-4 w-4 text-sky-300" />
                            Kelola Pengguna
                          </Link>
                          <Link
                            href="/admin/audit"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-sky-100 hover:bg-white/10"
                          >
                            <History className="h-4 w-4 text-sky-300" />
                            Audit Log
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Action: Active User Icon + Profile, Login & Logout Dropdown (Visible on ALL Screens!) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick Role Switcher for instant testing on Desktop */}
              <div className="hidden items-center rounded-xl border border-white/15 bg-blue-900/80 p-1 text-[11px] font-bold xl:flex">
                <button
                  type="button"
                  onClick={() => setActiveRoleView('guru_piket')}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    activeRoleView === 'guru_piket'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-sky-300 hover:text-white'
                  }`}
                >
                  Guru Piket
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRoleView('siswa')}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    activeRoleView === 'siswa'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-sky-300 hover:text-white'
                  }`}
                >
                  Siswa
                </button>
              </div>

              {/* Active User Icon & Profile Popover Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAdminDropdownOpen(false);
                    setUserDropdownOpen(!userDropdownOpen);
                  }}
                  className={`flex items-center gap-2 rounded-2xl border px-2.5 py-1.5 text-left transition-all duration-200 active:scale-95 shadow-sm ${
                    userDropdownOpen
                      ? 'border-cyan-400 bg-blue-800 ring-2 ring-cyan-400/30'
                      : 'border-white/20 bg-white/10 hover:bg-white/15'
                  }`}
                  aria-label="Menu Profil Pengguna, Login & Logout"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-inner">
                    <User className="h-4 w-4" />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-blue-950 ${
                        isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'
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
                    className={`h-3.5 w-3.5 text-sky-200 transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180 text-cyan-300' : ''
                    }`}
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
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-sm transition hover:bg-white/20 active:scale-95 lg:hidden"
                aria-label="Buka navigasi menu"
              >
                <Menu className="h-5 w-5 text-sky-200" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* USER PROFILE, LOGIN & LOGOUT DROPDOWN PORTAL (Rendered at document.body with z-[9999]) */}
      {mounted &&
        userDropdownOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9998]">
            {/* Fullscreen click-outside backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/25 backdrop-blur-[1px]"
              onClick={() => setUserDropdownOpen(false)}
              aria-hidden="true"
            />

            {/* Positioned Dropdown Container aligned to top-right below Navbar */}
            <div className="fixed inset-x-0 top-[68px] z-[9999] mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pointer-events-none flex justify-end">
              <div
                className="pointer-events-auto w-full max-w-[330px] overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.4)] animate-slide-up"
                role="menu"
                aria-label="Menu Akun dan Profil Pengguna"
              >
                {/* Solid Navy Header Banner */}
                <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 p-4 text-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
                        <User className="h-6 w-6" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${
                            isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            <ShieldCheck className="h-3 w-3" />
                            {displayRoleLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setUserDropdownOpen(false)}
                      className="rounded-xl p-1.5 text-sky-200/80 hover:bg-white/10 hover:text-white transition"
                      aria-label="Tutup dropdown profil"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Solid White Body Content */}
                <div className="p-4 space-y-4 bg-white">
                  {/* Quick Role Switcher (Simulasi Cepat RBAC) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
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
                        }}
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold text-left border transition active:scale-95 ${
                          role === 'super_admin' && !isStudent
                            ? 'bg-amber-50 border-amber-400 text-amber-900 ring-1 ring-amber-400/40'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>👑</span>
                        <span className="truncate">Super Admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await loginAsDemoRole('guru_piket');
                          setUserDropdownOpen(false);
                        }}
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold text-left border transition active:scale-95 ${
                          role === 'guru_piket' && !isStudent
                            ? 'bg-blue-50 border-brand-blue text-brand-blue ring-1 ring-brand-blue/30'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>📋</span>
                        <span className="truncate">Guru Piket</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await loginAsDemoRole('kepala_sekolah');
                          setUserDropdownOpen(false);
                        }}
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold text-left border transition active:scale-95 ${
                          role === 'kepala_sekolah' && !isStudent
                            ? 'bg-purple-50 border-purple-400 text-purple-900 ring-1 ring-purple-400/30'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>🎓</span>
                        <span className="truncate">Kepala Sekolah</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await signInStudent('Alroy Theola Ardanta', '6281234567890');
                          setUserDropdownOpen(false);
                        }}
                        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold text-left border transition active:scale-95 ${
                          isStudent
                            ? 'bg-cyan-50 border-cyan-500 text-cyan-900 ring-1 ring-cyan-400/30'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>🎒</span>
                        <span className="truncate">Akun Siswa</span>
                      </button>
                    </div>
                  </div>

                  {/* Action Buttons: Profile, Login, Logout */}
                  <div className="space-y-1.5 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={handleOpenProfileModal}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-800 transition active:scale-[0.99]"
                    >
                      <span className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-brand-blue" />
                        Profil Saya & Hak Akses
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </button>

                    <Link
                      href="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex w-full items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 px-3.5 py-2.5 text-xs font-bold text-brand-navy transition active:scale-[0.99]"
                    >
                      <span className="flex items-center gap-2.5">
                        <LogIn className="h-4 w-4 text-brand-blue" />
                        {isLoggedIn ? 'Ganti Akun / Halaman Login' : 'Login Petugas / Siswa'}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-brand-blue" />
                    </Link>

                    <button
                      type="button"
                      onClick={handleFullLogout}
                      className="flex w-full items-center justify-between rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3.5 py-2.5 text-xs font-bold text-rose-700 transition active:scale-[0.99]"
                    >
                      <span className="flex items-center gap-2.5">
                        <LogOut className="h-4 w-4 text-rose-600" />
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

      {/* Render Modal via React Portal directly at document.body */}
      {mobileModal}

      {/* Modal Profil Pengguna Aktif */}
      {mounted &&
        profileModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xl animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="fixed inset-0 -z-10"
              onClick={() => setProfileModalOpen(false)}
              aria-hidden="true"
            />
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-cyan-500 text-white shadow-md">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Profil Pengguna Aktif</h3>
                    <p className="text-xs text-slate-500">{SEED_SCHOOL.nama_sekolah}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileModalOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Status Sesi:</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {isLoggedIn ? 'Terautentikasi Aktif' : 'Mode Pratinjau / Tamu'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Peran (RBAC):</span>
                  <span className="font-black text-brand-navy uppercase">{displayRoleLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">
                    {student ? 'Nomor WhatsApp:' : 'Email / Kontak:'}
                  </span>
                  <span className="font-mono font-bold text-slate-800">{displaySub}</span>
                </div>
                {student && (
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">NISN / Kelas:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {student.nisn} ({student.nama_kelas})
                    </span>
                  </div>
                )}
              </div>

              {isLoggedIn && (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Ubah Nama Tampilan
                    </label>
                    <input
                      type="text"
                      required
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                  >
                    {savingProfile ? 'Menyimpan...' : 'Simpan Nama Profil'}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                <Link
                  href="/login"
                  onClick={() => setProfileModalOpen(false)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 py-3 text-xs font-bold text-slate-800 transition active:scale-95"
                >
                  <LogIn className="h-4 w-4 text-brand-blue" />
                  Ganti Akun / Login
                </Link>
                <button
                  type="button"
                  onClick={handleFullLogout}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 py-3 text-xs font-bold text-white shadow-md transition active:scale-95"
                >
                  <LogOut className="h-4 w-4" />
                  Logout Sesi
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
