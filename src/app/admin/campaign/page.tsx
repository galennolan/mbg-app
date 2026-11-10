'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCw,
  Database,
  GraduationCap,
  Image as ImageIcon,
  MessageCircle,
  Target,
  Power,
} from 'lucide-react';
import {
  getAllCrmCampaigns,
  saveCrmCampaign,
  toggleCrmCampaignStatus,
  deleteCrmCampaign,
  syncMasterDataDapodik,
} from '@/lib/services';
import { CrmCampaign } from '@/lib/types';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal, ModalInput, ModalSelect, ModalActions } from '@/components/ui/ModalField';

const JURUSAN_OPTIONS = ['RPL', 'TKJ', 'IPA', 'IPS', 'AKUNTANSI', 'UMUM'];

export default function CampaignManagerPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<CrmCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingDapodik, setSyncingDapodik] = useState(false);

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const [formData, setFormData] = useState({
    judul_promo: '',
    banner_image_url: '',
    cta_url_template: 'https://wa.me/6281299998888?text=Halo%20Tim%20PMB%20UBSI,%20saya%20ingin%20info%20beasiswa',
    rekomendasi_fakultas_ubsi: 'Fakultas Teknik & Informatika (FTI)',
    target_tingkat: 'XII',
    target_jurusan: ['RPL', 'TKJ'] as string[],
    poin_interaksi: 2,
    status_aktif: true,
  });

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const list = await getAllCrmCampaigns();
      setCampaigns(list);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal memuat daftar campaign.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      judul_promo: '',
      banner_image_url:
        'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
      cta_url_template:
        'https://wa.me/6281299998888?text=Halo%20Tim%20PMB%20UBSI,%20saya%20tertarik%20info%20Beasiswa%20UBSI',
      rekomendasi_fakultas_ubsi: 'Fakultas Teknik & Informatika (FTI)',
      target_tingkat: 'XII',
      target_jurusan: ['RPL', 'TKJ'],
      poin_interaksi: 2,
      status_aktif: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (camp: CrmCampaign) => {
    setEditingId(camp.id);
    setFormData({
      judul_promo: camp.judul_promo,
      banner_image_url: camp.banner_image_url || '',
      cta_url_template: camp.cta_url_template || '',
      rekomendasi_fakultas_ubsi: camp.rekomendasi_fakultas_ubsi || '',
      target_tingkat: camp.target_tingkat || 'XII',
      target_jurusan: camp.target_jurusan || ['UMUM'],
      poin_interaksi: camp.poin_interaksi || 1,
      status_aktif: camp.status_aktif !== false,
    });
    setShowModal(true);
  };

  const toggleJurusanOption = (jur: string) => {
    setFormData((prev) => {
      const exists = prev.target_jurusan.includes(jur);
      const next = exists
        ? prev.target_jurusan.filter((j) => j !== jur)
        : [...prev.target_jurusan, jur];
      return { ...prev, target_jurusan: next.length > 0 ? next : ['UMUM'] };
    });
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul_promo.trim()) {
      setFeedback({ type: 'error', message: 'Judul Campaign wajib diisi.' });
      return;
    }

    setSubmitting(true);
    try {
      await saveCrmCampaign(
        {
          id: editingId || undefined,
          ...formData,
        },
        user?.id
      );
      setShowModal(false);
      await loadCampaigns();
      setFeedback({
        type: 'success',
        message: editingId
          ? 'Campaign Marcomm UBSI berhasil diperbarui!'
          : 'Campaign baru berhasil ditambahkan & aktif!',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan campaign.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (camp: CrmCampaign) => {
    const nextStatus = camp.status_aktif === false ? true : false;
    const updated = await toggleCrmCampaignStatus(camp.id, nextStatus, user?.id);
    setCampaigns(updated);
    setFeedback({
      type: 'success',
      message: `Iklan "${camp.judul_promo}" telah ${
        nextStatus ? 'DIAKTIFKAN (Tampil di HP Siswa)' : 'DINONAKTIFKAN (Disembunyikan dari HP Siswa)'
      }.`,
    });
  };

  const handleDelete = async (camp: CrmCampaign) => {
    const updated = await deleteCrmCampaign(camp.id, user?.id);
    setCampaigns(updated);
    setFeedback({
      type: 'success',
      message: `Campaign "${camp.judul_promo}" telah dihapus.`,
    });
  };

  const handleSyncMasterDapodik = async () => {
    setSyncingDapodik(true);
    setFeedback(null);
    try {
      const res = await syncMasterDataDapodik(user?.id);
      setFeedback({
        type: 'success',
        message: `Sync Master Data Dapodik Selesai! ${res.totalKelas} Kelas & ${res.totalSiswa} Akun Siswa (Format 628xxx) telah disinkronkan.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal melakukan Sync Master Data.' });
    } finally {
      setSyncingDapodik(false);
    }
  };

  const activeCount = campaigns.filter((c) => c.status_aktif !== false).length;

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <div className="space-y-6 pb-20">
        <PageHeader
          title="Master Menu & Campaign Manager (Marcomm UBSI)"
          subtitle="Kelola banner iklan beasiswa di HP siswa, targeting jurusan, link WhatsApp PMB, dan sinkronisasi Dapodik."
          badgeText="SUPER ADMIN • MARCOMM UBSI"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncMasterDapodik}
              disabled={syncingDapodik}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-black border border-amber-300 shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              <Database className={`w-3.5 h-3.5 ${syncingDapodik ? 'animate-bounce' : ''}`} />
              {syncingDapodik ? 'Menarik Data Dapodik...' : 'Sync Master Data'}
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white text-xs font-black shadow-md shadow-blue-900/20 transition-all duration-200 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Buat Campaign Baru
            </button>
          </div>
        </PageHeader>

        {feedback && (
          <div
            className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              )}
              <span className="font-semibold">{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline opacity-75 hover:opacity-100"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Master Data & Campaign Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-white/20 bg-white/80 p-5 shadow-lg backdrop-blur-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Campaign CRM
              </span>
              <p className="text-3xl font-black text-brand-navy mt-1">{campaigns.length}</p>
              <p className="text-xs text-slate-500 mt-0.5">Program Promosi & Beasiswa UBSI</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/80 p-5 shadow-lg backdrop-blur-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Tayang di HP Siswa
              </span>
              <p className="text-3xl font-black text-emerald-600 mt-1">{activeCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {campaigns.length - activeCount} Campaign Nonaktif
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Power className="w-6 h-6" />
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-orange-50/60 p-5 shadow-lg backdrop-blur-xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                Master Data Pulling Tool
              </span>
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs text-amber-900/80 my-2">
              Tarik pembaruan data siswa & kelas Dapodik terbaru beserta auto-generate akun login 628xxx.
            </p>
            <button
              type="button"
              onClick={handleSyncMasterDapodik}
              disabled={syncingDapodik}
              className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncingDapodik ? 'animate-spin' : ''}`} />
              {syncingDapodik ? 'Menyinkronkan...' : 'Tarik Data Dapodik Sekarang'}
            </button>
          </div>
        </div>

        {/* Campaign List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {campaigns.map((camp) => {
            const isActive = camp.status_aktif !== false;
            return (
              <div
                key={camp.id}
                className={`rounded-3xl border overflow-hidden shadow-lg backdrop-blur-xl transition-all duration-300 flex flex-col justify-between ${
                  isActive
                    ? 'bg-white/90 border-slate-200 hover:shadow-xl'
                    : 'bg-slate-100/80 border-slate-200/70 opacity-75'
                }`}
              >
                <div>
                  {/* Banner Preview Header */}
                  <div className="relative h-44 bg-gradient-to-r from-brand-navy to-indigo-950 overflow-hidden">
                    {camp.banner_image_url ? (
                      <img
                        src={camp.banner_image_url}
                        alt={camp.judul_promo}
                        className="w-full h-full object-cover opacity-80 transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sky-300/40">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

                    {/* Top Status Pill & Toggle Switch */}
                    <div className="absolute top-3 inset-x-4 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black shadow-sm ${
                          isActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-white animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {isActive ? 'AKTIF TAYANG' : 'NONAKTIF (OFF)'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(camp)}
                        role="switch"
                        aria-checked={isActive}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold shadow-md transition-all duration-200 active:scale-95 ${
                          isActive
                            ? 'bg-white text-emerald-800 hover:bg-emerald-50'
                            : 'bg-amber-500 text-white hover:bg-amber-600'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {isActive ? 'Matikan Iklan' : 'Aktifkan Iklan'}
                      </button>
                    </div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-3 inset-x-4 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block">
                        {camp.rekomendasi_fakultas_ubsi || 'Universitas BSI'}
                      </span>
                      <h3 className="text-base font-black leading-snug line-clamp-2">
                        {camp.judul_promo}
                      </h3>
                    </div>
                  </div>

                  {/* Details Body */}
                  <div className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-brand-blue px-2.5 py-1 rounded-lg border border-blue-200">
                        <Target className="w-3 h-3" />
                        Kelas {camp.target_tingkat}
                      </span>
                      {(camp.target_jurusan || []).map((jur) => (
                        <span
                          key={jur}
                          className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                        >
                          Jurusan {jur}
                        </span>
                      ))}
                      <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200">
                        +{camp.poin_interaksi} Poin Lead
                      </span>
                    </div>

                    <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-emerald-600" />
                        Link WhatsApp / CTA Target:
                      </span>
                      <p className="font-mono text-[11px] text-slate-700 truncate">
                        {camp.cta_url_template || 'https://bsi.ac.id'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/70 flex items-center justify-between gap-2">
                  <a
                    href={camp.cta_url_template || 'https://bsi.ac.id'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
                  >
                    Tes Link CTA
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(camp)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-sm transition active:scale-95"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-brand-blue" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(camp)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Create / Edit Campaign Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingId ? 'Edit Campaign Marcomm UBSI' : 'Buat Campaign Marcomm UBSI Baru'}
          description="Atur konten promosi beasiswa yang tampil otomatis saat siswa selesai mengonfirmasi MBG."
          size="md"
        >
          <form onSubmit={handleSaveCampaign} className="space-y-4">
            <ModalInput
              label="Judul Promo / Beasiswa"
              required
              value={formData.judul_promo}
              onChange={(e) => setFormData({ ...formData, judul_promo: e.target.value })}
              placeholder="Contoh: Beasiswa Talenta Digital UBSI 100%"
              leftIcon={<Megaphone className="w-5 h-5" />}
            />

            <ModalInput
              label="URL Gambar Banner"
              value={formData.banner_image_url}
              onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              leftIcon={<ImageIcon className="w-5 h-5" />}
              helperText="Opsional: masukkan link gambar banner promosi ukuran landscape."
            />

            <ModalInput
              label="Link WhatsApp / Landing Page PMB"
              required
              value={formData.cta_url_template}
              onChange={(e) => setFormData({ ...formData, cta_url_template: e.target.value })}
              placeholder="https://wa.me/6281299998888?text=Halo%20PMB%20UBSI..."
              leftIcon={<MessageCircle className="w-5 h-5" />}
            />

            <ModalInput
              label="Rekomendasi Fakultas / Prodi UBSI"
              required
              value={formData.rekomendasi_fakultas_ubsi}
              onChange={(e) =>
                setFormData({ ...formData, rekomendasi_fakultas_ubsi: e.target.value })
              }
              placeholder="Contoh: Fakultas Teknik & Informatika (FTI)"
              leftIcon={<GraduationCap className="w-5 h-5" />}
            />

            <div className="grid grid-cols-2 gap-3">
              <ModalSelect
                label="Target Tingkat Kelas"
                value={formData.target_tingkat}
                onChange={(e) => setFormData({ ...formData, target_tingkat: e.target.value })}
                options={[
                  { value: 'XII', label: 'Kelas XII (Prioritas PMB)' },
                  { value: 'XI', label: 'Kelas XI' },
                  { value: 'X', label: 'Kelas X' },
                ]}
              />

              <ModalInput
                label="Poin Lead Scoring"
                type="number"
                min={1}
                max={10}
                value={String(formData.poin_interaksi)}
                onChange={(e) =>
                  setFormData({ ...formData, poin_interaksi: Number(e.target.value) || 1 })
                }
              />
            </div>

            {/* Target Jurusan Multi-Select */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-800">
                Targeting Jurusan Siswa
              </label>
              <div className="flex flex-wrap gap-2">
                {JURUSAN_OPTIONS.map((jur) => {
                  const selected = formData.target_jurusan.includes(jur);
                  return (
                    <button
                      key={jur}
                      type="button"
                      onClick={() => toggleJurusanOption(jur)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95 ${
                        selected
                          ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {selected ? `✓ ${jur}` : jur}
                    </button>
                  );
                })}
              </div>
            </div>

            <ModalActions
              onCancel={() => setShowModal(false)}
              submitLabel={editingId ? 'Simpan Perubahan' : 'Terbitkan Campaign'}
              submitting={submitting}
            />
          </form>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
