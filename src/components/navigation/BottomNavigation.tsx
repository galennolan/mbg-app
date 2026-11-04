'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, ClipboardCheck, FileText, Home, Truck, Users } from 'lucide-react';

const items = [
  { href: '/dashboard', label: 'Ringkasan', icon: Home },
  { href: '/kedatangan', label: 'Kedatangan', icon: Truck, primary: true },
  { href: '/konfirmasi/kelas', label: 'Kelas', icon: Users },
  { href: '/laporan', label: 'Laporan', icon: FileText },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-white/70 bg-white/75 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_36px_rgba(15,30,54,0.12)] backdrop-blur-2xl lg:hidden" aria-label="Navigasi utama">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition ${
                primary
                  ? 'text-brand-blue'
                  : active
                  ? 'bg-blue-50/80 text-brand-blue shadow-sm'
                  : 'text-slate-500 hover:bg-white/70'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${primary ? 'bg-gradient-to-br from-brand-blue to-cyan-500 text-white shadow-lg shadow-blue-200' : ''}`}>
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
