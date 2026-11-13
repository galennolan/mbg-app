'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  FileSpreadsheet, 
  QrCode, 
  ShieldCheck,
  Building2,
  GraduationCap,
  History,
  User,
  Settings,
  LogOut,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, role, isStudent, student } = useAuth();
  
  const isActive = (path: string) => pathname === path;
  const isStaff = user !== null || !isStudent;
  const isSuperAdmin = role === 'super_admin' || role === 'admin';

  const menuItems = [
    {
      title: 'Utama',
      items: [
        { href: '/', label: 'Portal Siswa (Scan)', icon: QrCode },
        { href: '/dashboard', label: 'Monitor Real-time', icon: LayoutDashboard, staffOnly: true },
      ]
    },
    {
      title: 'Operasional',
      staffOnly: true,
      items: [
        { href: '/kedatangan', label: 'Kedatangan MBG', icon: Truck },
        { href: '/konfirmasi/kelas', label: 'Konfirmasi Kelas', icon: Users },
        { href: '/laporan', label: 'Laporan & SPPG', icon: FileSpreadsheet },
      ]
    },
    {
      title: 'Master Data',
      adminOnly: true,
      items: [
        { href: '/admin/kelas', label: 'Data Kelas', icon: Building2 },
        { href: '/siswa', label: 'Data Siswa', icon: GraduationCap },
        { href: '/admin/pengguna', label: 'Kelola Pengguna', icon: Users },
        { href: '/admin/audit', label: 'Audit Log', icon: History },
      ]
    }
  ];

  // Helper type for items
  interface NavItem {
    href: string;
    label: string;
    icon: any;
    staffOnly?: boolean;
  }


  if (pathname === '/login' || pathname === '/login-siswa') return null;

  return (
    <aside className="no-print hidden lg:flex flex-col w-[17.5rem] xl:w-72 h-screen sticky top-0 shrink-0 bg-brand-navy-dark text-white border-r border-white/10">
      <div className="px-5 py-5 border-b border-white/10">
        <a href="https://pmbubsi.id/kampus/surakarta" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-white shadow-elev-2">
            <span className="text-sm font-black tracking-tighter">BSI</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black tracking-wide truncate">Nutri Kampus</h1>
              <ExternalLink className="h-3 w-3 text-sky-300/70 shrink-0" aria-hidden="true" />
            </div>
            <p className="text-[11px] text-sky-200/70 truncate">Operational Hub</p>
          </div>
        </a>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Navigasi utama">
        {menuItems.map((group, idx) => {
          if (group.staffOnly && !isStaff) return null;
          if (group.adminOnly && !isSuperAdmin) return null;

          return (
            <div key={idx} className="space-y-1.5">
              <h2 className="px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-sky-200/45">
                {group.title}
              </h2>
              <div className="space-y-1">
                {group.items.map((item: NavItem) => {
                  if (item.staffOnly && !isStaff) return null;

                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group min-h-[44px] flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors micro-tap',
                        active
                          ? 'bg-white text-brand-navy shadow-elev-2'
                          : 'text-sky-100/80 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-brand-blue' : 'text-sky-300/70')} aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {active && <ChevronRight className="h-3.5 w-3.5 text-brand-blue shrink-0" aria-hidden="true" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 rounded-2xl bg-white/8 border border-white/10 p-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue text-white">
            <User className="h-5 w-5" aria-hidden="true" />
            <span className={cn(
              'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-brand-navy-dark',
              user || student ? 'bg-emerald-400' : 'bg-amber-400'
            )} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white leading-tight">
              {user?.nama || student?.nama_lengkap || 'Tamu'}
            </p>
            <p className="truncate text-[11px] text-sky-200/70 mt-0.5">
              {(role || (student ? 'siswa' : 'tamu')).replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
