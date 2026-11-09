'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Active Role State for demo/testing toggle (Guru Piket vs Siswa)
  const [activeRoleView, setActiveRoleView] = useState<'guru_piket' | 'siswa'>('guru_piket');

  const isActive = (path: string) => pathname === path;
  const isStaff = user !== null || activeRoleView === 'guru_piket';
  const isSuperAdmin = role === 'super_admin';

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
      if (e.key === 'Escape') setMobileMenuOpen(false);
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
          <div className="relative my-auto w-full max-w-xl overflow-hidden rounded-[2.5rem] border border-white/20 bg-gradient-to-b from-slate-900/98 via-blue-950/95 to-slate-950/98 p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.85)] sm:p-7 space-y-5 animate-in fade-in slide-in-from-top-6 duration-300">
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
                    Manajemen Administrator
                  </span>
                  <div className="grid grid-cols-3 gap-2">
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

            {/* Modal Bottom: User Profile / Quick Login */}
            <div className="relative z-10 flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              {user ? (
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-gradient-to-br from-blue-600 to-indigo-800 text-xs font-bold text-white">
                      {user.nama?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{user.nama}</p>
                      <span className="font-mono text-[10px] text-sky-300">
                        Peran: {user.peran || 'Guru Piket'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500/25 active:scale-95"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Keluar
                  </button>
                </div>
              ) : (
                <div className="flex w-full items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Belum Masuk?</p>
                    <p className="text-[10px] text-sky-300">Login khusus guru piket & staff</p>
                  </div>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-red-900/30 transition hover:from-red-700 hover:to-rose-700 active:scale-95"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Login Staff
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )
    ) : null;

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-blue-950/95 text-white shadow-[0_8px_30px_rgba(15,30,54,0.25)] backdrop-blur-2xl">
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
                        onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                        className="flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-sky-200 transition hover:bg-white/10 hover:text-white"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
                        Super Admin
                        <ChevronDown className="ml-0.5 h-3 w-3" />
                      </button>

                      {adminDropdownOpen && (
                        <div
                          className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-white/20 bg-slate-900/95 py-2 text-white shadow-2xl backdrop-blur-xl"
                          onClick={() => setAdminDropdownOpen(false)}
                        >
                          <Link
                            href="/siswa"
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-sky-100 hover:bg-white/10"
                          >
                            <GraduationCap className="h-4 w-4 text-sky-300" />
                            Data Siswa
                          </Link>
                          <Link
                            href="/admin/pengguna"
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-sky-100 hover:bg-white/10"
                          >
                            <Users className="h-4 w-4 text-sky-300" />
                            Kelola Pengguna
                          </Link>
                          <Link
                            href="/admin/audit"
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-sky-100 hover:bg-white/10"
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

            {/* Right Action / Role Badge (RBAC Indicator) */}
            <div className="hidden items-center gap-3 lg:flex">
              {/* Quick Role Switcher for instant testing (Guru Piket vs Siswa) */}
              <div className="flex items-center rounded-xl border border-white/15 bg-blue-900/80 p-1 text-[11px] font-bold">
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

              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-sky-200">{user.nama}</span>
                  <button
                    onClick={() => signOut()}
                    className="rounded-xl bg-white/10 p-2 text-sky-200 transition hover:bg-white/20 hover:text-white"
                    title="Keluar"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Hamburger Button with Modern Glass Style */}
            <div className="flex items-center gap-2 lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-sm transition hover:bg-white/20 active:scale-95"
                aria-label="Buka navigasi menu"
              >
                <Menu className="h-5 w-5 text-sky-200" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Render Modal via React Portal directly at document.body */}
      {mobileModal}
    </>
  );
}
