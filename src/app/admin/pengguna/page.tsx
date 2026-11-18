'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/lib/auth-context';
import { Users, UserPlus, Mail, KeyRound, Building2, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Pengguna, School, UserRole } from '@/lib/types';
import { getAllSchools, logActivity } from '@/lib/services';
import { formatIndonesianDate } from '@/lib/utils';
import { Modal, ModalInput, ModalSelect, ModalActions } from '@/components/ui/ModalField';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  PageHeader,
  Select,
  Pagination,
  Button,
  FeedbackBanner,
  Alert,
  useNotify,
} from '@/components/ui';

export default function ManajemenPenggunaPage() {
  const { user, role, activeSchoolId, loading: authLoading } = useAuth();
  const notify = useNotify();
  const router = useRouter();
  const [usersList, setUsersList] = useState<Pengguna[]>([]);
  const [schoolsList, setSchoolsList] = useState<School[]>([]);
  const [filterSchoolId, setFilterSchoolId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Pengguna | null>(null);

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
    id_sekolah: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const loadUsersAndSchools = async () => {
    setLoading(true);
    try {
      const [schools, usersRes] = await Promise.all([
        getAllSchools(),
        supabase.from('pengguna').select('*').order('peran').order('nama'),
      ]);

      setSchoolsList(schools);
      if (usersRes.data) {
        setUsersList(usersRes.data as Pengguna[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersAndSchools();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterSchoolId]);

  const defaultSchoolIdForForm =
    schoolsList.find((s) => s.id === activeSchoolId)?.id || schoolsList[0]?.id || '';

  const openCreateModal = () => {
    setFeedback(null);
    setEditingUser(null);
    setFormData({
      nama: '',
      email: '',
      password: '',
      peran: 'guru_piket',
      id_sekolah: defaultSchoolIdForForm,
    });
    setShowModal(true);
  };

  const openEditModal = (target: Pengguna) => {
    setFeedback(null);
    setEditingUser(target);
    setFormData({
      nama: target.nama,
      email: target.email,
      password: '',
      peran: target.peran,
      id_sekolah: target.id_sekolah || defaultSchoolIdForForm,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFeedback(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      setFeedback({ type: 'error', message: 'Nama lengkap wajib diisi.' });
      return;
    }

    if (formData.peran !== 'super_admin' && !formData.id_sekolah) {
      setFeedback({
        type: 'error',
        message: 'Sekolah homebase wajib dipilih untuk Guru PIC MBG dan Kepala Sekolah.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const nowIso = new Date().toISOString();

      if (editingUser) {
        const { error: updErr } = await supabase
          .from('pengguna')
          .update({
            nama: formData.nama.trim(),
            peran: formData.peran,
            id_sekolah: formData.id_sekolah || null,
            diperbarui_pada: nowIso,
          })
          .eq('id', editingUser.id);

        if (updErr) throw updErr;

        await logActivity(
          'ubah_pengguna',
          'pengguna',
          editingUser.id,
          editingUser,
          {
            nama: formData.nama.trim(),
            peran: formData.peran,
            id_sekolah: formData.id_sekolah || null,
          },
          user?.id
        );

        const msg = `Data & homebase sekolah untuk ${formData.nama.trim()} berhasil diperbarui.`;
        setFeedback({ type: 'success', message: msg });
        notify.success('Pengguna Diperbarui', msg);
        closeModal();
        await loadUsersAndSchools();
        return;
      }

      // Create new user: pakai client terpisah tanpa persistSession agar sesi Super Admin tidak tertimpa
      if (!formData.email.trim() || !formData.password) {
        setFeedback({ type: 'error', message: 'Email dan kata sandi wajib diisi.' });
        return;
      }

      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gycsuicoresilralvgol.supabase.co';
      const supabaseKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        '';

      const ephemeralClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: authData, error: authErr } = await ephemeralClient.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            nama: formData.nama.trim(),
            peran: formData.peran,
            id_sekolah: formData.id_sekolah || null,
          },
        },
      });

      if (authErr || !authData?.user?.id) {
        throw new Error(
          authErr?.message ||
            'Gagal mendaftarkan user ke Supabase Auth. Pastikan Sign Up diaktifkan atau buat user lewat Supabase Auth lalu ikat ke sekolah.'
        );
      }

      const newUserId = authData.user.id;
      const { error: insErr } = await supabase.from('pengguna').upsert({
        id: newUserId,
        id_sekolah: formData.id_sekolah || null,
        nama: formData.nama.trim(),
        email: formData.email.trim().toLowerCase(),
        peran: formData.peran,
        status_aktif: true,
        dibuat_pada: nowIso,
        diperbarui_pada: nowIso,
      });

      if (insErr) throw insErr;

      await logActivity(
        'tambah_pengguna',
        'pengguna',
        newUserId,
        null,
        {
          nama: formData.nama.trim(),
          email: formData.email.trim().toLowerCase(),
          peran: formData.peran,
          id_sekolah: formData.id_sekolah || null,
        },
        user?.id
      );

      const schoolName =
        schoolsList.find((s) => s.id === formData.id_sekolah)?.nama_sekolah || 'Sekolah';
      const msg = `Akun ${formData.peran.replace('_', ' ').toUpperCase()} untuk ${formData.nama.trim()} (${schoolName}) berhasil dibuat!`;
      setFeedback({ type: 'success', message: msg });
      notify.success('Akun Petugas Dibuat', msg);
      closeModal();
      await loadUsersAndSchools();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan akun petugas.' });
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

  const schoolById = new Map(schoolsList.map((s) => [s.id, s]));
  const filteredUsers = usersList.filter(
    (u) => !filterSchoolId || u.id_sekolah === filterSchoolId
  );
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <PageHeader
          title="Manajemen Guru & Petugas"
          subtitle="Kelola akun Guru PIC MBG, Kepala Sekolah, dan homebase sekolah masing-masing."
          badgeText="ADMINISTRATOR"
        >
          <Button type="button" onClick={openCreateModal} leftIcon={<UserPlus className="w-4 h-4" />}>
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

        {/* Filter Sekolah */}
        <div className="micro-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="w-full sm:w-80">
            <Select
              label="Filter Berdasarkan Sekolah Homebase"
              value={filterSchoolId}
              onValueChange={setFilterSchoolId}
              options={[
                { value: '', label: `Semua Sekolah (${usersList.length} Akun)` },
                ...schoolsList.map((s) => ({
                  value: s.id,
                  label: `${s.nama_sekolah} (${s.npsn})`,
                })),
              ]}
            />
          </div>
          <div className="text-xs text-slate-600 font-semibold">
            Menampilkan {filteredUsers.length} akun petugas
          </div>
        </div>

        {/* Table Users */}
        <div className="micro-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat daftar pengguna...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Belum ada akun guru/petugas untuk filter sekolah ini.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4">Email Akun</th>
                      <th className="py-3 px-4">Sekolah Homebase</th>
                      <th className="py-3 px-4">Peran</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Terdaftar</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedUsers.map((u) => {
                      const homebase = u.id_sekolah ? schoolById.get(u.id_sekolah) : null;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{u.nama}</td>
                          <td className="py-3.5 px-4 text-sm font-mono text-slate-600">{u.email}</td>
                          <td className="py-3.5 px-4 text-xs">
                            {homebase ? (
                              <div>
                                <div className="font-semibold text-slate-800">
                                  {homebase.nama_sekolah}
                                </div>
                                <div className="text-slate-500 font-mono">NPSN: {homebase.npsn}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Lintas Sekolah / Belum Diikat</span>
                            )}
                          </td>
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
                              {u.peran === 'guru_piket'
                            ? 'Guru PIC MBG'
                            : u.peran.replace('_', ' ')}
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
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditModal(u)}
                                className="micro-tap p-2 text-slate-600 hover:text-brand-blue rounded-lg hover:bg-slate-100 transition"
                                title="Edit Peran & Sekolah Homebase"
                                aria-label={`Edit pengguna ${u.nama}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
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
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={safePage}
                totalItems={filteredUsers.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                itemLabel="pengguna"
              />
            </>
          )}
        </div>

        {/* Modal Tambah / Edit User */}
        <Modal
          isOpen={showModal}
          onClose={closeModal}
          title={editingUser ? 'Edit Petugas & Homebase Sekolah' : 'Tambah Akun Guru / Petugas'}
          size="md"
        >
          <form onSubmit={handleSaveUser} className="space-y-4">
            {feedback && <Alert variant={feedback.type} message={feedback.message} />}

            <ModalInput
              label="Nama Lengkap"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Contoh: Dra. Siti Rahmah, M.Pd"
              leftIcon={<Users className="w-5 h-5" />}
              autoComplete="name"
            />

            {!editingUser && (
              <>
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
              </>
            )}

            <ModalSelect
              label="Peran Akun"
              required
              value={formData.peran}
              onChange={(e) => setFormData({ ...formData, peran: e.target.value as UserRole })}
              options={[
                { value: 'guru_piket', label: 'Guru PIC MBG (Koordinator MBG)' },
                { value: 'kepala_sekolah', label: 'Kepala Sekolah (Monitoring)' },
                { value: 'super_admin', label: 'Super Administrator (Lintas Sekolah)' },
              ]}
            />

            <ModalSelect
              label="Sekolah Homebase"
              required={formData.peran !== 'super_admin'}
              value={formData.id_sekolah}
              onChange={(e) => setFormData({ ...formData, id_sekolah: e.target.value })}
              placeholder="Pilih Sekolah Homebase"
              helperText="Guru PIC MBG & Kepala Sekolah akan otomatis masuk ke sekolah ini saat login."
              options={schoolsList.map((s) => ({
                value: s.id,
                label: `${s.nama_sekolah} (NPSN: ${s.npsn})`,
              }))}
            />

            <ModalActions
              onCancel={closeModal}
              submitLabel={editingUser ? 'Simpan Perubahan' : 'Daftarkan Akun'}
              submitting={submitting}
            />
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
