'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Utensils,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  User,
  GraduationCap,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { isValidPhone628, normalizePhone628 } from '@/lib/services';
import { Input, Button, Alert, useNotify } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const notify = useNotify();
  const { signIn, signInStudent, user, isStudent } = useAuth();

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
            'Email atau kata sandi salah. Pastikan akun petugas Anda terdaftar dan aktif.'
          );
        } else {
          setErrorMsg(res.error);
        }
      } else {
        notify.success('Login Berhasil', 'Selamat bertugas di dashboard operasional MBG.');
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
        notify.success('Selamat Datang', `Halo ${namaSiswa.trim()}, silakan verifikasi PIN atau QR MBG.`);
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login siswa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-6 sm:py-10 px-4">
      <div className="bg-white rounded-3xl shadow-elevated border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-brand-navy p-6 sm:p-8 text-center text-white">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue flex items-center justify-center mx-auto mb-3 shadow-md">
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

          {/* Dual-Mode Segmented Tab Switcher */}
          <div className="mt-5 grid grid-cols-2 p-1.5 rounded-xl bg-slate-950/60 border border-white/15">
            <button
              type="button"
              onClick={() => {
                setLoginMode('staff');
                setErrorMsg('');
                setInfoMsg('');
              }}
              className={`micro-tap min-h-[42px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition ${
                loginMode === 'staff'
                  ? 'bg-brand-blue text-white shadow-sm'
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
              className={`micro-tap min-h-[42px] flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-black transition ${
                loginMode === 'student'
                  ? 'bg-brand-blue text-white shadow-sm'
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
            <Alert
              variant="error"
              message={errorMsg}
              onDismiss={() => setErrorMsg('')}
            />
          )}

          {infoMsg && (
            <Alert
              variant="info"
              message={infoMsg}
              onDismiss={() => setInfoMsg('')}
            />
          )}

          {loginMode === 'staff' ? (
            /* ==================== TAB 1: LOGIN PETUGAS (EMAIL + PASSWORD) ==================== */
            <>
              <form onSubmit={handleStaffSubmit} className="space-y-4">
                <Input
                  id="login-email"
                  label="Alamat Email Petugas"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@mbg.sekolah.id"
                  autoComplete="email"
                  leftIcon={<Mail className="w-5 h-5" />}
                />

                <Input
                  id="login-password"
                  label="Kata Sandi"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  leftIcon={<Lock className="w-5 h-5" />}
                />

                <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Masuk Sebagai Petugas
                </Button>
              </form>
            </>
          ) : (
            /* ==================== TAB 2: LOGIN SISWA (NAMA + NO. HP 628xxx) ==================== */
            <>
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <Input
                  id="student-name"
                  label="Nama Lengkap Siswa"
                  type="text"
                  required
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  placeholder="Contoh: Alroy Theola Ardanta"
                  leftIcon={<User className="w-5 h-5" />}
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="student-phone"
                      className="block text-sm font-semibold text-slate-800"
                    >
                      Nomor HP WhatsApp (628xxx) <span className="text-red-600">*</span>
                    </label>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        phoneValid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
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
                  <Input
                    id="student-phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    value={noHpSiswa}
                    onChange={(e) => handlePhoneInputChange(e.target.value)}
                    placeholder="6281234567890"
                    leftIcon={<Phone className="w-5 h-5" />}
                    helperText="Ketik 08xx atau 628xx, sistem otomatis menyesuaikan ke standar 628xxx."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !phoneValid || !namaSiswa.trim()}
                  loading={loading}
                  fullWidth
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Masuk Portal Siswa
                </Button>
              </form>
            </>
          )}

          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs text-brand-blue hover:underline font-bold inline-flex items-center gap-1"
            >
              Kembali ke Halaman Scan QR Siswa
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
