'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Users,
  FileSpreadsheet,
  QrCode,
  Building2,
  GraduationCap,
  History,
  User,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const SIDEBAR_STORAGE_KEY = 'mbg_sidebar_collapsed';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role, isStudent, student } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (saved === 'true') {
        setCollapsed(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const isActive = (path: string) => pathname === path;
  const isStaff = user !== null && !isStudent;
  const activeRole = isStudent ? 'siswa' : isStaff && role ? role : 'guest';

  interface NavItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    allowedRoles: string[];
  }

  interface NavGroup {
    title: string;
    items: NavItem[];
  }

  const menuItems: NavGroup[] = [
    {
      title: 'Utama',
      items: [
        {
          href: '/',
          label: 'Portal Siswa (Scan)',
          icon: QrCode,
          allowedRoles: [
            'guest',
            'siswa',
            'guru_piket',
            'kepala_sekolah',
            'super_admin',
            'admin',
            'guru',
          ],
        },
        {
          href: '/dashboard',
          label: 'Monitor Real-time',
          icon: LayoutDashboard,
          allowedRoles: ['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru'],
        },
      ],
    },
    {
      title: 'Operasional',
      items: [
        {
          href: '/kedatangan',
          label: 'Kedatangan MBG',
          icon: Truck,
          allowedRoles: ['guru_piket', 'super_admin', 'admin', 'guru'],
        },
        {
          href: '/konfirmasi/kelas',
          label: 'Konfirmasi Kelas',
          icon: Users,
          allowedRoles: ['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru'],
        },
        {
          href: '/laporan',
          label: 'Laporan & SPPG',
          icon: FileSpreadsheet,
          allowedRoles: ['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru'],
        },
      ],
    },
    {
      title: 'Master Data',
      items: [
        {
          href: '/admin/kelas',
          label: 'Data Kelas',
          icon: Building2,
          allowedRoles: ['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru'],
        },
        {
          href: '/siswa',
          label: 'Data Siswa',
          icon: GraduationCap,
          allowedRoles: ['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru'],
        },
        {
          href: '/admin/sekolah',
          label: 'Manajemen Sekolah',
          icon: Building2,
          allowedRoles: ['super_admin', 'admin'],
        },
        {
          href: '/admin/campaign',
          label: 'Campaign CRM',
          icon: Megaphone,
          allowedRoles: ['super_admin', 'admin'],
        },
        {
          href: '/admin/pengguna',
          label: 'Kelola Pengguna',
          icon: Users,
          allowedRoles: ['super_admin', 'admin'],
        },
        {
          href: '/admin/audit',
          label: 'Audit Log',
          icon: History,
          allowedRoles: ['super_admin', 'admin'],
        },
      ],
    },
  ];

  if (pathname === '/login' || pathname === '/login-siswa') return null;

  const displayName = user?.nama || student?.nama_lengkap || 'Tamu';
  const displayRole =
    role === 'guru_piket'
      ? 'Guru PIC MBG'
      : (role || (student ? 'siswa' : 'tamu')).replace('_', ' ');

  return (
    <aside
      aria-label="Sidebar navigasi utama"
      className={cn(
        'no-print relative hidden lg:flex flex-col h-screen sticky top-0 shrink-0 bg-gradient-to-b from-[#082552] via-[#0D3B7A] to-[#0A2E65] text-white border-r border-sky-300/20 transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] select-none z-20',
        collapsed ? 'w-[78px]' : 'w-[17.5rem] xl:w-72'
      )}
    >
      {/* Top Brand Header + Collapse Toggle Button */}
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-sky-300/15 transition-all',
          collapsed ? 'justify-center px-2' : 'justify-between gap-2 px-4'
        )}
      >
        {!collapsed && (
          <a
            href="https://pmbubsi.id/kampus/surakarta"
            target="_blank"
            rel="noopener noreferrer"
            title="Nutri Kampus Operational Hub · UBSI Surakarta"
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/40 bg-gradient-to-tr from-[#0D47A1] via-[#1565C0] to-[#38A3F8] text-white shadow-[0_6px_16px_rgba(21,101,192,0.45)]">
              <span className="text-xs font-black tracking-tighter">BSI</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-wide truncate">Nutri Kampus</h1>
                <ExternalLink className="h-3 w-3 text-sky-300/80 shrink-0" aria-hidden="true" />
              </div>
              <p className="text-[11px] text-sky-200/75 truncate">Operational Hub</p>
            </div>
          </a>
        )}

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          className={cn(
            'flex items-center justify-center rounded-xl border border-sky-300/25 bg-gradient-to-tr from-[#0D47A1]/80 to-[#1E88E5]/60 text-sky-100 hover:border-sky-200/60 hover:from-[#1565C0] hover:to-[#38A3F8] hover:text-white transition-all micro-tap cursor-pointer shrink-0 shadow-sm',
            collapsed ? 'h-10 w-10' : 'h-9 w-9'
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav
        className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden py-4 space-y-5 scrollbar-thin',
          collapsed ? 'px-2.5' : 'px-3'
        )}
        aria-label="Navigasi utama"
      >
        {menuItems.map((group, idx) => {
          const visibleItems = group.items.filter((item) =>
            item.allowedRoles.includes(activeRole)
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1.5">
              {collapsed ? (
                idx > 0 && (
                  <div
                    aria-hidden="true"
                    className="mx-auto my-2 h-px w-8 rounded-full bg-sky-300/20"
                  />
                )
              ) : (
                <h2 className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-200/55">
                  {group.title}
                </h2>
              )}

              <div className="space-y-1">
                {visibleItems.map((item: NavItem) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        'group relative min-h-[44px] flex items-center rounded-2xl text-sm font-semibold transition-all micro-tap',
                        collapsed
                          ? 'justify-center px-0'
                          : 'justify-between gap-3 px-3 py-2.5',
                        active
                          ? 'border border-sky-300/60 bg-gradient-to-r from-[#1E88E5] via-[#1565C0] to-[#0D47A1] text-white shadow-[0_6px_16px_-2px_rgba(30,136,229,0.5)]'
                          : 'text-sky-100/85 hover:bg-gradient-to-r hover:from-[#124596]/70 hover:to-[#1976D2]/50 hover:text-white'
                      )}
                    >
                      {collapsed && active && (
                        <span
                          aria-hidden="true"
                          className="absolute -left-2.5 top-2.5 h-6 w-1 rounded-r-full bg-sky-300 shadow-[0_0_8px_rgba(125,211,252,0.8)]"
                        />
                      )}

                      <span
                        className={cn(
                          'flex items-center min-w-0',
                          collapsed ? 'justify-center' : 'gap-3'
                        )}
                      >
                        <item.icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110',
                            active ? 'text-white' : 'text-sky-300/85 group-hover:text-white'
                          )}
                          aria-hidden="true"
                        />
                        {collapsed ? (
                          <span className="sr-only">{item.label}</span>
                        ) : (
                          <span className="truncate">{item.label}</span>
                        )}
                      </span>

                      {!collapsed && active && (
                        <ChevronRight
                          className="h-3.5 w-3.5 text-sky-200 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom User Card */}
      <div className={cn('border-t border-sky-300/15 p-3', collapsed && 'px-2')}>
        <div
          title={collapsed ? `${displayName} (${displayRole})` : undefined}
          className={cn(
            'flex items-center rounded-2xl bg-gradient-to-r from-[#0D3B7A]/80 to-[#1565C0]/45 border border-sky-300/20 transition-all',
            collapsed ? 'justify-center p-2' : 'gap-3 p-3'
          )}
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0D47A1] via-[#1565C0] to-[#38A3F8] text-white shadow-sm">
            <User className="h-5 w-5" aria-hidden="true" />
            <span
              className={cn(
                'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#082552]',
                user || student ? 'bg-emerald-400' : 'bg-amber-400'
              )}
            />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white leading-tight">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-sky-200/75 mt-0.5 capitalize">
                {displayRole}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
