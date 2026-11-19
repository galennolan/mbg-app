'use client';

import { usePathname } from 'next/navigation';
import {
  Home,
  Truck,
  Users,
  FileText,
  QrCode,
  Megaphone,
  LogIn,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { RbacRole } from '@/components/auth/ProtectedRoute';
import { NavBar, type NavItem } from '@/components/ui/tubelight-navbar';

interface NavItemConfig {
  href: string;
  label: string;
  icon: LucideIcon;
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

  const navItems: NavItem[] = displayItems.map((item) => ({
    name: item.label,
    url: item.href,
    icon: item.icon,
    primary: item.primary,
  }));

  // Resolve active URL (group /admin/kelas and /siswa under /konfirmasi/kelas)
  const resolvedActiveUrl = (() => {
    if (
      pathname === '/konfirmasi/kelas' ||
      pathname === '/admin/kelas' ||
      pathname === '/siswa'
    ) {
      return '/konfirmasi/kelas';
    }
    const exact = displayItems.find((i) => i.href === pathname);
    if (exact) return exact.href;
    const prefix = displayItems.find(
      (i) => i.href !== '/' && i.href !== '/dashboard' && pathname?.startsWith(`${i.href}/`)
    );
    return prefix?.href ?? pathname ?? '/';
  })();

  return <NavBar items={navItems} activeUrl={resolvedActiveUrl} className="lg:hidden" />;
}
