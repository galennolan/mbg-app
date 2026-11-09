'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Building2, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Kelas } from '@/lib/types';
import { logActivity } from '@/lib/services';
import { Modal, ModalInput, ModalSelect, ModalCheckbox, ModalActions } from '@/components/ui/ModalField';

export default function ManajemenKelasPage() {
  const { user } = useAuth();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);

  const [formData, setFormData] = useState({
    nama_kelas: '',
    tingkat: 'X' as 'X' | 'XI' | 'XII',
    jurusan: '',
    status_aktif: true,
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kelas')
        .select('*, siswa:siswa(id)')
        .order('tingkat')
        .order('nama_kelas');

      if (data) {
        setKelasList(data as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleOpenModal = (kelas?: Kelas) => {
    if (kelas) {
      setEditingKelas(kelas);
      setFormData({
        nama_kelas: kelas.nama_kelas,
        tingkat: kelas.tingkat as 'X' | 'XI' | 'XII',
        jurusan: kelas.jurusan,
        status_aktif: kelas.status_aktif ?? true,
      });
    } else {
      setEditingKelas(null);
      setFormData({ nama_kelas: '', tingkat: 'X', jurusan: '', status_aktif: true });
    }
    setFeedback(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingKelas(null);
    setFormData({ nama_kelas: '', tingkat: 'X', jurusan: '', status_aktif: true });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_kelas || !formData.jurusan) {
      setFeedback({ type: 'error', message: 'Semua kolom wajib diisi' });
      return;
    }

    setSubmitting(true);
    let successMessage = '';
    try {
      if (editingKelas) {
        const { error } = await supabase
          .from('kelas')
          .update({
            nama_kelas: formData.nama_kelas.trim(),
            tingkat: formData.tingkat,
            jurusan: formData.jurusan.trim(),
            status_aktif: formData.status_aktif,
            diperbarui_pada: new Date().toISOString(),
          })
          .eq('id', editingKelas.id);

        if (error) throw error;
        await logActivity('edit_kelas', 'kelas', editingKelas.id, editingKelas, formData, user?.id);
        successMessage = 'Data kelas berhasil diperbarui';
      } else {
        const { data, error } = await supabase
          .from('kelas')
          .insert({
            nama_kelas: formData.nama_kelas.trim(),
            tingkat: formData.tingkat,
            jurusan: formData.jurusan.trim(),
            status_aktif: true,
          })
          .select()
          .single();

        if (error) throw error;
        await logActivity('tambah_kelas', 'kelas', data.id, null, data, user?.id);
        successMessage = 'Kelas baru berhasil ditambahkan';
      }

      setShowModal(false);
      resetForm();
      setFeedback({ type: 'success', message: successMessage });
      loadClasses();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan data kelas' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold mb-2 border border-amber-200">
            <Building2 className="w-3.5 h-3.5" />
            Administrator
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            Manajemen Kelas & Jurusan
          </h1>
          <p className="text-base text-slate-600 mt-1">
            Atur data kelas, tingkat jenjang, dan keahlian jurusan sekolah
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-3 bg-brand-blue hover:bg-brand-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Kelas Baru
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

      {/* Table Kelas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Memuat daftar kelas...
          </div>
        ) : kelasList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Belum ada data kelas yang terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Kelas</th>
                  <th className="py-3 px-4">Tingkat</th>
                  <th className="py-3 px-4">Jurusan</th>
                  <th className="py-3 px-4">Jumlah Siswa</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kelasList.map((k: any) => (
                  <tr key={k.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{k.nama_kelas}</td>
                    <td className="py-3.5 px-4 text-sm font-semibold text-slate-700">
                      Kelas {k.tingkat}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-slate-600">{k.jurusan}</td>
                    <td className="py-3.5 px-4 text-sm font-mono text-brand-blue font-bold">
                      {k.siswa?.length || 0} Siswa
                    </td>
                    <td className="py-3.5 px-4 text-sm">
                      {k.status_aktif ? (
                        <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs">
                      <button
                        onClick={() => handleOpenModal(k)}
                        className="p-2 text-slate-600 hover:text-brand-blue rounded-lg hover:bg-slate-100 transition"
                        title="Edit Kelas"
                        aria-label={`Edit kelas ${k.nama_kelas}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah/Edit Kelas */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingKelas ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
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
            label="Nama Kelas"
            required
            value={formData.nama_kelas}
            onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
            placeholder="Contoh: XI RPL 1"
            leftIcon={<Users className="w-5 h-5" />}
            autoComplete="off"
          />

          <ModalSelect
            label="Tingkat Jenjang"
            required
            value={formData.tingkat}
            onChange={(e) => setFormData({ ...formData, tingkat: e.target.value as 'X' | 'XI' | 'XII' })}
            options={[
              { value: 'X', label: 'Kelas X' },
              { value: 'XI', label: 'Kelas XI' },
              { value: 'XII', label: 'Kelas XII' },
            ]}
          />

          <ModalInput
            label="Jurusan / Kompetensi Keahlian"
            required
            value={formData.jurusan}
            onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
            placeholder="Contoh: Rekayasa Perangkat Lunak"
            leftIcon={<Building2 className="w-5 h-5" />}
            autoComplete="off"
          />

          <ModalCheckbox
            label="Status Kelas Aktif"
            checked={formData.status_aktif}
            onChange={(checked) => setFormData({ ...formData, status_aktif: checked })}
          />

          <ModalActions
            onCancel={() => {
              setShowModal(false);
              resetForm();
            }}
            submitLabel={editingKelas ? 'Simpan Perubahan' : 'Simpan Kelas'}
            submitting={submitting}
          />
        </form>
      </Modal>
    </div>
  );
}

