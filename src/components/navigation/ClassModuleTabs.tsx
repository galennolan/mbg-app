'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Building2, Users } from 'lucide-react';

interface TabItem {
  href: string;
  label: string;
  shortLabel: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: TabItem[] = [
  {
    href: '/konfirmasi/kelas',
    label: 'Checklist Porsi MBG',
    shortLabel: 'Checklist MBG',
    icon: CheckSquare,
    badge: 'Operasional',
    description: 'Pencatatan kehadiran & serah terima porsi harian',
  },
  {
    href: '/admin/kelas',
    label: 'Kelola Data Kelas (CRUD)',
    shortLabel: 'Data Kelas',
    icon: Building2,
    badge: 'Master',
    description: 'Tambah, perbarui jurusan/tingkat, & hapus kelas',
  },
  {
    href: '/siswa',
    label: 'Kelola Data Siswa (CRUD & Import)',
    shortLabel: 'Data Siswa',
    icon: Users,
    badge: 'Master',
    description: 'Input siswa, alergi makanan, & import Excel/CSV',
  },
];

export default function ClassModuleTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi Modul Kelas dan Siswa"
      className="mb-6 rounded-2xl border border-brand-blue-300/35 bg-gradient-to-r from-[#082552] via-[#0D47A1] to-[#1565C0] p-2 sm:p-3 shadow-[0_12px_30px_-8px_rgba(13,71,161,0.45)]"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-xl p-3 transition-all duration-200 micro-tap ${
                isActive
                  ? 'border border-sky-300/75 bg-gradient-to-br from-[#1E88E5] via-[#1565C0] to-[#0D47A1] text-white shadow-[0_8px_20px_-4px_rgba(30,136,229,0.55)] ring-1 ring-sky-300/40'
                  : 'border border-sky-300/15 bg-gradient-to-br from-[#0B2E66]/70 to-[#0F3F8A]/50 text-sky-100 hover:border-sky-300/45 hover:from-[#124596]/85 hover:to-[#1976D2]/70 hover:text-white'
              }`}
            >
              {/* Active top highlight line */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-3 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-sky-200 to-transparent"
                />
              )}

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${
                  isActive
                    ? 'border border-sky-200/50 bg-gradient-to-tr from-[#0D47A1] via-[#1E88E5] to-[#38A3F8] text-white shadow-[0_4px_12px_rgba(56,163,248,0.45)]'
                    : 'border border-sky-300/20 bg-gradient-to-tr from-[#0D3B7A] to-[#1565C0]/80 text-sky-200 group-hover:border-sky-300/40 group-hover:from-[#1565C0] group-hover:to-[#2998F2] group-hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-bold text-white sm:text-sm">
                    {tab.label}
                  </span>
                  {tab.badge && (
                    <span
                      className={`hidden shrink-0 rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider sm:inline-block ${
                        isActive
                          ? 'border border-sky-200/50 bg-gradient-to-r from-sky-400/30 to-blue-300/25 text-white shadow-sm'
                          : tab.badge === 'Operasional'
                            ? 'border border-sky-300/35 bg-gradient-to-r from-sky-500/25 to-blue-600/25 text-sky-100'
                            : 'border border-blue-300/30 bg-gradient-to-r from-blue-500/25 to-indigo-500/25 text-blue-100'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <p
                  className={`hidden truncate text-[11px] sm:block ${
                    isActive ? 'text-sky-100/95' : 'text-sky-200/75 group-hover:text-sky-100/90'
                  }`}
                >
                  {tab.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
