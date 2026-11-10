'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { normalizePhone628 } from '@/lib/services';
import {
  GraduationCap,
  User,
  Phone,
  ShieldCheck,
  QrCode,
  ArrowRight,
  LogIn,
} from 'lucide-react';
import { Input, Button, Alert, useNotify } from '@/components/ui';

export default function StudentLoginPage() {
  const { signInStudent } = useAuth();
  const router = useRouter();
  const notify = useNotify();

  const [studentName, setStudentName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const normalized = normalizePhone628(studentPhone);
      setStudentPhone(normalized);
      const { error: signInErr, student } = await signInStudent(studentName, normalized);
      if (signInErr) {
        setError(signInErr);
        notify.error('Verifikasi Gagal', signInErr);
      } else {
        notify.success(
          'Selamat Datang!',
          `Halo ${student?.nama_lengkap || studentName}, identitas kelas ${
            student?.nama_kelas || ''
          } berhasil diverifikasi.`
        );
        router.push('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md micro-card rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-brand-blue text-white flex items-center justify-center shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-[11px] font-bold text-brand-blue">
            <ShieldCheck className="w-3.5 h-3.5" />
            PORTAL SISWA & KETUA KELAS (OPSIONAL)
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Login Identitas Siswa
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Masukkan <strong>Nama Lengkap</strong> dan <strong>Nomor HP (628xxx)</strong> agar kelas
            dan profil Anda terisi otomatis saat klaim MBG.
          </p>
        </div>

        {error && <Alert variant="error" message={error} onDismiss={() => setError('')} />}

        <form onSubmit={handleStudentSubmit} className="space-y-4">
          <Input
            label="Nama Lengkap Siswa"
            type="text"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Contoh: Alroy Theola Ardanta"
            leftIcon={<User className="w-4 h-4" />}
            autoComplete="name"
          />

          <Input
            label="Nomor WhatsApp / HP (Format 628xxx)"
            type="tel"
            inputMode="numeric"
            required
            value={studentPhone}
            onChange={(e) => setStudentPhone(e.target.value)}
            onBlur={() => {
              if (studentPhone) {
                setStudentPhone(normalizePhone628(studentPhone));
              }
            }}
            placeholder="6281234567890"
            leftIcon={<Phone className="w-4 h-4" />}
            helperText="Otomatis mengubah awalan 08xx menjadi 628xxx."
            autoComplete="tel"
          />

          <Button
            type="submit"
            disabled={loading}
            loading={loading}
            fullWidth
            size="lg"
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Masuk sebagai Siswa
          </Button>
        </form>

        {/* Quick Demo Student Accounts */}
        <div className="pt-4 border-t border-slate-200 space-y-2.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
            Akun Siswa Terdaftar (1-Klik Isi Otomatis)
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                setStudentName('Alroy Theola Ardanta');
                setStudentPhone('6281234567890');
                setError('');
              }}
              className="micro-tap min-h-[44px] text-left p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Alroy Theola Ardanta (Ketua Kelas XII RPL 1)
                </p>
                <p className="text-[11px] text-slate-600 font-mono">HP: 6281234567890</p>
              </div>
              <span className="text-[10px] font-bold bg-blue-100 text-brand-blue px-2 py-0.5 rounded-full">
                Pilih
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setStudentName('Joko Prabowo');
                setStudentPhone('6281234567896');
                setError('');
              }}
              className="micro-tap min-h-[44px] text-left p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 transition flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Joko Prabowo (Ketua Kelas XII RPL 2)
                </p>
                <p className="text-[11px] text-slate-600 font-mono">HP: 6281234567896</p>
              </div>
              <span className="text-[10px] font-bold bg-blue-100 text-brand-blue px-2 py-0.5 rounded-full">
                Pilih
              </span>
            </button>
          </div>
        </div>

        {/* Guest Mode & Staff Login Links */}
        <div className="pt-3 border-t border-slate-200 space-y-2.5">
          <Link
            href="/"
            className="micro-tap w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <QrCode className="w-4 h-4 text-emerald-700" />
            Lanjut Tanpa Login (Guest Mode Klaim Langsung)
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          <div className="text-center">
            <Link
              href="/login"
              className="text-xs font-bold text-brand-blue hover:underline inline-flex items-center gap-1"
            >
              Login sebagai Guru Piket / Kepala Sekolah / Super Admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

