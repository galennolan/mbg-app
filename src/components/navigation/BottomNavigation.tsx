'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Truck, Users, FileText, QrCode } from 'lucide-react';

const items = [
  { href: '/', label: 'Scan Siswa', icon: QrCode },
  { href: '/dashboard', label: 'Monitor', icon: Home },
  { href: '/kedatangan', label: 'Kedatangan', icon: Truck, primary: true },
  { href: '/konfirmasi/kelas', label: 'Kelas', icon: Users },
  { href: '/laporan', label: 'Laporan', icon: FileText },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-blue-950/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_36px_rgba(15,30,54,0.3)] backdrop-blur-2xl lg:hidden"
      aria-label="Navigasi utama"
    >
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {items.map(({ href, label, icon: Icon, primary }) => {
          const active = pathname === href || (href !== '/' && href !== '/dashboard' && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition ${
                primary
                  ? 'text-cyan-300'
                  : active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-sky-200/70 hover:text-white hover:bg-white/10'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                  primary
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30'
                    : ''
                }`}
              >
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
