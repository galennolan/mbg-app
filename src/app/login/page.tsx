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
  const handleCreateInitialAccount = async (role: 'admin' | 'guru') => {
    const targetEmail = role === 'admin' ? 'admin@mbg.sekolah.id' : 'guru@mbg.sekolah.id';
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
            nama: role === 'admin' ? 'Administrator Sekolah' : 'Budi Santoso (Guru)',
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@sekolah.sch.id"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses Masuk...
                </>
              ) : (
                <>
                  Masuk ke Aplikasi
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Helper for Initial Testing / Setup */}
          <div className="pt-4 border-t border-slate-200 text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Akun Percobaan / Setup Cepat
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCreateInitialAccount('admin')}
                className="py-2 px-3 text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200 transition text-center"
              >
                Inisiasi Admin
              </button>
              <button
                type="button"
                onClick={() => handleCreateInitialAccount('guru')}
                className="py-2 px-3 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg border border-blue-200 transition text-center"
              >
                Inisiasi Guru
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Password default untuk akun inisiasi: <code className="font-mono">Password123!</code>
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

