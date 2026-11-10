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
    allowedRoles: ['siswa', 'guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru'],
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

  if (pathname === '/login') return null;

  // Tentukan kategori role aktif untuk RBAC filtering
  const activeRole: RbacRole = isStudent
    ? 'siswa'
    : role || 'guru_piket';

  const filteredItems = MENU_ITEMS.filter((item) => item.allowedRoles.includes(activeRole)).slice(
    0,
    5
  );

  // Jika mode siswa, tambahkan akses cepat profil/login di bilah bawah
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
    displayItems.length <= 3
      ? 'grid-cols-3'
      : displayItems.length === 4
      ? 'grid-cols-4'
      : 'grid-cols-5';

  return (
    <nav
      className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-blue-950/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_36px_rgba(15,30,54,0.3)] backdrop-blur-2xl lg:hidden"
      aria-label="Navigasi utama"
    >
      <div className={`mx-auto grid max-w-md ${colCountClass} gap-1`}>
        {displayItems.map(({ href, label, icon: Icon, primary }) => {
          const active =
            pathname === href ||
            (href !== '/' && href !== '/dashboard' && pathname.startsWith(`${href}/`));
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition-all duration-200 active:scale-95 ${
                primary
                  ? 'text-cyan-300'
                  : active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-sky-200/70 hover:text-white hover:bg-white/10'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform duration-200 ${
                  primary
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : active
                    ? 'scale-105'
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
