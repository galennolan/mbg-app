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
  Bell,
  ChevronRight,
  Home,
  CheckCheck,
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
    signInStudent,
    updateProfileName,
    signOut,
  } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Monitoring Distribusi MBG Aktif',
      desc: 'Sesi pemantauan penerimaan porsi kelas & verifikasi QR siap digunakan.',
      time: 'Baru saja',
      href: '/dashboard',
      unread: true,
    },
    {
      id: 'notif-2',
      title: 'Checklist Konfirmasi Kelas',
      desc: 'Pastikan presensi dan klaim porsi MBG tiap rombel telah diverifikasi.',
      time: '10 menit lalu',
      href: '/konfirmasi/kelas',
      unread: true,
    },
    {
      id: 'notif-3',
      title: 'Sinkronisasi Master Data Dapodik',
      desc: 'Data rombel dan kuota siswa penerima MBG telah terhubung dengan sekolah aktif.',
      time: 'Hari ini',
      href: '/admin/kelas',
      unread: false,
    },
  ]);
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

  const isActive = (path: string) => pathname === path;
  const isStaff = user !== null && !isStudent;
  const isSuperAdmin = role === 'super_admin' || role === 'admin';
  const isLoggedIn = !!user || !!student;

  const displayName = user
    ? user.nama
    : student
      ? student.nama_lengkap
      : 'Tamu';

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
        : 'Guru PIC MBG'
    : student
      ? `Siswa (${student.nama_kelas})`
      : 'Tamu';

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
        setNotifOpen(false);
        setProfileModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const getBreadcrumbs = (path: string) => {
    const map: Record<string, { group: string; groupHref: string; current: string }> = {
      '/': { group: 'Utama', groupHref: '/', current: 'Portal Siswa (Scan)' },
      '/dashboard': { group: 'Utama', groupHref: '/dashboard', current: 'Monitor Real-time' },
      '/kedatangan': { group: 'Operasional', groupHref: '/kedatangan', current: 'Kedatangan MBG' },
      '/konfirmasi/kelas': {
        group: 'Operasional',
        groupHref: '/konfirmasi/kelas',
        current: 'Konfirmasi Kelas',
      },
      '/konfirmasi/individu': {
        group: 'Operasional',
        groupHref: '/konfirmasi/kelas',
        current: 'Konfirmasi Individu',
      },
      '/laporan': { group: 'Operasional', groupHref: '/laporan', current: 'Laporan & SPPG' },
      '/admin/kelas': { group: 'Master Data', groupHref: '/admin/kelas', current: 'Data Kelas' },
      '/siswa': { group: 'Master Data', groupHref: '/siswa', current: 'Data Siswa' },
      '/admin/sekolah': {
        group: 'Master Data',
        groupHref: '/admin/sekolah',
        current: 'Manajemen Sekolah',
      },
      '/admin/campaign': {
        group: 'Master Data',
        groupHref: '/admin/campaign',
        current: 'Campaign CRM',
      },
      '/admin/pengguna': {
        group: 'Master Data',
        groupHref: '/admin/pengguna',
        current: 'Kelola Pengguna',
      },
      '/admin/audit': { group: 'Master Data', groupHref: '/admin/audit', current: 'Audit Log' },
      '/admin/qrcode': { group: 'Master Data', groupHref: '/admin/qrcode', current: 'Master QR' },
    };

    return (
      map[path] || {
        group: 'Operasional',
        groupHref: '/dashboard',
        current: path.replace(/^\//, '').replace(/\//g, ' / ') || 'Beranda',
      }
    );
  };

  const breadcrumb = getBreadcrumbs(pathname || '/');

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

  if (pathname === '/login' || pathname === '/login-siswa') return null;

  return (
    <>
      <header className="no-print sticky top-0 z-sticky border-b border-surface-border bg-surface-card/90 text-text-primary backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            {/* Left: Mobile BSI Logo + Breadcrumb Navigation */}
            <div className="flex min-w-0 items-center gap-2.5">
              {/* Mobile BSI Brand Logo (Hidden on Desktop since Sidebar already shows it) */}
              <a
                href="https://pmbubsi.id/kampus/surakarta"
                target="_blank"
                rel="noopener noreferrer"
                title="Nutri Kampus Hub · UBSI Surakarta"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/50 bg-gradient-to-tr from-[#0D47A1] via-[#1565C0] to-[#38A3F8] text-white shadow-[0_4px_12px_rgba(21,101,192,0.4)] micro-tap lg:hidden"
              >
                <span className="text-xs font-black tracking-tighter">BSI</span>
              </a>

              <nav aria-label="Breadcrumb" className="min-w-0">
                <ol className="flex min-w-0 items-center gap-1.5 text-xs sm:text-sm">
                  <li className="hidden sm:flex items-center">
                    <Link
                      href={isStaff ? '/dashboard' : '/'}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-text-secondary hover:bg-brand-blue-50 hover:text-brand-blue-700 transition-colors"
                    >
                      <Home className="h-3.5 w-3.5 text-brand-blue-600 shrink-0" aria-hidden="true" />
                      <span className="hidden md:inline">Nutri Kampus</span>
                    </Link>
                  </li>

                  <li aria-hidden="true" className="hidden sm:flex items-center text-slate-300">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>

                  <li className="hidden xs:flex items-center">
                    <Link
                      href={breadcrumb.groupHref}
                      className="rounded-lg px-2 py-1 font-semibold text-text-secondary hover:bg-brand-blue-50 hover:text-brand-blue-700 transition-colors truncate"
                    >
                      {breadcrumb.group}
                    </Link>
                  </li>

                  <li aria-hidden="true" className="hidden xs:flex items-center text-slate-300">
                    <ChevronRight className="h-3.5 w-3.5" />
                  </li>

                  <li aria-current="page" className="min-w-0">
                    <span className="inline-flex items-center gap-1.5 rounded-xl border border-brand-blue-200/80 bg-gradient-to-r from-brand-blue-50 to-brand-blue-100/70 px-3 py-1 text-xs sm:text-[13px] font-extrabold text-brand-blue-800 truncate shadow-sm">
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#0D47A1] to-[#1E88E5] shrink-0"
                        aria-hidden="true"
                      />
                      <span className="truncate">{breadcrumb.current}</span>
                    </span>
                  </li>
                </ol>
              </nav>
            </div>

            {/* Right: Notification Bell & User Account Pill */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Notification Bell & Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    setAdminDropdownOpen(false);
                    setNotifOpen((prev) => !prev);
                  }}
                  aria-label={`Notifikasi${unreadCount > 0 ? `, ${unreadCount} belum dibaca` : ''}`}
                  aria-expanded={notifOpen}
                  className={`relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-all micro-tap cursor-pointer ${
                    notifOpen
                      ? 'border-brand-blue-400 bg-gradient-to-tr from-[#0D47A1] via-[#1565C0] to-[#1E88E5] text-white shadow-[0_4px_12px_rgba(21,101,192,0.35)]'
                      : 'border-surface-border bg-surface-canvas/80 text-text-secondary hover:border-brand-blue-200 hover:bg-brand-blue-50 hover:text-brand-blue-700'
                  }`}
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-[#0D47A1] to-[#1E88E5] px-1 font-mono text-[10px] font-extrabold text-white ring-2 ring-surface-card">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      aria-hidden="true"
                      onClick={() => setNotifOpen(false)}
                    />
                    <div
                      role="dialog"
                      aria-label="Daftar Notifikasi"
                      className="absolute right-0 z-40 mt-2 w-80 sm:w-96 overflow-hidden rounded-2xl border border-surface-border bg-surface-card text-text-primary shadow-elev-4 animate-slide-up"
                    >
                      <div className="flex items-center justify-between border-b border-surface-border bg-gradient-to-r from-[#082552] via-[#0D47A1] to-[#1565C0] px-4 py-3 text-white">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4 text-sky-200" aria-hidden="true" />
                          <span className="text-xs font-extrabold uppercase tracking-wider">
                            Notifikasi Sistem
                          </span>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-sky-400/25 border border-sky-300/40 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-100">
                              {unreadCount} baru
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsRead}
                            className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-sky-100 hover:bg-white/20 transition-colors cursor-pointer"
                          >
                            <CheckCheck className="h-3 w-3" aria-hidden="true" />
                            Tandai dibaca
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 divide-y divide-surface-border overflow-y-auto">
                        {notifications.map((item) => (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={() => {
                              setNotifications((prev) =>
                                prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
                              );
                              setNotifOpen(false);
                            }}
                            className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-brand-blue-50/60 ${
                              item.unread ? 'bg-brand-blue-50/35' : ''
                            }`}
                          >
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                item.unread
                                  ? 'bg-gradient-to-r from-[#0D47A1] to-[#1E88E5]'
                                  : 'bg-slate-300'
                              }`}
                              aria-hidden="true"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate text-xs font-extrabold text-text-primary">
                                  {item.title}
                                </p>
                                <span className="shrink-0 font-mono text-[10px] text-text-secondary">
                                  {item.time}
                                </span>
                              </div>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-text-secondary">
                                {item.desc}
                              </p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      <div className="border-t border-surface-border bg-surface-canvas/60 px-4 py-2.5 text-center">
                        <Link
                          href="/dashboard"
                          onClick={() => setNotifOpen(false)}
                          className="text-[11px] font-bold text-brand-blue-700 hover:text-brand-blue-800"
                        >
                          Buka Live Monitor Distribusi →
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* User Account Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setAdminDropdownOpen(false);
                    setNotifOpen(false);
                    setUserDropdownOpen(!userDropdownOpen);
                  }}
                  className={`min-h-[40px] flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left transition-all micro-tap cursor-pointer ${
                    userDropdownOpen
                      ? 'border-brand-blue-400 bg-brand-blue-50 ring-2 ring-brand-blue-200'
                      : 'border-surface-border bg-surface-canvas/80 hover:border-brand-blue-200 hover:bg-brand-blue-50/60'
                  }`}
                  aria-label="Menu Profil Pengguna, Login & Logout"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#0D47A1] via-[#1565C0] to-[#38A3F8] text-white shadow-sm">
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${
                        isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="hidden sm:block max-w-[140px]">
                    <p className="truncate text-xs font-extrabold text-text-primary leading-tight">
                      {displayName}
                    </p>
                    <p className="truncate text-[10px] font-bold text-brand-blue-600 leading-tight">
                      {displayRoleLabel}
                    </p>
                  </div>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-text-secondary transition-transform duration-200 ${
                      userDropdownOpen ? 'rotate-180 text-brand-blue-600' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Floating Hamburger Menu Button (Above Bottom Navigation) */}
      <button
        type="button"
        onClick={() => {
          setUserDropdownOpen(false);
          setAdminDropdownOpen(false);
          setNotifOpen(false);
          setMobileMenuOpen(true);
        }}
        aria-label="Buka navigasi menu lengkap"
        title="Buka menu navigasi"
        className="no-print fixed right-4 bottom-[calc(5.4rem+env(safe-area-inset-bottom))] z-bottom-nav flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-200/50 bg-gradient-to-tr from-[#0D47A1] via-[#1565C0] to-[#38A3F8] text-white shadow-[0_8px_24px_rgba(13,71,161,0.55)] ring-2 ring-white/20 transition-transform hover:scale-105 active:scale-95 micro-tap lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

{/* USER PROFILE, LOGIN & LOGOUT DROPDOWN - Using Modal like MobileNavModal */}
      {mounted && userDropdownOpen && (
        <Modal
          isOpen={userDropdownOpen}
          onClose={() => setUserDropdownOpen(false)}
          title="Menu Pengguna"
          description="Kelola akun dan preferensi"
          size="md"
          className="bg-brand-navy-dark text-white border-slate-800"
          closeOnEscape={true}
          closeOnOverlayClick={true}
        >
          <div className="space-y-6">
            {/* User Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-brand-blue text-white shadow-sm">
                <User className="h-6 w-6" aria-hidden="true" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 ${isLoggedIn ? 'bg-emerald-400' : 'bg-amber-400'}`}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white leading-snug">{displayName}</p>
                <p className="truncate text-[11px] font-mono text-sky-200/90 mt-0.5">{displaySub}</p>
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    {displayRoleLabel}
                  </span>
                </div>
              </div>
            </div>

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

            {/* Quick Actions */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={handleOpenProfileModal}
                className="w-full flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-surface-card/10 py-3 px-4 text-xs font-bold text-white hover:bg-surface-card/20 transition-colors micro-tap"
              >
                <span className="flex items-center gap-3">
                  <User className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  Profil Saya & Hak Akses
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUserDropdownOpen(false);
                  window.dispatchEvent(new CustomEvent('mbg:show-splash'));
                }}
                className="w-full flex items-center justify-between gap-4 rounded-xl border border-cyan-400/20 bg-cyan-400/10 py-3 px-4 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 transition-colors micro-tap"
              >
                <span className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-cyan-400" aria-hidden="true" />
                  Tampilkan Splash Screen Mobile
                </span>
              </button>

              <Link
                href="/login"
                onClick={() => setUserDropdownOpen(false)}
                className="w-full flex items-center justify-between gap-4 rounded-xl border border-brand-blue/20 bg-brand-blue/10 py-3 px-4 text-xs font-bold text-brand-blue hover:bg-brand-blue/20 transition-colors micro-tap"
              >
                <span className="flex items-center gap-3">
                  <LogIn className="h-4 w-4 text-brand-blue" aria-hidden="true" />
                  {isLoggedIn ? 'Ganti Akun / Halaman Login' : 'Login Petugas / Siswa'}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleFullLogout}
                className="w-full flex items-center justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/10 py-3 px-4 text-xs font-bold text-red-200 hover:bg-red-400/20 transition-colors micro-tap"
              >
                <span className="flex items-center gap-3">
                  <LogOut className="h-4 w-4 text-red-400" aria-hidden="true" />
                  Logout (Keluar Akun)
                </span>
              </button>
            </div>
          </div>
        </Modal>
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
          <div className="rounded-2xl bg-surface-canvas border border-surface-border p-4 space-y-2.5 text-xs">
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

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-surface-border">
            <Link
              href="/login"
              onClick={() => setProfileModalOpen(false)}
              className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-surface-canvas hover:bg-slate-100 py-2.5 text-xs font-bold text-text-primary micro-tap"
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
