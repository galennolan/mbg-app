'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Utensils,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  GraduationCap,
  Phone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { isValidPhone628, normalizePhone628 } from '@/lib/services';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signInStudent, loginAsDemoRole, user, isStudent } = useAuth();

  // Dual-Mode Login Tab State ('staff' | 'student')
  const [loginMode, setLoginMode] = useState<'staff' | 'student'>('staff');

  // Staff Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Student Form State
  const [namaSiswa, setNamaSiswa] = useState('');
  const [noHpSiswa, setNoHpSiswa] = useState('628');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    } else if (isStudent) {
      router.push('/');
    }
  }, [user, isStudent, router]);

  // Handle Phone Input with 628xxx Format Enforcement & Helper
  const handlePhoneInputChange = (rawVal: string) => {
    const cleaned = rawVal.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('08')) {
      setNoHpSiswa('628' + cleaned.slice(2));
    } else if (cleaned.startsWith('+628')) {
      setNoHpSiswa('628' + cleaned.slice(4));
    } else {
      setNoHpSiswa(cleaned.replace(/\D/g, ''));
    }
  };

  const phoneValid = isValidPhone628(noHpSiswa);

  // Staff Login Submit
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap masukkan alamat email dan kata sandi petugas.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await signIn(email.trim(), password);
      if (res.error) {
        if (res.error.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg(
            'Email atau kata sandi salah. Gunakan tombol Inisiasi Akun di bawah jika baru pertama kali mencoba.'
          );
        } else {
          setErrorMsg(res.error);
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login petugas.');
    } finally {
      setLoading(false);
    }
  };

  // Student Login Submit (Nama + No. HP 628xxx)
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizePhone628(noHpSiswa);
    setNoHpSiswa(normalizedPhone);

    if (!namaSiswa.trim()) {
      setErrorMsg('Harap masukkan Nama Lengkap siswa.');
      return;
    }

    if (!isValidPhone628(normalizedPhone)) {
      setErrorMsg(
        'Format Nomor HP tidak valid. Wajib menggunakan awalan 628xxx (contoh: 6281234567890).'
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await signInStudent(namaSiswa.trim(), normalizedPhone);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login siswa.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to register/sign-in initial Staff accounts (Super Admin, Guru Piket, Kepala Sekolah)
  const handleCreateInitialAccount = async (
    role: 'super_admin' | 'guru_piket' | 'kepala_sekolah'
  ) => {
    const emailMap = {
      super_admin: 'admin@mbg.sekolah.id',
      guru_piket: 'guru@mbg.sekolah.id',
      kepala_sekolah: 'kepsek@mbg.sekolah.id',
    };
    const nameMap = {
      super_admin: 'Super Administrator (Marcomm UBSI)',
      guru_piket: 'Budi Santoso (Guru Piket)',
      kepala_sekolah: 'Dr. Mochamad Wahyudi, M.M (Kepala Sekolah)',
    };
    const targetEmail = emailMap[role];
    const targetPassword = 'Password123!';
    setEmail(targetEmail);
    setPassword(targetPassword);
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      await loginAsDemoRole(role);
      router.push('/dashboard');
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menyiapkan akun.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for 1-Click Student Demo Login
  const handleQuickStudentLogin = async (nama: string, phone: string) => {
    setNamaSiswa(nama);
    setNoHpSiswa(phone);
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await signInStudent(nama, phone);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 px-4">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-slate-200/80 overflow-hidden transition-all duration-300">
        {/* Top Header */}
        <div className="bg-gradient-to-br from-brand-navy via-blue-950 to-indigo-950 p-6 sm:p-8 text-center text-white relative overflow-hidden">
          <div className="pointer-events-none absolute -top-16 -right-16 w-44 h-44 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-cyan-400/15 blur-2xl" />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/40 transition-transform duration-300 hover:scale-105">
            {loginMode === 'staff' ? (
              <Utensils className="w-7 h-7 text-white" />
            ) : (
              <GraduationCap className="w-7 h-7 text-white" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {loginMode === 'staff' ? 'Portal Login Petugas' : 'Portal Login Siswa'}
          </h1>
          <p className="text-xs text-sky-200 mt-1">
            {loginMode === 'staff'
              ? 'Akses Operasional Guru Piket, Kepala Sekolah & Super Admin'
              : 'Masuk dengan Nama Lengkap & Nomor WhatsApp (628xxx)'}
          </p>

          {/* Dual-Mode Segmented Tab Switcher (Disney Principle: Slow In & Slow Out + Squash & Stretch) */}
          <div className="mt-5 grid grid-cols-2 p-1.5 rounded-2xl bg-slate-950/60 border border-white/15 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                setLoginMode('staff');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 ${
                loginMode === 'staff'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                  : 'text-sky-200/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Login Petugas
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginMode('student');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all duration-200 active:scale-95 ${
                loginMode === 'student'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30'
                  : 'text-sky-200/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Login Siswa
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          {loginMode === 'staff' ? (
            /* ==================== TAB 1: LOGIN PETUGAS (EMAIL + PASSWORD) ==================== */
            <>
              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Alamat Email Petugas
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@mbg.sekolah.id"
                      autoComplete="email"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/70 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      id="login-password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/70 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue transition-all duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black rounded-2xl shadow-lg shadow-blue-900/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2 focus:outline-none focus:ring-4 focus:ring-brand-blue/30"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memverifikasi Akses...
                    </>
                  ) : (
                    <>
                      Masuk Sebagai Petugas
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Helper for Initial RBAC Testing / Setup */}
              <div className="pt-4 border-t border-slate-200/80 text-center space-y-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Simulasi Cepat RBAC (1-Klik Masuk)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCreateInitialAccount('super_admin')}
                    className="py-2.5 px-2 text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-xl border border-amber-200 transition-all duration-150 active:scale-95 text-center"
                  >
                    Super Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateInitialAccount('guru_piket')}
                    className="py-2.5 px-2 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl border border-blue-200 transition-all duration-150 active:scale-95 text-center"
                  >
                    Guru Piket
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateInitialAccount('kepala_sekolah')}
                    className="py-2.5 px-2 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl border border-purple-200 transition-all duration-150 active:scale-95 text-center"
                  >
                    Kepala Sekolah
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Password default: <code className="font-mono font-bold">Password123!</code>
                </p>
              </div>
            </>
          ) : (
            /* ==================== TAB 2: LOGIN SISWA (NAMA + NO. HP 628xxx) ==================== */
            <>
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="student-name"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                  >
                    Nama Lengkap Siswa
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      id="student-name"
                      type="text"
                      required
                      value={namaSiswa}
                      onChange={(e) => setNamaSiswa(e.target.value)}
                      placeholder="Contoh: Alroy Theola Ardanta"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50/70 border border-slate-300 rounded-2xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-500/20 focus:border-cyan-600 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="student-phone"
                      className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                    >
                      Nomor HP WhatsApp (628xxx)
                    </label>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        phoneValid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {phoneValid ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Format 628 Valid
                        </>
                      ) : (
                        'Wajib 628xxx'
                      )}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      id="student-phone"
                      type="tel"
                      inputMode="numeric"
                      required
                      value={noHpSiswa}
                      onChange={(e) => handlePhoneInputChange(e.target.value)}
                      placeholder="6281234567890"
                      className={`w-full pl-11 pr-4 py-3.5 bg-slate-50/70 border rounded-2xl text-sm font-mono font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 transition-all duration-200 ${
                        phoneValid
                          ? 'border-emerald-300 focus:ring-emerald-500/20 focus:border-emerald-600'
                          : 'border-slate-300 focus:ring-cyan-500/20 focus:border-cyan-600'
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Ketik <code className="font-mono font-bold">08xx</code> atau{' '}
                    <code className="font-mono font-bold">628xx</code> — sistem otomatis
                    menyesuaikan ke standar <code className="font-mono font-bold">628xxx</code>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !phoneValid || !namaSiswa.trim()}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white font-black rounded-2xl shadow-lg shadow-cyan-900/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2 focus:outline-none focus:ring-4 focus:ring-cyan-500/30"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Memverifikasi Siswa...
                    </>
                  ) : (
                    <>
                      Masuk Portal Siswa
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Student Accounts */}
              <div className="pt-4 border-t border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  Akun Siswa Demo (1-Klik Masuk)
                </span>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickStudentLogin('Alroy Theola Ardanta', '6281234567890')
                    }
                    className="w-full py-2.5 px-3 text-left text-xs bg-cyan-50/70 hover:bg-cyan-100/80 text-slate-800 rounded-xl border border-cyan-200 transition-all duration-150 active:scale-[0.99] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-black block text-brand-navy">
                        Alroy Theola Ardanta (XII RPL 1)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        HP: 6281234567890 • Perwakilan Kelas
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickStudentLogin('Olivia Zahra', '6281234567898')}
                    className="w-full py-2.5 px-3 text-left text-xs bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 transition-all duration-150 active:scale-[0.99] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-black block text-brand-navy">
                        Olivia Zahra (XII TKJ 1)
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        HP: 6281234567898 • Perwakilan Kelas
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            </>
          )}

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-brand-blue hover:underline font-bold inline-flex items-center gap-1"
            >
              ← Langsung ke Halaman Scan QR Siswa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
