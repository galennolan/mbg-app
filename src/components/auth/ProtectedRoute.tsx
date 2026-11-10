'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export type RbacRole = UserRole | 'siswa';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: RbacRole[];
  redirectStudentTo?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  redirectStudentTo = '/',
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, role, isStudent, loading } = useAuth();

  const effectiveRole: RbacRole = isStudent
    ? 'siswa'
    : role || 'guru_piket';

  const isAllowed =
    allowedRoles.includes(effectiveRole) ||
    (effectiveRole === 'admin' && allowedRoles.includes('super_admin')) ||
    (effectiveRole === 'guru' && allowedRoles.includes('guru_piket'));

  useEffect(() => {
    if (loading) return;

    // Spesifikasi RBAC Tahap 2: Siswa otomatis dilempar ke `/` jika mencoba akses halaman sensitif seperti `/kedatangan`
    if (isStudent && !allowedRoles.includes('siswa')) {
      router.replace(redirectStudentTo);
    }
  }, [loading, isStudent, allowedRoles, redirectStudentTo, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <div className="w-8 h-8 border-3 border-brand-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider">Memverifikasi Hak Akses RBAC...</p>
      </div>
    );
  }

  if (isStudent && !allowedRoles.includes('siswa')) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-white border border-rose-200 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Akses Terbatas (Khusus Petugas)</h2>
        <p className="text-xs text-slate-600">
          Akun Siswa tidak memiliki izin untuk mengakses halaman operasional ini. Mengalihkan kembali ke Portal Siswa...
        </p>
        <Link
          href={redirectStudentTo}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white text-xs font-bold shadow-md transition active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Portal Siswa
        </Link>
      </div>
    );
  }

  if (user && !isAllowed) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-white border border-amber-200 shadow-xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Hak Akses Tidak Mencukupi</h2>
        <p className="text-xs text-slate-600">
          Halaman ini membutuhkan peran <strong>{allowedRoles.join(' / ').toUpperCase()}</strong>, sedangkan peran aktif Anda saat ini adalah <strong>{(role || '').toUpperCase()}</strong>.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-navy text-white text-xs font-bold shadow-md transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Ke Dashboard Monitor
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95"
          >
            Ganti Akun
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
