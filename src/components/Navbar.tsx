'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Utensils,
  LayoutDashboard,
  Truck,
  UserCheck,
  Users,
  GraduationCap,
  FileSpreadsheet,
  QrCode,
  ShieldCheck,
  History,
  LogOut,
  LogIn,
  Menu,
  X,
  Building2,
  ChevronDown,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, role, signOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  // Don't show staff navbar if on student page or public scan unless user wants to navigate
  const isStudentPage = pathname === '/';

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-brand-navy/95 text-white shadow-[0_8px_30px_rgba(15,30,54,0.18)] backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-cyan-500 shadow-lg shadow-blue-950/20 transition group-hover:scale-105">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block text-lg font-black leading-tight tracking-tight text-white">
                  MBG Tracker
                </span>
                <span className="block text-xs font-normal leading-none text-blue-200">
                  Makan Bergizi Gratis
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive('/')
                  ? 'bg-brand-blue text-white'
                  : 'text-gray-200 hover:bg-brand-navy-light hover:text-white'
              }`}
            >
              Halaman Siswa (QR)
            </Link>

            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/dashboard')
                      ? 'bg-brand-blue text-white'
                      : 'text-gray-200 hover:bg-brand-navy-light hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                <Link
                  href="/kedatangan"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/kedatangan')
                      ? 'bg-brand-blue text-white'
                      : 'text-gray-200 hover:bg-brand-navy-light hover:text-white'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Kedatangan MBG
                </Link>

                <Link
                  href="/konfirmasi/individu"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/konfirmasi/individu')
                      ? 'bg-brand-blue text-white'
                      : 'text-gray-200 hover:bg-brand-navy-light hover:text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  Individu
                </Link>

                <Link
                  href="/konfirmasi/kelas"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/konfirmasi/kelas')
                      ? 'bg-brand-blue text-white'
                      : 'text-gray-200 hover:bg-brand-navy-light hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Konfirmasi Kelas
                </Link>

                <Link
                  href="/siswa"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/siswa')
                      ? 'bg-brand-blue text-white'
                      : 'text-gray-200 hover:bg-brand-navy-light hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Data Siswa
                </Link>

                <Link
                  href="/laporan"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive('/laporan')
                      ? 'bg-brand-blue text-white'
                      : 'text-gray-200 hover:bg-brand-navy-light hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Laporan
                </Link>

                {/* Admin Specific Dropdown */}
                {role === 'admin' && (
                  <div className="relative">
                    <button
                      onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                      className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-brand-navy-light hover:text-white transition"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Kelola Admin
                      <ChevronDown className="w-4 h-4 ml-0.5" />
                    </button>

                    {adminDropdownOpen && (
                      <div
                        className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-white/70 bg-white/90 py-2 text-gray-800 shadow-2xl backdrop-blur-xl"
                        onClick={() => setAdminDropdownOpen(false)}
                      >
                        <Link
                          href="/admin/kelas"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                        >
                          <Building2 className="w-4 h-4 text-blue-600" />
                          Kelas & Jurusan
                        </Link>
                        <Link
                          href="/admin/pengguna"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                        >
                          <Users className="w-4 h-4 text-indigo-600" />
                          Kelola Guru/Akun
                        </Link>
                        <Link
                          href="/admin/qrcode"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                        >
                          <QrCode className="w-4 h-4 text-green-600" />
                          Poster & QR Code
                        </Link>
                        <Link
                          href="/admin/audit"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                        >
                          <History className="w-4 h-4 text-orange-600" />
                          Audit Log
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* User profile / Login button */}
          <div className="hidden lg:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-slate-700 animate-pulse rounded"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs font-semibold text-white">{user.nama}</div>
                  <div className="flex items-center justify-end gap-1">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        user.peran === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      }`}
                    >
                      {user.peran.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white transition"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-brand-blue hover:bg-brand-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition"
              >
                <LogIn className="w-4 h-4" />
                Masuk Petugas / Guru
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 text-gray-200 hover:bg-white/10 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="space-y-1 border-t border-white/10 bg-brand-navy-dark/95 px-4 pb-4 pt-2 backdrop-blur-xl lg:hidden">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3 py-2 rounded-md text-sm font-medium ${
              isActive('/') ? 'bg-brand-blue text-white' : 'text-gray-300 hover:bg-slate-800'
            }`}
          >
            Halaman Siswa (QR)
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/dashboard') ? 'bg-brand-blue text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/kedatangan"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/kedatangan') ? 'bg-brand-blue text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                Kedatangan MBG
              </Link>
              <Link
                href="/konfirmasi/individu"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/konfirmasi/individu') ? 'bg-brand-blue text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                Konfirmasi Individu
              </Link>
              <Link
                href="/konfirmasi/kelas"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/konfirmasi/kelas') ? 'bg-brand-blue text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                Konfirmasi Massal Kelas
              </Link>
              <Link
                href="/siswa"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/siswa') ? 'bg-brand-blue text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                Data Siswa
              </Link>
              <Link
                href="/laporan"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/laporan') ? 'bg-brand-blue text-white' : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                Laporan
              </Link>

              {role === 'admin' && (
                <div className="pt-2 border-t border-slate-700/60 mt-2">
                  <div className="text-xs text-amber-400 font-semibold px-3 py-1">MENU ADMINISTRATOR</div>
                  <Link
                    href="/admin/kelas"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-1.5 rounded-md text-sm text-gray-300 hover:bg-slate-800"
                  >
                    Kelas & Jurusan
                  </Link>
                  <Link
                    href="/admin/pengguna"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-1.5 rounded-md text-sm text-gray-300 hover:bg-slate-800"
                  >
                    Kelola Guru / Pengguna
                  </Link>
                  <Link
                    href="/admin/qrcode"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-1.5 rounded-md text-sm text-gray-300 hover:bg-slate-800"
                  >
                    Poster & QR Code
                  </Link>
                  <Link
                    href="/admin/audit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-1.5 rounded-md text-sm text-gray-300 hover:bg-slate-800"
                  >
                    Audit Log
                  </Link>
                </div>
              )}

              <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{user.nama}</div>
                  <div className="text-xs text-blue-300">{user.email}</div>
                </div>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs bg-red-600 text-white rounded font-medium"
                >
                  Keluar
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-700">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center bg-brand-blue text-white py-2 rounded-lg font-medium text-sm"
              >
                Masuk Petugas / Guru
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
