'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Users, UserPlus, Mail, KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Pengguna, UserRole } from '@/lib/types';
import { logActivity } from '@/lib/services';
import { formatIndonesianDate } from '@/lib/utils';
import { Modal, ModalInput, ModalSelect, ModalActions } from '@/components/ui/ModalField';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageHeader, Button, FeedbackBanner, Alert, useNotify } from '@/components/ui';

export default function ManajemenPenggunaPage() {
  const { user, role, loading: authLoading } = useAuth();
  const notify = useNotify();
  const router = useRouter();
  const [usersList, setUsersList] = useState<Pengguna[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
      const { data } = await supabase
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
        newUserId =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `00000000-0000-0000-0000-${String(Date.now()).slice(-12).padStart(12, '0')}`;
      }

      if (newUserId) {
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

      const msg = `Akun ${formData.peran.toUpperCase()} untuk ${formData.nama} berhasil dibuat!`;
      setFeedback({ type: 'success', message: msg });
      notify.success('Akun Petugas Dibuat', msg);
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
      const msg = `Status akun ${targetUser.nama} berhasil diubah menjadi ${
        nextStatus ? 'Aktif' : 'Nonaktif'
      }.`;
      setFeedback({ type: 'success', message: msg });
      notify.info('Status Akun Diperbarui', msg);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal mengubah status akun' });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <PageHeader
          title="Manajemen Guru & Petugas"
          subtitle="Kelola hak akses akun guru dan administrator aplikasi MBG Tracker."
          badgeText="ADMINISTRATOR"
        >
          <Button
            type="button"
            onClick={() => {
              setFeedback(null);
              setFormData({ nama: '', email: '', password: '', peran: 'guru_piket' });
              setShowModal(true);
            }}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Tambah Akun Petugas
          </Button>
        </PageHeader>

        {feedback && (
          <FeedbackBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        {/* Table Users */}
        <div className="micro-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat daftar pengguna...
            </div>
          ) : usersList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
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
                      <td className="py-3.5 px-4 text-sm text-slate-500">
                        {formatIndonesianDate(u.dibuat_pada)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-xs">
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u)}
                          className={`micro-tap min-h-[36px] px-3 py-1.5 rounded-xl font-semibold transition ${
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
              <Alert variant={feedback.type} message={feedback.message} />
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
