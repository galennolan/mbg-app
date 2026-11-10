import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/login-siswa', '/manifest.webmanifest', '/sw.js'];

const ROLE_ROUTE_RULES: Array<{
  prefix: string;
  allowedRoles: string[];
}> = [
  {
    prefix: '/admin/sekolah',
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    prefix: '/admin/campaign',
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    prefix: '/admin/pengguna',
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    prefix: '/admin/audit',
    allowedRoles: ['super_admin', 'admin'],
  },
  {
    prefix: '/admin/kelas',
    allowedRoles: ['super_admin', 'admin', 'guru_piket', 'kepala_sekolah', 'guru'],
  },
  {
    prefix: '/siswa',
    allowedRoles: ['super_admin', 'admin', 'guru_piket', 'kepala_sekolah', 'guru'],
  },
  {
    prefix: '/kedatangan',
    allowedRoles: ['super_admin', 'admin', 'guru_piket', 'guru'],
  },
  {
    prefix: '/dashboard',
    allowedRoles: ['super_admin', 'admin', 'guru_piket', 'kepala_sekolah', 'guru'],
  },
  {
    prefix: '/laporan',
    allowedRoles: ['super_admin', 'admin', 'guru_piket', 'kepala_sekolah', 'guru'],
  },
  {
    prefix: '/konfirmasi',
    allowedRoles: ['super_admin', 'admin', 'guru_piket', 'kepala_sekolah', 'guru'],
  },
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    PUBLIC_PATHS.includes(pathname)
  ) {
    const response = NextResponse.next();
    response.headers.set('x-mbg-tenant-mode', 'multi-tenant-v1.2');
    return response;
  }

  const cookieRole = request.cookies.get('mbg_role')?.value || '';
  const cookieSchoolId = request.cookies.get('mbg_school_id')?.value || '';

  // If role cookie is explicitly set (e.g., 'siswa' or a staff role), enforce route matrix at Edge level
  if (cookieRole) {
    const matchedRule = ROLE_ROUTE_RULES.find(
      (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)
    );

    if (matchedRule && !matchedRule.allowedRoles.includes(cookieRole)) {
      const redirectTarget = cookieRole === 'siswa' ? '/' : '/dashboard';
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set('x-mbg-tenant-mode', 'multi-tenant-v1.2');
  if (cookieSchoolId) {
    response.headers.set('x-mbg-school-id', cookieSchoolId);
  }
  if (cookieRole) {
    response.headers.set('x-mbg-role', cookieRole);
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

