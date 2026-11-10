'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  UserCheck,
  Truck,
  CheckCircle2,
  Hash,
} from 'lucide-react';
import { School } from '@/lib/types';
import {
  getAllSchools,
  saveSchool,
  deleteSchool,
  SEED_SCHOOL,
} from '@/lib/services';
import {
  Modal,
  ModalInput,
  ModalActions,
} from '@/components/ui/ModalField';
import {
  PageHeader,
  Button,
  FeedbackBanner,
  Alert,
  useNotify,
} from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ManajemenSekolahPage() {
  const { user, activeSchoolId, setActiveSchoolId } = useAuth();
  const notify = useNotify();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    npsn: '',
    nama_sekolah: '',
    nama_kepala_sekolah: '',
    nip_kepala_sekolah: '',
    nama_sppg_mitra: '',
  });

  const loadSchools = async () => {
    setLoading(true);
    try {
      const list = await getAllSchools();
      setSchools(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const resetForm = () => {
    setEditingSchool(null);
    setFormData({
      npsn: '',
      nama_sekolah: '',
      nama_kepala_sekolah: '',
      nip_kepala_sekolah: '',
      nama_sppg_mitra: '',
    });
  };

  const handleOpenModal = (school?: School) => {
    setFeedback(null);
    if (school) {
      setEditingSchool(school);
      setFormData({
        npsn: school.npsn,
        nama_sekolah: school.nama_sekolah,
        nama_kepala_sekolah: school.nama_kepala_sekolah || '',
        nip_kepala_sekolah: school.nip_kepala_sekolah || '',
        nama_sppg_mitra: school.nama_sppg_mitra || '',
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.npsn.trim() || !formData.nama_sekolah.trim()) {
      setFeedback({
        type: 'error',
        message: 'NPSN dan Nama Sekolah wajib diisi.',
      });
      return;
    }

    setSubmitting(true);
    try {
      const saved = await saveSchool(
        {
          id: editingSchool?.id,
          npsn: formData.npsn,
          nama_sekolah: formData.nama_sekolah,
          nama_kepala_sekolah: formData.nama_kepala_sekolah,
          nip_kepala_sekolah: formData.nip_kepala_sekolah,
          nama_sppg_mitra: formData.nama_sppg_mitra,
        },
        user?.id
      );

      const msg = editingSchool
        ? `Data sekolah "${saved.nama_sekolah}" berhasil diperbarui.`
        : `Sekolah mitra baru "${saved.nama_sekolah}" (NPSN: ${saved.npsn}) berhasil ditambahkan.`;

      setShowModal(false);
      resetForm();
      setFeedback({ type: 'success', message: msg });
      notify.success('Data Sekolah Tersimpan', msg);
      await loadSchools();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Gagal menyimpan data sekolah.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (school: School) => {
    if (school.id === SEED_SCHOOL.id) {
      notify.warning(
        'Tidak Dapat Dihapus',
        'Sekolah pusat utama (UBSI Center) tidak dapat dihapus.'
      );
      return;
    }

    const confirmed = await notify.confirm({
      icon: 'warning',
      title: 'Hapus Sekolah Mitra?',
      text: `Sekolah "${school.nama_sekolah}" (NPSN: ${school.npsn}) akan dihapus dari daftar multi-tenant.`,
      confirmText: 'Ya, Hapus Sekolah',
      cancelText: 'Batal',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    try {
      const updated = await deleteSchool(school.id, user?.id);
      setSchools(updated);
      if (activeSchoolId === school.id) {
        setActiveSchoolId(SEED_SCHOOL.id);
      }
      const msg = `Sekolah "${school.nama_sekolah}" telah dihapus.`;
      setFeedback({ type: 'success', message: msg });
      notify.info('Sekolah Dihapus', msg);
    } catch (err: any) {
      notify.error('Gagal Menghapus', err?.message || 'Terjadi kesalahan.');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-6 pb-20">
        <PageHeader
          title="Manajemen Sekolah Mitra (SaaS Multi-Tenant)"
          subtitle="Kelola daftar sekolah penerima manfaat MBG, identitas Kepala Sekolah, dan SPPG Mitra penyedia katering."
          badgeText="MASTER MENU • SUPER ADMIN"
        >
          <Button
            type="button"
            onClick={() => handleOpenModal()}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Sekolah Baru
          </Button>
        </PageHeader>

        {feedback && (
          <FeedbackBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        {/* Daftar Sekolah Multi-Tenant */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {loading ? (
            <div className="col-span-full micro-card rounded-2xl p-12 text-center text-sm text-slate-500">
              <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat daftar sekolah mitra...
            </div>
          ) : (
            schools.map((school) => {
              const isSelectedView = activeSchoolId === school.id;
              return (
                <div
                  key={school.id}
                  className={`micro-card rounded-2xl p-5 flex flex-col justify-between gap-4 border-2 transition ${
                    isSelectedView
                      ? 'border-brand-blue bg-blue-50/30'
                      : 'border-slate-200/80'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-brand-navy text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Building2 className="w-5 h-5 text-cyan-300" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                              NPSN: {school.npsn}
                            </span>
                            {isSelectedView && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Sekolah Aktif Dilihat
                              </span>
                            )}
                          </div>
                          <h2 className="text-base font-black text-slate-900 mt-1">
                            {school.nama_sekolah}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-brand-blue" />
                          Kepala Sekolah:
                        </span>
                        <span className="font-bold text-slate-800 text-right">
                          {school.nama_kepala_sekolah || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          NIP Kepsek:
                        </span>
                        <span className="font-mono font-semibold text-slate-700">
                          {school.nip_kepala_sekolah || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          Mitra SPPG:
                        </span>
                        <span className="font-bold text-emerald-800 text-right">
                          {school.nama_sppg_mitra || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelectedView ? 'primary' : 'secondary'}
                      onClick={() => {
                        setActiveSchoolId(school.id);
                        notify.info(
                          'Switch School View Aktif',
                          `Tampilan operasional dialihkan ke ${school.nama_sekolah}.`
                        );
                      }}
                    >
                      {isSelectedView ? 'Sedang Dipantau' : 'Pantau Sekolah Ini'}
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenModal(school)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>

                      {school.id !== SEED_SCHOOL.id && (
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(school)}
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Tambah / Edit Sekolah */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            resetForm();
          }}
          title={editingSchool ? 'Edit Data Sekolah Mitra' : 'Tambah Sekolah Mitra Baru'}
          description="Data sekolah digunakan untuk isolasi multi-tenant (id_sekolah) dan kop berita acara BGN."
          size="md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {feedback && feedback.type === 'error' && (
              <Alert variant="error" message={feedback.message} />
            )}

            <ModalInput
              label="NPSN (Nomor Pokok Sekolah Nasional)"
              required
              value={formData.npsn}
              onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
              placeholder="Contoh: 20327971"
              leftIcon={<Hash className="w-4 h-4" />}
              helperText="8 digit kode unik sekolah dari Kemendikbudristek."
              inputMode="numeric"
            />

            <ModalInput
              label="Nama Lengkap Sekolah"
              required
              value={formData.nama_sekolah}
              onChange={(e) => setFormData({ ...formData, nama_sekolah: e.target.value })}
              placeholder="Contoh: SMAN 1 Surakarta"
              leftIcon={<Building2 className="w-4 h-4" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalInput
                label="Nama Kepala Sekolah"
                value={formData.nama_kepala_sekolah}
                onChange={(e) =>
                  setFormData({ ...formData, nama_kepala_sekolah: e.target.value })
                }
                placeholder="Contoh: Drs. Harminingsih, M.Pd"
                leftIcon={<UserCheck className="w-4 h-4" />}
              />

              <ModalInput
                label="NIP Kepala Sekolah"
                value={formData.nip_kepala_sekolah}
                onChange={(e) =>
                  setFormData({ ...formData, nip_kepala_sekolah: e.target.value })
                }
                placeholder="196804151993032008"
                inputMode="numeric"
              />
            </div>

            <ModalInput
              label="Nama SPPG Mitra (Dapur Penyedia MBG)"
              value={formData.nama_sppg_mitra}
              onChange={(e) =>
                setFormData({ ...formData, nama_sppg_mitra: e.target.value })
              }
              placeholder="Contoh: SPPG Nusantara Mandiri"
              leftIcon={<Truck className="w-4 h-4" />}
            />

            <ModalActions
              onCancel={() => {
                setShowModal(false);
                resetForm();
              }}
              submitLabel={editingSchool ? 'Simpan Perubahan' : 'Simpan Sekolah'}
              submitting={submitting}
            />
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}

