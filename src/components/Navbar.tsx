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
  Building2,
  Sparkles,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { SEED_SCHOOL } from '@/lib/services';
import { Modal, ModalBody, ModalHeader, ModalFooter, Input, Button, useNotify } from '@/components/ui';

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
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Theme Logic
  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
    setTheme(savedTheme);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    localStorage.setItem('theme', theme);
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      if (systemTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const root = window.document.documentElement;
      if (mediaQuery.matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

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

  const MobileNavModal = () => (
    <Modal
      isOpen={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
      title="NUTRI KAMPUS HUB"
      description="Sistem Operasional MBG • Universitas BSI"
      size="xl"
      className="bg-brand-navy-dark text-white border-slate-800"
    >
      <div className="space-y-6">
        {/* Visual Header with BSI Logo - Inside Modal Content */}
        <div className="flex items-center gap-4 pb-4 border-b border-white/10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-brand-blue text-white shadow-sm">
            <span className="text-sm font-black tracking-tighter">BSI</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-wide text-white">
                NAVIGASI UTAMA
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Sesi Aktif
              </span>
            </div>
            <p className="text-xs text-sky-200">Akses Cepat Layanan & Portal MBG</p>
          </div>
        </div>

        {/* Theme Switcher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-sky-200/70 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              Tampilan Aplikasi
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-1.5">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-3 text-[10px] font-bold transition-all micro-tap ${theme === 'light'
                ? 'bg-brand-blue text-white shadow-elev-2'
                : 'text-sky-300 hover:bg-surface-card/5 hover:text-white'
                }`}
            >
              <Sun className="h-4 w-4" aria-hidden="true" />
              Light
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-3 text-[10px] font-bold transition-all micro-tap ${theme === 'dark'
                ? 'bg-brand-blue text-white shadow-elev-2'
                : 'text-sky-300 hover:bg-surface-card/5 hover:text-white'
                }`}
            >
              <Moon className="h-4 w-4" aria-hidden="true" />
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-1 rounded-xl py-2 px-3 text-[10px] font-bold transition-all micro-tap ${theme === 'system'
                ? 'bg-brand-blue text-white shadow-elev-2'
                : 'text-sky-300 hover:bg-surface-card/5 hover:text-white'
                }`}
            >
              <Monitor className="h-4 w-4" aria-hidden="true" />
              System
            </button>
          </div>
        </div>

        {/* Segmented Control Role Switcher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-sky-200/70 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
              Role Switcher (RBAC)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-slate-950/50 p-1.5">
            <button
              type="button"
              onClick={() => setActiveRoleView('guru_piket')}
              className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all micro-tap ${activeRoleView === 'guru_piket'
                ? 'bg-brand-blue text-white shadow-elev-2'
                : 'text-sky-300 hover:bg-surface-card/5 hover:text-white'
                }`}
            >
              <Truck className="h-4 w-4" aria-hidden="true" />
              Guru Piket
            </button>
            <button
              type="button"
              onClick={() => setActiveRoleView('siswa')}
              className={`min-h-[44px] flex items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-bold transition-all micro-tap ${activeRoleView === 'siswa'
                ? 'bg-brand-blue text-white shadow-elev-2'
                : 'text-sky-300 hover:bg-surface-card/5 hover:text-white'
                }`}
            >
              <QrCode className="h-4 w-4" aria-hidden="true" />
              Mode Siswa
            </button>
          </div>
        </div>

        {/* Navigation Menu Items */}
        <div className="grid grid-cols-1 gap-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`group flex items-center justify-between gap-4 rounded-2xl border p-4 transition-all micro-tap ${isActive('/')
              ? 'border-cyan-400/50 bg-brand-blue/20'
              : 'border-white/10 bg-surface-card/5 hover:border-white/20 hover:bg-surface-card/10'
              }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white shadow-sm group-hover:scale-105 transition-transform">
                <QrCode className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">Portal Siswa</h3>
                  <span className="rounded-md border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300">
                    Quick Access
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-sky-200/60 leading-tight">
                  Scan QR atau input PIN harian.
                </p>
              </div>
            </div>
            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-surface-card/5 text-sky-300 group-hover:bg-brand-blue group-hover:text-white transition-colors">
              <ExternalLink className="h-4 w-4" />
            </div>
          </Link>

          {isStaff && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { href: '/kedatangan', label: 'Kedatangan MBG', desc: 'Uji QC & Sampel', icon: Truck, color: 'blue' },
                { href: '/dashboard', label: 'Live Monitor', desc: 'Anti-Fraud Feed', icon: Activity, color: 'emerald' },
                { href: '/konfirmasi/kelas', label: 'Konfirmasi Kelas', desc: 'Checklist Massal', icon: Users, color: 'navy' },
                { href: '/admin/kelas', label: 'Kelola Kelas', desc: 'CRUD Data Rombel', icon: Building2, color: 'blue' },
                { href: '/siswa', label: 'Data Siswa & Import', desc: 'CRUD & Import Excel', icon: GraduationCap, color: 'emerald' },
                { href: '/laporan', label: 'Laporan & SPPG', desc: 'Export Data Excel', icon: FileSpreadsheet, color: 'blue' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 rounded-2xl border p-4 transition-all micro-tap ${isActive(item.href)
                    ? 'border-blue-400/50 bg-brand-blue/20'
                    : 'border-white/10 bg-surface-card/5 hover:border-white/20 hover:bg-surface-card/10'
                    }`}
                >
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-${item.color === 'emerald' ? 'green' : item.color === 'navy' ? 'navy-light' : 'blue'} text-white shadow-sm`}>
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">{item.label}</h4>
                    <p className="mt-0.5 text-[10px] text-sky-200/60 leading-tight">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {isSuperAdmin && (
            <div className="mt-2 space-y-3 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Admin Privileges
              </span>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/admin/campaign"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-surface-card/5 p-3 hover:bg-surface-card/10 transition-colors"
                >
                  <Megaphone className="h-4 w-4 text-amber-300" aria-hidden="true" />
                  <span className="text-[10px] font-bold text-white">Campaign</span>
                </Link>
                <Link
                  href="/admin/pengguna"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-white/5 bg-surface-card/5 p-3 hover:bg-surface-card/10 transition-colors"
                >
                  <UserCheck className="h-4 w-4 text-sky-300" aria-hidden="true" />
                  <span className="text-[10px] font-bold text-white">Pengguna</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Quick Info & Profile Actions */}
        <div className="mt-2 space-y-3 border-t border-white/10 pt-6">
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-brand-blue text-white shadow-elev-2">
                <User className="h-6 w-6" aria-hidden="true" />
                <span
                  className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 ${isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'}`}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{displayName}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="rounded bg-brand-blue/30 px-1.5 py-0.5 text-[9px] font-bold text-cyan-200">
                    {displayRoleLabel}
                  </span>
                  <p className="truncate font-mono text-[10px] text-sky-300/60">{displaySub}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              type="button"
              onClick={handleOpenProfileModal}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-surface-card/5 py-3 px-1.5 text-[10px] font-bold text-white hover:bg-surface-card/10 transition-colors micro-tap"
            >
              <User className="h-4 w-4 text-cyan-400" aria-hidden="true" />
              Profil
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('mbg:show-splash'));
              }}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-500/10 py-3 px-1.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/20 transition-colors micro-tap"
              title="Putar ulang splash screen mobile"
            >
              <Sparkles className="h-4 w-4 text-cyan-300" aria-hidden="true" />
              Splash
            </button>

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-blue-400/20 bg-brand-blue/20 py-3 px-1.5 text-[10px] font-bold text-sky-100 hover:bg-brand-blue/30 transition-colors micro-tap"
            >
              <LogIn className="h-4 w-4 text-sky-400" aria-hidden="true" />
              {isLoggedIn ? 'Ganti' : 'Login'}
            </Link>

            <button
              type="button"
              onClick={handleFullLogout}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 py-3 px-1.5 text-[10px] font-bold text-red-200 hover:bg-red-500/20 transition-colors micro-tap"
            >
              <LogOut className="h-4 w-4 text-red-400" aria-hidden="true" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );

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
                  : 'text-sky-200 hover:bg-surface-card/10 hover:text-white'
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
                      : 'text-sky-200 hover:bg-surface-card/10 hover:text-white'
                      }`}
                  >
                    <Truck className="h-3.5 w-3.5" aria-hidden="true" />
                    Kedatangan MBG
                  </Link>

                  <Link
                    href="/dashboard"
                    className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold micro-tap ${isActive('/dashboard')
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-sky-200 hover:bg-surface-card/10 hover:text-white'
                      }`}
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                    Live Monitor
                  </Link>

                  <Link
                    href="/konfirmasi/kelas"
                    className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold micro-tap ${isActive('/konfirmasi/kelas')
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-sky-200 hover:bg-surface-card/10 hover:text-white'
                      }`}
                  >
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    Konfirmasi Kelas
                  </Link>

                  <Link
                    href="/admin/kelas"
                    className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold micro-tap ${isActive('/admin/kelas')
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-sky-200 hover:bg-surface-card/10 hover:text-white'
                      }`}
                  >
                    <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Data Kelas
                  </Link>

                  <Link
                    href="/siswa"
                    className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold micro-tap ${isActive('/siswa')
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-sky-200 hover:bg-surface-card/10 hover:text-white'
                      }`}
                  >
                    <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                    Data Siswa
                  </Link>

                  <Link
                    href="/laporan"
                    className={`min-h-[40px] flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold micro-tap ${isActive('/laporan')
                      ? 'bg-brand-blue text-white shadow-sm'
                      : 'text-sky-200 hover:bg-surface-card/10 hover:text-white'
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
                        className="min-h-[40px] flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-sky-200 micro-tap hover:bg-surface-card/10 hover:text-white"
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
                            href="/admin/sekolah"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-cyan-200 hover:bg-surface-card/10"
                          >
                            <Building2 className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                            Manajemen Sekolah (SaaS)
                          </Link>
                          <Link
                            href="/admin/kelas"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-sky-100 hover:bg-surface-card/10"
                          >
                            <Users className="h-4 w-4 text-sky-300" aria-hidden="true" />
                            Manajemen Kelas
                          </Link>
                          <Link
                            href="/admin/campaign"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-amber-200 hover:bg-surface-card/10"
                          >
                            <Megaphone className="h-4 w-4 text-amber-300" aria-hidden="true" />
                            Campaign Manager (CRM)
                          </Link>
                          <Link
                            href="/siswa"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-sky-100 hover:bg-surface-card/10"
                          >
                            <GraduationCap className="h-4 w-4 text-sky-300" aria-hidden="true" />
                            Data Siswa
                          </Link>
                          <Link
                            href="/admin/pengguna"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-sky-100 hover:bg-surface-card/10"
                          >
                            <UserCheck className="h-4 w-4 text-sky-300" aria-hidden="true" />
                            Kelola Pengguna
                          </Link>
                          <Link
                            href="/admin/audit"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-sky-100 hover:bg-surface-card/10"
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
              <div className="flex items-center rounded-xl border border-white/10 bg-slate-950/50 p-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`rounded-lg p-2 transition-all ${theme === 'light'
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-sky-300 hover:text-white'
                    }`}
                  title="Light Mode"
                >
                  <Sun className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`rounded-lg p-2 transition-all ${theme === 'dark'
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-sky-300 hover:text-white'
                    }`}
                  title="Dark Mode"
                >
                  <Moon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`rounded-lg p-2 transition-all ${theme === 'system'
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'text-sky-300 hover:text-white'
                    }`}
                  title="System Theme"
                >
                  <Monitor className="h-4 w-4" />
                </button>
              </div>

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
                    : 'border-white/20 bg-surface-card/10 hover:bg-surface-card/15'
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
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-white/15 bg-surface-card/10 text-white hover:bg-surface-card/20 micro-tap lg:hidden"
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
                className="pointer-events-auto w-full max-w-[340px] overflow-hidden rounded-3xl border border-slate-200 bg-surface-card text-text-primary shadow-elev-5 animate-slide-up"
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
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl text-sky-200/80 hover:bg-surface-card/10 hover:text-white micro-tap"
                      aria-label="Tutup dropdown profil"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4 bg-surface-card">
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
                          : 'bg-surface-canvas border-slate-200 text-slate-700 hover:bg-slate-100'
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
                          : 'bg-surface-canvas border-slate-200 text-slate-700 hover:bg-slate-100'
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
                          : 'bg-surface-canvas border-slate-200 text-slate-700 hover:bg-slate-100'
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
                          : 'bg-surface-canvas border-slate-200 text-slate-700 hover:bg-slate-100'
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
                      className="min-h-[44px] flex w-full items-center justify-between rounded-xl border border-slate-200 bg-surface-canvas hover:bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-text-primary micro-tap"
                    >
                      <span className="flex items-center gap-2.5">
                        <User className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                        Profil Saya & Hak Akses
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        window.dispatchEvent(new CustomEvent('mbg:show-splash'));
                      }}
                      className="min-h-[44px] flex w-full items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100/70 px-3.5 py-2.5 text-xs font-bold text-cyan-900 micro-tap"
                    >
                      <span className="flex items-center gap-2.5">
                        <Sparkles className="h-4 w-4 text-cyan-600" aria-hidden="true" />
                        Tampilkan Splash Screen Mobile
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

      {mounted && mobileMenuOpen ? <MobileNavModal /> : null}

      {/* Modal Profil Pengguna Aktif */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Profil Pengguna Aktif"
        description={SEED_SCHOOL.nama_sekolah}
        size="sm"
      >
        <div className="space-y-4">
          <div className="rounded-2xl bg-surface-canvas border border-slate-200 p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-secondary">Status Sesi:</span>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {isLoggedIn ? 'Terautentikasi Aktif' : 'Mode Pratinjau / Tamu'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-secondary">Peran (RBAC):</span>
              <span className="font-black text-brand-navy uppercase">{displayRoleLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-secondary">
                {student ? 'Nomor WhatsApp:' : 'Email / Kontak:'}
              </span>
              <span className="font-mono font-bold text-text-primary">{displaySub}</span>
            </div>
            {student && (
              <div className="flex items-center justify-between">
                <span className="font-bold text-text-secondary">NISN / Kelas:</span>
                <span className="font-mono font-bold text-text-primary">
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
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-text-primary micro-tap"
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
