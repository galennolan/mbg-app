'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, Building2, Users, PlusCircle } from 'lucide-react';

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
    <div className="mb-6 rounded-2xl border border-white/10 bg-brand-navy-dark/70 p-2 sm:p-3 backdrop-blur-md shadow-elev-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`group flex items-center gap-3 rounded-xl p-3 transition-all micro-tap ${
                isActive
                  ? 'border border-cyan-400/50 bg-brand-blue/30 text-white shadow-sm ring-1 ring-cyan-400/30'
                  : 'border border-transparent bg-white/5 text-sky-200/80 hover:border-white/15 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${
                  isActive
                    ? 'bg-brand-blue text-white shadow-elev-1'
                    : 'bg-white/10 text-sky-300'
                }`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-xs font-bold text-white sm:text-sm">
                    {tab.label}
                  </span>
                  {tab.badge && (
                    <span
                      className={`hidden rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:inline-block ${
                        tab.badge === 'Operasional'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </div>
                <p className="hidden truncate text-[11px] text-sky-200/60 sm:block">
                  {tab.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

