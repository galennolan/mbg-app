'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  RotateCw,
  Database,
  GraduationCap,
  Image as ImageIcon,
  MessageCircle,
  Target,
  Power,
  Check,
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
import { Modal, ModalInput, ModalSelect, ModalActions } from '@/components/ui/ModalField';
import { PageHeader, Button, FeedbackBanner, useNotify } from '@/components/ui';

const JURUSAN_OPTIONS = ['RPL', 'TKJ', 'IPA', 'IPS', 'AKUNTANSI', 'UMUM'];

export default function CampaignManagerPage() {
  const { user } = useAuth();
  const notify = useNotify();
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
      const msg = editingId
        ? 'Campaign Marcomm UBSI berhasil diperbarui!'
        : 'Campaign baru berhasil ditambahkan & aktif!';
      setShowModal(false);
      await loadCampaigns();
      setFeedback({ type: 'success', message: msg });
      notify.success('Campaign Tersimpan', msg);
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
    const msg = `Iklan "${camp.judul_promo}" telah ${
      nextStatus ? 'DIAKTIFKAN (Tampil di HP Siswa)' : 'DINONAKTIFKAN (Disembunyikan dari HP Siswa)'
    }.`;
    setFeedback({ type: 'success', message: msg });
    notify.info(nextStatus ? 'Campaign Diaktifkan' : 'Campaign Dinonaktifkan', msg);
  };

  const handleDelete = async (camp: CrmCampaign) => {
    const confirmed = await notify.confirm({
      icon: 'warning',
      title: 'Hapus Campaign Ini?',
      text: `Apakah Anda yakin ingin menghapus campaign "${camp.judul_promo}" secara permanen?`,
      confirmText: 'Ya, Hapus Campaign',
      cancelText: 'Batal',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    const updated = await deleteCrmCampaign(camp.id, user?.id);
    setCampaigns(updated);
    const msg = `Campaign "${camp.judul_promo}" telah dihapus.`;
    setFeedback({ type: 'success', message: msg });
    notify.success('Campaign Dihapus', msg);
  };

  const handleSyncMasterDapodik = async () => {
    setSyncingDapodik(true);
    setFeedback(null);
    try {
      const res = await syncMasterDataDapodik(user?.id);
      const msg = `Sync Master Data Dapodik Selesai: ${res.totalKelas} Kelas & ${res.totalSiswa} Akun Siswa (Format 628xxx) telah disinkronkan.`;
      setFeedback({ type: 'success', message: msg });
      notify.fire({
        icon: 'success',
        title: 'Sinkronisasi Dapodik Selesai',
        text: msg,
        badgeText: 'SYNC DAPODIK',
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
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSyncMasterDapodik}
              loading={syncingDapodik}
              leftIcon={<Database className="w-3.5 h-3.5 text-amber-700" />}
            >
              {syncingDapodik ? 'Menarik Data Dapodik...' : 'Sync Master Data'}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Buat Campaign Baru
            </Button>
          </div>
        </PageHeader>

        {feedback && (
          <FeedbackBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        {/* Master Data & Campaign Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="micro-card rounded-2xl p-5 flex items-center justify-between">
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

          <div className="micro-card rounded-2xl p-5 flex items-center justify-between">
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

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                Master Data Pulling Tool
              </span>
              <Database className="w-4 h-4 text-amber-700" />
            </div>
            <p className="text-xs text-amber-900 my-2">
              Tarik pembaruan data siswa & kelas Dapodik terbaru beserta auto-generate akun login 628xxx.
            </p>
            <Button
              type="button"
              size="sm"
              onClick={handleSyncMasterDapodik}
              loading={syncingDapodik}
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
              fullWidth
              className="bg-amber-600 hover:bg-amber-700"
            >
              {syncingDapodik ? 'Menyinkronkan...' : 'Tarik Data Dapodik Sekarang'}
            </Button>
          </div>
        </div>

        {/* Campaign List Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {campaigns.map((camp) => {
            const isActive = camp.status_aktif !== false;
            return (
              <div
                key={camp.id}
                className={`rounded-2xl border overflow-hidden shadow-card transition-all duration-200 flex flex-col justify-between ${
                  isActive
                    ? 'bg-white border-slate-200'
                    : 'bg-slate-50 border-slate-200 opacity-80'
                }`}
              >
                <div>
                  {/* Banner Preview Header */}
                  <div className="relative h-44 bg-brand-navy overflow-hidden">
                    {camp.banner_image_url ? (
                      <img
                        src={camp.banner_image_url}
                        alt={camp.judul_promo}
                        className="w-full h-full object-cover opacity-80"
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
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-white' : 'bg-slate-400'
                          }`}
                        />
                        {isActive ? 'AKTIF TAYANG' : 'NONAKTIF (OFF)'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(camp)}
                        role="switch"
                        aria-checked={isActive}
                        className={`micro-tap inline-flex items-center gap-2 min-h-[36px] px-3 py-1.5 rounded-full text-xs font-bold shadow-sm transition ${
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

                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
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
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
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
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenEdit(camp)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5 text-brand-blue" />}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(camp)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Hapus
                    </Button>
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
                      className={`micro-tap min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 ${
                        selected
                          ? 'bg-brand-blue text-white border-brand-blue shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3" />}
                      {jur}
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
