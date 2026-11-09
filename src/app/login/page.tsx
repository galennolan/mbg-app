'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Utensils, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, user } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap masukkan email dan kata sandi');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const res = await signIn(email.trim(), password);
      if (res.error) {
        // If login failed because user doesn't exist yet, check if we can register the initial admin
        if (res.error.toLowerCase().includes('invalid login credentials')) {
          setErrorMsg(
            'Email atau kata sandi salah. Jika ini akun baru, pastikan telah didaftarkan di Supabase Auth.'
          );
        } else {
          setErrorMsg(res.error);
        }
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to register demo / initial admin account in Supabase Auth if needed
  const handleCreateInitialAccount = async (role: 'super_admin' | 'guru_piket') => {
    const targetEmail = role === 'super_admin' ? 'admin@mbg.sekolah.id' : 'guru@mbg.sekolah.id';
    const targetPassword = 'Password123!';
    setEmail(targetEmail);
    setPassword(targetPassword);
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      // Try sign up in Supabase
      const { data, error } = await supabase.auth.signUp({
        email: targetEmail,
        password: targetPassword,
        options: {
          data: {
            nama: role === 'super_admin' ? 'Super Administrator' : 'Budi Santoso (Guru Piket)',
            peran: role,
          },
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          // If already registered, try sign in directly
          const loginRes = await signIn(targetEmail, targetPassword);
          if (loginRes.error) {
            setErrorMsg(`Akun sudah terdaftar. Silakan login dengan kata sandi yang valid.`);
          } else {
            router.push('/dashboard');
          }
        } else {
          setErrorMsg(error.message);
        }
      } else {
        setInfoMsg(
          `Akun ${role} berhasil dibuat (${targetEmail} / ${targetPassword}). Jika auto-confirm aktif, Anda dapat langsung login.`
        );
        // Try direct sign in
        const loginRes = await signIn(targetEmail, targetPassword);
        if (!loginRes.error) {
          router.push('/dashboard');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Gagal menyiapkan akun.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="bg-brand-navy p-6 sm:p-8 text-center text-white relative">
          <div className="w-14 h-14 rounded-2xl bg-brand-blue flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-900/30">
            <Utensils className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Login Petugas & Guru</h1>
          <p className="text-xs text-blue-200 mt-1">
            Sistem Monitoring Makan Bergizi Gratis (MBG Tracker)
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block text-sm font-bold text-slate-800 mb-1.5">
                Alamat Email
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
                  placeholder="nama@sekolah.sch.id"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-bold text-slate-800 mb-1.5">
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
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-base disabled:opacity-50 mt-2 focus:outline-none focus:ring-4 focus:ring-brand-blue/30 focus:ring-offset-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses Masuk...
                </>
              ) : (
                <>
                  Masuk ke Aplikasi
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Helper for Initial Testing / Setup */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Akun Percobaan / Setup Cepat
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleCreateInitialAccount('super_admin')}
                className="py-3 px-3 text-sm font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-200 transition text-center"
              >
                Inisiasi Admin
              </button>
              <button
                type="button"
                onClick={() => handleCreateInitialAccount('guru_piket')}
                className="py-3 px-3 text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-200 transition text-center"
              >
                Inisiasi Guru
              </button>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Password default untuk akun inisiasi: <code className="font-mono font-bold">Password123!</code>
            </p>
          </div>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-brand-blue hover:underline font-medium">
              ← Kembali ke Halaman Siswa (QR Code)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

