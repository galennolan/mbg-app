'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Truck, Users, FileText, QrCode, Megaphone, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { RbacRole } from '@/components/auth/ProtectedRoute';

interface NavItemConfig {
  href: string;
  label: string;
  icon: any;
  primary?: boolean;
  allowedRoles: RbacRole[];
}

const MENU_ITEMS: NavItemConfig[] = [
  {
    href: '/',
    label: 'Scan Siswa',
    icon: QrCode,
    allowedRoles: ['siswa', 'guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru'],
  },
  {
    href: '/dashboard',
    label: 'Monitor',
    icon: Home,
    allowedRoles: ['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru'],
  },
  {
    href: '/kedatangan',
    label: 'Kedatangan',
    icon: Truck,
    primary: true,
    allowedRoles: ['guru_piket', 'super_admin', 'admin', 'guru'],
  },
  {
    href: '/konfirmasi/kelas',
    label: 'Kelas',
    icon: Users,
    allowedRoles: ['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru'],
  },
  {
    href: '/laporan',
    label: 'Laporan',
    icon: FileText,
    allowedRoles: ['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru'],
  },
  {
    href: '/admin/campaign',
    label: 'Campaign',
    icon: Megaphone,
    allowedRoles: ['super_admin', 'admin'],
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { role, isStudent, user } = useAuth();

  if (pathname === '/login' || pathname === '/login-siswa') return null;

  const activeRole: RbacRole = user && role && !isStudent ? role : 'siswa';

  const filteredItems = MENU_ITEMS.filter((item) => item.allowedRoles.includes(activeRole)).slice(
    0,
    5
  );

  const displayItems =
    activeRole === 'siswa' && !user
      ? [
          ...filteredItems,
          {
            href: '/login',
            label: isStudent ? 'Akun Siswa' : 'Login',
            icon: LogIn,
            primary: false,
            allowedRoles: ['siswa'] as RbacRole[],
          },
        ]
      : filteredItems;

  const colCountClass =
    displayItems.length <= 2
      ? 'grid-cols-2'
      : displayItems.length === 3
      ? 'grid-cols-3'
      : displayItems.length === 4
      ? 'grid-cols-4'
      : 'grid-cols-5';

  return (
    <nav
      className="no-print mobile-bottom-nav fixed inset-x-0 bottom-0 z-bottom-nav border-t border-white/15 bg-brand-navy-dark/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-elev-4 backdrop-blur-md lg:hidden"
      aria-label="Navigasi utama perangkat seluler"
    >
      <div className={`mx-auto grid max-w-md ${colCountClass} gap-1.5`}>
        {displayItems.map(({ href, label, icon: Icon, primary }) => {
          const isClassModule =
            href === '/konfirmasi/kelas' &&
            (pathname === '/konfirmasi/kelas' ||
              pathname === '/admin/kelas' ||
              pathname === '/siswa');
          const active =
            pathname === href ||
            isClassModule ||
            (href !== '/' && href !== '/dashboard' && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className={`min-h-[52px] flex flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-bold micro-tap ${
                primary
                  ? 'text-cyan-300'
                  : active
                  ? 'bg-white/15 text-white'
                  : 'text-sky-200/75 hover:text-white hover:bg-white/10'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-transform duration-150 ${
                  primary
                    ? 'bg-brand-blue text-white shadow-sm'
                    : active
                    ? 'scale-105'
                    : ''
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="truncate max-w-full px-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
