'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Users, UserPlus, Shield, ShieldCheck, Mail, CheckCircle2, AlertTriangle, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Pengguna, UserRole } from '@/lib/types';
import { logActivity } from '@/lib/services';
import { formatIndonesianDate } from '@/lib/utils';

export default function ManajemenPenggunaPage() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    peran: 'guru' as UserRole,
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
      // 1. Sign up user in Supabase Auth
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

      if (authErr) throw authErr;

      const newUserId = authData.user?.id;
      if (newUserId) {
        // 2. Insert into pengguna table
        const { error: insErr } = await supabase.from('pengguna').upsert({
          id: newUserId,
          nama: formData.nama.trim(),
          email: formData.email.trim(),
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
      setFormData({ nama: '', email: '', password: '', peran: 'guru' });
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
          <p className="text-sm text-slate-500 mt-1">
            Kelola hak akses akun guru dan administrator aplikasi MBG Tracker
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
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
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
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
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.nama}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{u.email}</td>
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          u.peran === 'admin'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-blue-100 text-blue-800 border border-blue-300'
                        }`}
                      >
                        {u.peran}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {u.status_aktif ? (
                        <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-base text-slate-900">Tambah Akun Guru / Petugas</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Dra. Siti Rahmah, M.Pd"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Akun *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="guru@sekolah.sch.id"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kata Sandi Awal *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 8 karakter..."
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Peran Akun *
                </label>
                <select
                  value={formData.peran}
                  onChange={(e) =>
                    setFormData({ ...formData, peran: e.target.value as UserRole })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="guru">Guru / Petugas MBG</option>
                  <option value="admin">Administrator Sekolah</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold rounded-xl transition shadow disabled:opacity-50"
                >
                  {submitting ? 'Membuat Akun...' : 'Daftarkan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

