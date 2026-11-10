'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Users, UserPlus, Shield, ShieldCheck, Mail, CheckCircle2, AlertTriangle, Edit2, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Pengguna, UserRole } from '@/lib/types';
import { logActivity } from '@/lib/services';
import { formatIndonesianDate } from '@/lib/utils';
import { Modal, ModalInput, ModalSelect, ModalActions } from '@/components/ui/ModalField';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ManajemenPenggunaPage() {
  const { user, role, loading: authLoading } = useAuth();
  const [usersList, setUsersList] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const router = require('next/navigation').useRouter();

  useEffect(() => {
    if (!authLoading && role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [role, authLoading, router]);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    peran: 'guru_piket' as UserRole,
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pengguna')
        .select('*')
        .order('peran')
        .order('nama');

      if (data) {
        setUsersList(data as Pengguna[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.email || !formData.password) {
      setFeedback({ type: 'error', message: 'Semua kolom wajib diisi' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      // 1. Coba Sign up user di Supabase Auth (bila Email Provider aktif)
      let newUserId: string | undefined;
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            nama: formData.nama.trim(),
            peran: formData.peran,
          },
        },
      });

      if (!authErr && authData?.user?.id) {
        newUserId = authData.user.id;
      } else {
        // Jika Email Auth dinonaktifkan di Supabase Dashboard, buat UUID langsung untuk tabel public.pengguna
        newUserId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `00000000-0000-0000-0000-${String(Date.now()).slice(-12).padStart(12, '0')}`;
      }

      if (newUserId) {
        // 2. Insert ke tabel public.pengguna di Supabase
        const { error: insErr } = await supabase.from('pengguna').upsert({
          id: newUserId,
          id_sekolah: '11111111-1111-1111-1111-111111111111',
          nama: formData.nama.trim(),
          email: formData.email.trim().toLowerCase(),
          peran: formData.peran,
          status_aktif: true,
          dibuat_pada: new Date().toISOString(),
          diperbarui_pada: new Date().toISOString(),
        });

        if (insErr) {
          console.warn('Upsert pengguna warning:', insErr);
        }

        await logActivity(
          'tambah_pengguna',
          'pengguna',
          newUserId,
          null,
          { nama: formData.nama, email: formData.email, peran: formData.peran },
          user?.id
        );
      }

      setFeedback({
        type: 'success',
        message: `Akun ${formData.peran.toUpperCase()} untuk ${formData.nama} berhasil dibuat!`,
      });
      setShowModal(false);
      setFormData({ nama: '', email: '', password: '', peran: 'guru_piket' });
      loadUsers();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menambahkan akun' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (targetUser: Pengguna) => {
    try {
      const nextStatus = !targetUser.status_aktif;
      const { error } = await supabase
        .from('pengguna')
        .update({ status_aktif: nextStatus, diperbarui_pada: new Date().toISOString() })
        .eq('id', targetUser.id);

      if (error) throw error;

      await logActivity(
        'ubah_status_pengguna',
        'pengguna',
        targetUser.id,
        targetUser,
        { status_aktif: nextStatus },
        user?.id
      );

      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status_aktif: nextStatus } : u))
      );
      setFeedback({
        type: 'success',
        message: `Status akun ${targetUser.nama} berhasil diubah menjadi ${
          nextStatus ? 'Aktif' : 'Nonaktif'
        }.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengubah status akun' });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold mb-2 border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administrator
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            Manajemen Guru & Petugas
          </h1>
          <p className="text-base text-slate-600 mt-1">
            Kelola hak akses akun guru dan administrator aplikasi MBG Tracker
          </p>
        </div>

        <button
          onClick={() => {
            setFeedback(null);
            setFormData({ nama: '', email: '', password: '', peran: 'guru_piket' });
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-3 bg-brand-blue hover:bg-brand-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          Tambah Akun Petugas
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Table Users */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Memuat daftar pengguna...
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Belum ada akun guru/petugas di tabel pengguna.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Email Akun</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Terdaftar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{u.nama}</td>
                    <td className="py-3.5 px-4 text-sm font-mono text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4 text-sm">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          u.peran === 'super_admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : u.peran === 'kepala_sekolah'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {u.peran.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-sm">
                      {u.status_aktif ? (
                        <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-xs font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-400">
                      {formatIndonesianDate(u.dibuat_pada)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                          u.status_aktif
                            ? 'bg-red-50 hover:bg-red-100 text-red-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {u.status_aktif ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah User */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setFeedback(null);
          setFormData({ nama: '', email: '', password: '', peran: 'guru_piket' });
        }}
        title="Tambah Akun Guru / Petugas"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border text-sm flex items-start gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
              role="alert"
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <ModalInput
            label="Nama Lengkap"
            required
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            placeholder="Contoh: Dra. Siti Rahmah, M.Pd"
            leftIcon={<Users className="w-5 h-5" />}
            autoComplete="name"
          />

          <ModalInput
            label="Email Akun"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="guru@sekolah.sch.id"
            leftIcon={<Mail className="w-5 h-5" />}
            autoComplete="email"
          />

          <ModalInput
            label="Kata Sandi Awal"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Minimal 8 karakter..."
            leftIcon={<KeyRound className="w-5 h-5" />}
            helperText="Ganti kata sandi setelah login pertama kali."
            autoComplete="new-password"
          />

          <ModalSelect
            label="Peran Akun"
            required
            value={formData.peran}
            onChange={(e) => setFormData({ ...formData, peran: e.target.value as UserRole })}
            options={[
              { value: 'guru_piket', label: 'Guru Piket (Koordinator MBG)' },
              { value: 'kepala_sekolah', label: 'Kepala Sekolah (Monitoring)' },
              { value: 'super_admin', label: 'Super Administrator (UBSI)' },
            ]}
          />

          <ModalActions
            onCancel={() => {
              setShowModal(false);
              setFeedback(null);
              setFormData({ nama: '', email: '', password: '', peran: 'guru_piket' });
            }}
            submitLabel="Daftarkan Akun"
            submitting={submitting}
          />
        </form>
      </Modal>
      </div>
    </ProtectedRoute>
  );
}

