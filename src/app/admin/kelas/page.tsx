'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  ShieldCheck,
  UserPlus,
  Upload,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Kelas, School, Siswa } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import {
  getClassesBySchool,
  saveClassRecord,
  deleteClassRecord,
  getSchoolById,
  SEED_SCHOOL,
  SEED_STUDENTS,
  SEED_STUDENT_PHONES,
  normalizePhone628,
  importStudentsWithAutoAccount,
} from '@/lib/services';
import {
  Modal,
  ModalInput,
  ModalSelect,
  ModalCheckbox,
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
import ClassModuleTabs from '@/components/navigation/ClassModuleTabs';

export default function ManajemenKelasPage() {
  const { user, activeSchoolId } = useAuth();
  const notify = useNotify();
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [currentSchool, setCurrentSchool] = useState<School>(SEED_SCHOOL);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);

  const [formData, setFormData] = useState({
    nama_kelas: '',
    tingkat: 'XII' as 'X' | 'XI' | 'XII',
    jurusan: 'RPL',
    total_siswa_dapodik: '30',
    status_aktif: true,
  });

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // State untuk Kelola Siswa per Kelas
  const [selectedClassForStudents, setSelectedClassForStudents] = useState<Kelas | null>(null);
  const [classStudents, setClassStudents] = useState<Siswa[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

  // Modal Tambah Manual Siswa ke Kelas
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    nama: '',
    no_hp: '',
    alergi_makanan: '',
    is_perwakilan_kelas: false,
  });
  const [savingStudent, setSavingStudent] = useState(false);

  // Modal Import Excel Siswa ke Kelas
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const [classesData, schoolData] = await Promise.all([
        getClassesBySchool(activeSchoolId),
        getSchoolById(activeSchoolId),
      ]);
      setKelasList(classesData);
      setCurrentSchool(schoolData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeSchoolId]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const resetForm = () => {
    setEditingKelas(null);
    setFormData({
      nama_kelas: '',
      tingkat: 'XII',
      jurusan: 'RPL',
      total_siswa_dapodik: '30',
      status_aktif: true,
    });
  };

  const handleOpenModal = (kelas?: Kelas) => {
    if (kelas) {
      setEditingKelas(kelas);
      setFormData({
        nama_kelas: kelas.nama_kelas,
        tingkat: (kelas.tingkat as 'X' | 'XI' | 'XII') || 'XII',
        jurusan: kelas.jurusan || 'RPL',
        total_siswa_dapodik: String(kelas.total_siswa_dapodik || 30),
        status_aktif: kelas.status_aktif ?? true,
      });
    } else {
      resetForm();
    }
    setFeedback(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_kelas.trim() || !formData.jurusan.trim()) {
      setFeedback({ type: 'error', message: 'Nama kelas dan jurusan wajib diisi.' });
      return;
    }

    setSubmitting(true);
    try {
      const saved = await saveClassRecord(
        {
          id: editingKelas?.id,
          id_sekolah: activeSchoolId,
          nama_kelas: formData.nama_kelas.trim(),
          tingkat: formData.tingkat,
          jurusan: formData.jurusan.trim().toUpperCase(),
          total_siswa_dapodik: Math.max(1, Number(formData.total_siswa_dapodik) || 30),
          status_aktif: formData.status_aktif,
        },
        activeSchoolId,
        user?.id
      );

      const successMessage = editingKelas
        ? `Data kelas "${saved.nama_kelas}" berhasil diperbarui.`
        : `Kelas baru "${saved.nama_kelas}" berhasil ditambahkan untuk ${currentSchool.nama_sekolah}.`;

      setShowModal(false);
      resetForm();
      setFeedback({ type: 'success', message: successMessage });
      notify.success('Data Kelas Tersimpan', successMessage);
      await loadClasses();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Gagal menyimpan data kelas.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (kelas: Kelas) => {
    const confirmed = await notify.confirm({
      icon: 'warning',
      title: `Hapus Kelas ${kelas.nama_kelas}?`,
      text: `Kelas "${kelas.nama_kelas}" (${kelas.jurusan}) akan dihapus dari daftar rombel sekolah ini.`,
      confirmText: 'Ya, Hapus Kelas',
      cancelText: 'Batal',
      confirmVariant: 'danger',
    });
    if (!confirmed) return;

    const updated = await deleteClassRecord(kelas.id, activeSchoolId, user?.id);
    setKelasList(updated);
    const msg = `Kelas "${kelas.nama_kelas}" berhasil dihapus.`;
    setFeedback({ type: 'success', message: msg });
    notify.info('Kelas Dihapus', msg);
  };

  // Muat Siswa untuk Kelas Terpilih
  const loadStudentsForClass = useCallback(async (targetClass: Kelas) => {
    setLoadingStudents(true);
    try {
      const mergedMap = new Map<string, Siswa>();

      // 1. Cek dari Supabase `students`
      try {
        const { data: dbStudents } = await supabase
          .from('students')
          .select('*')
          .eq('id_kelas', targetClass.id)
          .order('nama_lengkap');

        if (dbStudents && dbStudents.length > 0) {
          for (const st of dbStudents as any[]) {
            const normPhone = normalizePhone628(st.no_hp || '');
            const key = `${String(st.nama_lengkap).toLowerCase()}|${normPhone}`;
            mergedMap.set(key, {
              id: st.nisn || st.id,
              nisn: st.nisn,
              nama: st.nama_lengkap,
              nama_lengkap: st.nama_lengkap,
              id_kelas: st.id_kelas,
              kelas_id: st.id_kelas,
              no_hp: normPhone || st.no_hp,
              email: st.email || null,
              jurusan: targetClass.jurusan || st.jurusan || 'RPL',
              alergi_makanan: st.alergi_makanan || null,
              is_perwakilan_kelas: !!st.is_perwakilan_kelas,
              lead_score: st.lead_score || 0,
              lead_status: st.lead_status || 'COLD',
              status_aktif: st.status_aktif !== false,
              dibuat_pada: st.dibuat_pada || '',
              diperbarui_pada: st.diperbarui_pada || '',
            });
          }
        }
      } catch {
        // Abaikan jika offline / tabel belum ada
      }

      // 2. Cek dari LocalStorage `mbg_imported_students`
      if (typeof window !== 'undefined') {
        try {
          const rawLocal = localStorage.getItem('mbg_imported_students');
          const localImported = rawLocal ? JSON.parse(rawLocal) : [];
          for (const item of localImported) {
            if (item.id_kelas === targetClass.id || item.nama_kelas === targetClass.nama_kelas) {
              const normPhone = normalizePhone628(item.no_hp || '');
              const key = `${String(item.nama_lengkap).toLowerCase()}|${normPhone}`;
              if (!mergedMap.has(key)) {
                mergedMap.set(key, {
                  id: item.nisn || item.id,
                  nisn: item.nisn,
                  nama: item.nama_lengkap,
                  nama_lengkap: item.nama_lengkap,
                  id_kelas: targetClass.id,
                  kelas_id: targetClass.id,
                  no_hp: normPhone,
                  email: item.email || null,
                  jurusan: targetClass.jurusan || 'RPL',
                  alergi_makanan: item.alergi_makanan || null,
                  is_perwakilan_kelas: !!item.is_perwakilan_kelas,
                  lead_score: item.lead_score || 0,
                  lead_status: item.lead_status || 'COLD',
                  status_aktif: item.status_aktif !== false,
                  dibuat_pada: '',
                  diperbarui_pada: '',
                });
              }
            }
          }
        } catch {
          // ignore
        }
      }

      // 3. Cek dari SEED_STUDENTS
      for (const seed of SEED_STUDENTS) {
        if (seed.id_kelas === targetClass.id || seed.nama_kelas === targetClass.nama_kelas) {
          const phone = SEED_STUDENT_PHONES[seed.nisn] || `62812000${seed.nisn.slice(-5)}`;
          const key = `${seed.nama_lengkap.toLowerCase()}|${phone}`;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, {
              id: seed.nisn,
              nisn: seed.nisn,
              nama: seed.nama_lengkap,
              nama_lengkap: seed.nama_lengkap,
              id_kelas: targetClass.id,
              kelas_id: targetClass.id,
              no_hp: phone,
              email: null,
              jurusan: seed.jurusan || targetClass.jurusan,
              alergi_makanan: seed.alergi_makanan,
              is_perwakilan_kelas: seed.is_perwakilan_kelas,
              lead_score: 0,
              lead_status: 'COLD',
              status_aktif: true,
              dibuat_pada: '',
              diperbarui_pada: '',
            });
          }
        }
      }

      setClassStudents(Array.from(mergedMap.values()));
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const handleOpenClassStudents = async (kelas: Kelas) => {
    setSelectedClassForStudents(kelas);
    setSearchStudent('');
    await loadStudentsForClass(kelas);
  };

  // Simpan Tambah Siswa Manual
  const handleSaveSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForStudents || !studentFormData.nama.trim()) {
      notify.error('Validasi Gagal', 'Nama lengkap siswa wajib diisi.');
      return;
    }

    setSavingStudent(true);
    try {
      const normalizedPhone = studentFormData.no_hp.trim()
        ? normalizePhone628(studentFormData.no_hp.trim())
        : `62813${String(Math.floor(1000000 + Math.random() * 9000000))}`;

      const res = await importStudentsWithAutoAccount({
        rows: [
          {
            nama: studentFormData.nama.trim(),
            kelas_id: selectedClassForStudents.id,
            nama_kelas: selectedClassForStudents.nama_kelas,
            jurusan: selectedClassForStudents.jurusan,
            no_hp: normalizedPhone,
            alergi_makanan: studentFormData.alergi_makanan.trim() || null,
            is_perwakilan_kelas: studentFormData.is_perwakilan_kelas,
            status_aktif: true,
          },
        ],
        penggunaId: user?.id,
        schoolId: activeSchoolId,
        allowUpdate: true,
      });

      notify.success(
        'Siswa Berhasil Ditambahkan',
        `${studentFormData.nama} telah ditambahkan ke kelas ${selectedClassForStudents.nama_kelas}.`
      );
      setShowAddStudentModal(false);
      setStudentFormData({
        nama: '',
        no_hp: '',
        alergi_makanan: '',
        is_perwakilan_kelas: false,
      });
      await loadStudentsForClass(selectedClassForStudents);
      await loadClasses();
    } catch (err: any) {
      notify.error('Gagal Menambah Siswa', err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSavingStudent(false);
    }
  };

  // Download Template Excel Siswa Khusus Kelas Ini
  const handleDownloadClassTemplate = () => {
    if (!selectedClassForStudents) return;
    const templateData = [
      {
        'Nama Lengkap': 'Ahmad Fauzi',
        'No WhatsApp': '6281234567890',
        'Alergi Makanan': 'Alergi Udang / Seafood (Bila ada)',
      },
      {
        'Nama Lengkap': 'Citra Dewi Permata',
        'No WhatsApp': '6281234567891',
        'Alergi Makanan': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa ' + selectedClassForStudents.nama_kelas);
    XLSX.writeFile(
      workbook,
      `Template_Import_${selectedClassForStudents.nama_kelas.replace(/\s+/g, '_')}.xlsx`
    );
    notify.info('Template Diunduh', `Template Excel untuk ${selectedClassForStudents.nama_kelas} siap diisi.`);
  };

  // Upload & Baca File Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setImportPreview(data);
      } catch {
        setImportMessage('Gagal membaca file Excel / CSV.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Eksekusi Import Excel ke Kelas Terpilih
  const handleExecuteImportToClass = async () => {
    if (!selectedClassForStudents || importPreview.length === 0) return;
    setImporting(true);
    setImportMessage('');

    try {
      const mappedRows = importPreview.map((row) => {
        const nama = row['Nama Lengkap'] || row['nama'] || row['Nama'] || '';
        const noHp = row['No WhatsApp'] || row['no_hp'] || row['WhatsApp'] || row['HP'] || '';
        const alergi = row['Alergi Makanan'] || row['alergi'] || '';

        return {
          nama: String(nama).trim(),
          kelas_id: selectedClassForStudents.id,
          nama_kelas: selectedClassForStudents.nama_kelas,
          jurusan: selectedClassForStudents.jurusan,
          no_hp: noHp ? String(noHp).trim() : null,
          alergi_makanan: alergi ? String(alergi).trim() : null,
          status_aktif: true,
        };
      });

      const res = await importStudentsWithAutoAccount({
        rows: mappedRows,
        penggunaId: user?.id,
        schoolId: activeSchoolId,
        allowUpdate: true,
      });

      notify.success(
        'Import Berhasil',
        `${res.insertedCount} siswa berhasil ditambahkan ke kelas ${selectedClassForStudents.nama_kelas}.`
      );
      setShowImportModal(false);
      setImportPreview([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadStudentsForClass(selectedClassForStudents);
      await loadClasses();
    } catch (err: any) {
      setImportMessage(err?.message || 'Gagal memproses import data.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <ProtectedRoute
      allowedRoles={['super_admin', 'admin', 'guru_piket', 'kepala_sekolah', 'guru']}
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        <PageHeader
          title="Manajemen Kelas & Jurusan (Multi-Tenant)"
          subtitle={`${currentSchool.nama_sekolah} • NPSN: ${currentSchool.npsn} • ID Sekolah otomatis terikat dari profil petugas.`}
          badgeText="MASTER DATA KELAS"
        >
          <Button
            type="button"
            onClick={() => handleOpenModal()}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Tambah Kelas Baru
          </Button>
        </PageHeader>

        {/* Master Data & Operasional Module Tabs */}
        <ClassModuleTabs />

        {feedback && (
          <FeedbackBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        {/* Table Kelas */}
        <div className="micro-card rounded-2xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-brand-blue" />
              Sekolah Aktif: {currentSchool.nama_sekolah}
            </span>
            <span>Total Rombel: {kelasList.length} Kelas</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat daftar kelas...
            </div>
          ) : kelasList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Belum ada data kelas yang terdaftar untuk sekolah ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Kelas</th>
                    <th className="py-3 px-4">Tingkat</th>
                    <th className="py-3 px-4">Jurusan</th>
                    <th className="py-3 px-4">Kuota Dapodik</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kelasList.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                        {k.nama_kelas}
                      </td>
                      <td className="py-3.5 px-4 text-sm font-semibold text-slate-700">
                        Kelas {k.tingkat}
                      </td>
                      <td className="py-3.5 px-4 text-sm">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-brand-blue border border-blue-200">
                          {k.jurusan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-sm font-mono text-brand-navy font-bold">
                        {k.total_siswa_dapodik || 30} Siswa
                      </td>
                      <td className="py-3.5 px-4 text-sm">
                        {k.status_aktif !== false ? (
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
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenClassStudents(k)}
                            className="micro-tap inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-brand-blue bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                            title="Kelola Siswa di Kelas Ini"
                            aria-label={`Kelola siswa kelas ${k.nama_kelas}`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Siswa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenModal(k)}
                            className="micro-tap p-2 text-slate-600 hover:text-brand-blue rounded-lg hover:bg-slate-100 transition"
                            title="Edit Kelas"
                            aria-label={`Edit kelas ${k.nama_kelas}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(k)}
                            className="micro-tap p-2 text-slate-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                            title="Hapus Kelas"
                            aria-label={`Hapus kelas ${k.nama_kelas}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
          description={`Otomatis terikat ke sekolah: ${currentSchool.nama_sekolah}`}
          size="md"
        >
          <form onSubmit={handleSave} className="space-y-4">
            {feedback && feedback.type === 'error' && (
              <Alert variant="error" message={feedback.message} />
            )}

            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs text-brand-navy flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-blue shrink-0" />
              <span>
                Sekolah Tujuan: <strong>{currentSchool.nama_sekolah}</strong> (NPSN:{' '}
                {currentSchool.npsn})
              </span>
            </div>

            <ModalInput
              label="Nama Kelas"
              required
              value={formData.nama_kelas}
              onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
              placeholder="Contoh: XII RPL 1"
              leftIcon={<Users className="w-5 h-5" />}
              autoComplete="off"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModalSelect
                label="Tingkat Jenjang"
                required
                value={formData.tingkat}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tingkat: e.target.value as 'X' | 'XI' | 'XII',
                  })
                }
                options={[
                  { value: 'X', label: 'Kelas X' },
                  { value: 'XI', label: 'Kelas XI' },
                  { value: 'XII', label: 'Kelas XII' },
                ]}
              />

              <ModalSelect
                label="Kode Jurusan"
                required
                value={formData.jurusan}
                onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                options={[
                  { value: 'RPL', label: 'RPL (Rekayasa Perangkat Lunak)' },
                  { value: 'TKJ', label: 'TKJ (Teknik Komputer & Jaringan)' },
                  { value: 'IPA', label: 'IPA (MIPA / Sains)' },
                  { value: 'IPS', label: 'IPS (Sosial)' },
                  { value: 'AKUNTANSI', label: 'AKUNTANSI (Keuangan)' },
                  { value: 'UMUM', label: 'UMUM / Lainnya' },
                ]}
              />
            </div>

            <ModalInput
              label="Total Kuota Siswa (Dapodik)"
              type="number"
              min={1}
              max={60}
              required
              value={formData.total_siswa_dapodik}
              onChange={(e) =>
                setFormData({ ...formData, total_siswa_dapodik: e.target.value })
              }
              placeholder="30"
              leftIcon={<Building2 className="w-5 h-5" />}
              inputMode="numeric"
            />

            <ModalCheckbox
              label="Status Kelas Aktif Menerima MBG"
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

        {/* MODAL 1: DAFTAR & KELOLA SISWA DI KELAS TERPILIH */}
        <Modal
          isOpen={!!selectedClassForStudents && !showAddStudentModal && !showImportModal}
          onClose={() => setSelectedClassForStudents(null)}
          title={`Daftar Siswa • ${selectedClassForStudents?.nama_kelas || ''}`}
          description={`Rombel ${selectedClassForStudents?.jurusan} • Sekolah: ${currentSchool.nama_sekolah}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari siswa di kelas ini..."
                  value={searchStudent}
                  onChange={(e) => setSearchStudent(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowImportModal(true)}
                  leftIcon={<Upload className="w-3.5 h-3.5 text-emerald-600" />}
                >
                  Import Excel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setStudentFormData({
                      nama: '',
                      no_hp: '',
                      alergi_makanan: '',
                      is_perwakilan_kelas: false,
                    });
                    setShowAddStudentModal(true);
                  }}
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Tambah Siswa
                </Button>
              </div>
            </div>

            {/* List Siswa */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
              {loadingStudents ? (
                <div className="p-8 text-center text-slate-500 text-xs font-bold">
                  <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Memuat data siswa kelas {selectedClassForStudents?.nama_kelas}...
                </div>
              ) : classStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Belum ada siswa terdaftar di kelas {selectedClassForStudents?.nama_kelas}.
                  <br />
                  Klik tombol <strong>&quot;Tambah Siswa&quot;</strong> atau <strong>&quot;Import Excel&quot;</strong> untuk menambahkan data siswa.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">No</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">WhatsApp (Login)</th>
                      <th className="py-2.5 px-3">Alergi Makanan</th>
                      <th className="py-2.5 px-3">Peran MBG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classStudents
                      .filter((s) =>
                        s.nama.toLowerCase().includes(searchStudent.toLowerCase()) ||
                        (s.no_hp && s.no_hp.includes(searchStudent))
                      )
                      .map((s, idx) => (
                        <tr key={s.id || idx} className="hover:bg-slate-50/70 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{s.nama}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 font-bold">
                            {s.no_hp || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            {s.alergi_makanan ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                {s.alergi_makanan}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {s.is_perwakilan_kelas ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                <CheckCircle2 className="w-3 h-3 text-purple-600" />
                                Perwakilan Kelas
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Siswa</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>
                Total Terdaftar: <strong>{classStudents.length} Siswa</strong> (Kuota Dapodik:{' '}
                {selectedClassForStudents?.total_siswa_dapodik || 30})
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSelectedClassForStudents(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </Modal>

        {/* MODAL 2: TAMBAH SISWA MANUAL KE KELAS */}
        <Modal
          isOpen={showAddStudentModal}
          onClose={() => setShowAddStudentModal(false)}
          title={`Tambah Siswa • ${selectedClassForStudents?.nama_kelas || ''}`}
          description="Siswa baru akan langsung terdaftar di kelas ini dan akun WhatsApp aktif otomatis."
          size="sm"
        >
          <form onSubmit={handleSaveSingleStudent} className="space-y-4">
            <ModalInput
              label="Nama Lengkap Siswa"
              required
              value={studentFormData.nama}
              onChange={(e) =>
                setStudentFormData({ ...studentFormData, nama: e.target.value })
              }
              placeholder="Contoh: Muhammad Rizki"
              autoComplete="off"
            />

            <ModalInput
              label="Nomor WhatsApp (Format 628xxx)"
              value={studentFormData.no_hp}
              onChange={(e) =>
                setStudentFormData({ ...studentFormData, no_hp: e.target.value })
              }
              placeholder="Contoh: 6281234567890 (Opsional, acak bila kosong)"
              inputMode="tel"
            />

            <ModalInput
              label="Alergi Makanan (Opsional)"
              value={studentFormData.alergi_makanan}
              onChange={(e) =>
                setStudentFormData({
                  ...studentFormData,
                  alergi_makanan: e.target.value,
                })
              }
              placeholder="Contoh: Alergi Seafood / Telur"
            />

            <ModalCheckbox
              label="Tandai sebagai Perwakilan Kelas (Bisa Scan Kolektif)"
              checked={studentFormData.is_perwakilan_kelas}
              onChange={(checked) =>
                setStudentFormData({
                  ...studentFormData,
                  is_perwakilan_kelas: checked,
                })
              }
            />

            <ModalActions
              onCancel={() => setShowAddStudentModal(false)}
              submitLabel="Simpan Siswa"
              submitting={savingStudent}
            />
          </form>
        </Modal>

        {/* MODAL 3: IMPORT EXCEL SISWA KE KELAS */}
        <Modal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setImportPreview([]);
            setImportMessage('');
          }}
          title={`Import Excel Siswa • ${selectedClassForStudents?.nama_kelas || ''}`}
          description={`Upload file excel (.xlsx/.csv) khusus untuk kelas ${selectedClassForStudents?.nama_kelas}`}
          size="md"
        >
          <div className="space-y-4">
            {importMessage && <Alert variant="error" message={importMessage} />}

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-bold text-brand-navy">Gunakan Format Template</p>
                <p className="text-slate-600 mt-0.5">
                  Kolom utama: <strong>Nama Lengkap</strong>, <strong>No WhatsApp</strong>, dan <strong>Alergi Makanan</strong>.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleDownloadClassTemplate}
                leftIcon={<Download className="w-3.5 h-3.5 text-brand-blue" />}
              >
                Unduh Format (.xlsx)
              </Button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 hover:bg-slate-50 transition">
              <FileSpreadsheet className="w-8 h-8 text-brand-blue mx-auto" />
              <p className="text-xs font-bold text-slate-800">
                Pilih file Excel (.xlsx / .csv) daftar siswa kelas ini
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="text-xs text-slate-500 mx-auto block cursor-pointer"
              />
            </div>

            {importPreview.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Pratinjau: {importPreview.length} Siswa Terdeteksi</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Siap di-import ke {selectedClassForStudents?.nama_kelas}
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1 text-xs">
                  {importPreview.slice(0, 5).map((row, i) => (
                    <div key={i} className="text-slate-700 font-semibold">
                      {i + 1}. {row['Nama Lengkap'] || row['nama'] || row['Nama']}{' '}
                      <span className="text-slate-400 font-normal">
                        ({row['No WhatsApp'] || row['no_hp'] || 'Auto HP'})
                      </span>
                    </div>
                  ))}
                  {importPreview.length > 5 && (
                    <div className="text-[11px] text-slate-500 italic pt-1">
                      ... dan {importPreview.length - 5} siswa lainnya
                    </div>
                  )}
                </div>
              </div>
            )}

            <ModalActions
              onCancel={() => {
                setShowImportModal(false);
                setImportPreview([]);
                setImportMessage('');
              }}
              onSubmit={handleExecuteImportToClass}
              submitType="button"
              submitDisabled={importPreview.length === 0}
              submitLabel={`Import ${importPreview.length} Siswa ke ${selectedClassForStudents?.nama_kelas || 'Kelas'}`}
              submitting={importing}
            />
          </div>
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
