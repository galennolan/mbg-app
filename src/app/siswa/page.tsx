'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  GraduationCap,
  Search,
  Plus,
  Upload,
  Download,
  Edit2,
  Database,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';
import { Kelas, Siswa } from '@/lib/types';
import {
  importStudentsWithAutoAccount,
  importDapodikStudents,
  normalizePhone628,
  isValidPhone628,
  SEED_CLASSES,
  SEED_STUDENTS,
  SEED_STUDENT_PHONES,
} from '@/lib/services';
import {
  parseDapodikWorkbook,
  normalizeSchoolName,
  type DapodikParseResult,
} from '@/lib/dapodik-import';
import {
  Modal,
  ModalInput,
  ModalSelect,
  ModalCheckbox,
  ModalActions,
} from '@/components/ui/ModalField';
import {
  PageHeader,
  Input,
  Select,
  Pagination,
  Button,
  FeedbackBanner,
  Alert,
  useNotify,
} from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import ClassModuleTabs from '@/components/navigation/ClassModuleTabs';

export default function DataSiswaPage() {
  const { user, role, activeSchoolId, setActiveSchoolId } = useAuth();
  const notify = useNotify();
  const canManageStudents =
    role === 'guru_piket' ||
    role === 'super_admin' ||
    role === 'admin' ||
    role === 'guru' ||
    role === 'kepala_sekolah';
  const isAdmin = role === 'super_admin' || role === 'admin';

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  // Search, Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(20);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Siswa | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nama: '',
    nisn: '',
    kelas_id: '',
    email: '',
    no_hp: '',
    alergi_makanan: '',
    is_perwakilan_kelas: false,
    status_aktif: true,
  });

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importMessage, setImportMessage] = useState('');
  const [dapodikPreview, setDapodikPreview] = useState<DapodikParseResult | null>(null);
  const [importSchoolName, setImportSchoolName] = useState('');
  const [importProgress, setImportProgress] = useState<{
    done: number;
    total: number;
    stage: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const resetStudentForm = () => {
    setEditingStudent(null);
    setFormData({
      nama: '',
      nisn: '',
      kelas_id: kelasList[0]?.id || '',
      email: '',
      no_hp: '',
      alergi_makanan: '',
      is_perwakilan_kelas: false,
      status_aktif: true,
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let resolvedClasses: Kelas[] = [];
      try {
        const { data: v12Classes } = await supabase
          .from('classes')
          .select('*')
          .eq('id_sekolah', activeSchoolId)
          .order('nama_kelas');
        if (v12Classes && v12Classes.length > 0) {
          resolvedClasses = v12Classes as Kelas[];
        }
      } catch {
        // fallback
      }

      if (resolvedClasses.length === 0) {
        resolvedClasses = (SEED_CLASSES as any[]).filter(
          (c) => c.id_sekolah === activeSchoolId
        ) as Kelas[];
        if (resolvedClasses.length === 0) {
          resolvedClasses = SEED_CLASSES as Kelas[];
        }
      }
      setKelasList(resolvedClasses);

      const classById = new Map(resolvedClasses.map((c) => [c.id, c]));
      const schoolClassIds = new Set(resolvedClasses.map((c) => c.id));
      const mergedMap = new Map<string, Siswa>();

      // 1. Load from v1.2 `students` table
      try {
        const { data: v12Students } = await supabase
          .from('students')
          .select('*')
          .in('id_kelas', Array.from(schoolClassIds))
          .order('nama_lengkap');
        if (v12Students && v12Students.length > 0) {
          for (const st of v12Students as any[]) {
            const cls = classById.get(st.id_kelas);
            const normPhone = normalizePhone628(st.no_hp || '');
            const key = `${String(st.nama_lengkap).toLowerCase()}|${normPhone || st.nisn}`;
            mergedMap.set(key, {
              id: st.nisn,
              nisn: st.nisn,
              nama: st.nama_lengkap,
              nama_lengkap: st.nama_lengkap,
              id_kelas: st.id_kelas,
              kelas_id: st.id_kelas,
              no_hp: normPhone || st.no_hp,
              email: st.email || null,
              jurusan: cls?.jurusan || st.jurusan || 'RPL',
              alergi_makanan: st.alergi_makanan || null,
              is_perwakilan_kelas: !!st.is_perwakilan_kelas,
              lead_score: st.lead_score || 0,
              lead_status: st.lead_status || 'COLD',
              status_aktif: st.status_aktif !== false,
              dibuat_pada: st.dibuat_pada || '',
              diperbarui_pada: st.diperbarui_pada || '',
              kelas: cls,
            });
          }
        }
      } catch {
        // ignore
      }

      // 2. Merge from localStorage `mbg_imported_students`
      if (typeof window !== 'undefined') {
        try {
          const rawLocal = localStorage.getItem('mbg_imported_students');
          const localImported = rawLocal ? JSON.parse(rawLocal) : [];
          for (const item of localImported) {
            if (schoolClassIds.has(item.id_kelas) || !item.id_kelas) {
              const cls = classById.get(item.id_kelas) || resolvedClasses[0];
              const normPhone = normalizePhone628(item.no_hp || '');
              const key = `${String(item.nama_lengkap).toLowerCase()}|${normPhone}`;
              if (!mergedMap.has(key)) {
                mergedMap.set(key, {
                  id: item.nisn,
                  nisn: item.nisn,
                  nama: item.nama_lengkap,
                  nama_lengkap: item.nama_lengkap,
                  id_kelas: item.id_kelas || cls?.id,
                  kelas_id: item.id_kelas || cls?.id,
                  no_hp: normPhone,
                  email: item.email || null,
                  jurusan: item.jurusan || cls?.jurusan || 'RPL',
                  alergi_makanan: item.alergi_makanan || null,
                  is_perwakilan_kelas: !!item.is_perwakilan_kelas,
                  lead_score: item.lead_score || 0,
                  lead_status: item.lead_status || 'COLD',
                  status_aktif: item.status_aktif !== false,
                  dibuat_pada: '',
                  diperbarui_pada: '',
                  kelas: cls,
                });
              }
            }
          }
        } catch {
          // ignore
        }
      }

      // 3. Fallback to SEED_STUDENTS for this school
      for (const seed of SEED_STUDENTS) {
        if (schoolClassIds.has(seed.id_kelas)) {
          const cls = classById.get(seed.id_kelas) || resolvedClasses[0];
          const phone = SEED_STUDENT_PHONES[seed.nisn] || `62812000${seed.nisn.slice(-5)}`;
          const key = `${seed.nama_lengkap.toLowerCase()}|${phone}`;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, {
              id: seed.nisn,
              nisn: seed.nisn,
              nama: seed.nama_lengkap,
              nama_lengkap: seed.nama_lengkap,
              id_kelas: seed.id_kelas,
              kelas_id: seed.id_kelas,
              no_hp: phone,
              email: null,
              jurusan: seed.jurusan,
              alergi_makanan: seed.alergi_makanan,
              is_perwakilan_kelas: seed.is_perwakilan_kelas,
              lead_score: 0,
              lead_status: 'COLD',
              status_aktif: true,
              dibuat_pada: '',
              diperbarui_pada: '',
              kelas: cls,
            });
          }
        }
      }

      setStudents(Array.from(mergedMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSchoolId]);

  // Save (Create or Update) Student with Auto-Account Generation (628xxx) & Deduplication
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.kelas_id) {
      setFeedback({ type: 'error', message: 'Nama dan kelas wajib diisi' });
      return;
    }

    // No. HP opsional: dibiarkan kosong bila tidak diisi (siswa tetap bisa menerima MBG
    // lewat klaim perwakilan kelas tanpa login).
    const rawPhone = formData.no_hp.trim();
    const normalizedPhone = rawPhone ? normalizePhone628(rawPhone) : '';
    if (normalizedPhone && !isValidPhone628(normalizedPhone)) {
      setFeedback({
        type: 'error',
        message: 'Format No. HP tidak valid. Gunakan 08xxxxxxxxxx atau 628xxxxxxxxxx, atau kosongkan.',
      });
      return;
    }

    const cleanNisn = formData.nisn ? formData.nisn.trim() : '';

    // Cek duplikasi NISN di satu sekolah jika sedang tambah data baru
    if (cleanNisn && !editingStudent) {
      const duplicateNisn = students.find((s) => s.nisn === cleanNisn);
      if (duplicateNisn) {
        setFeedback({
          type: 'error',
          message: `Duplikasi NISN: Siswa dengan NISN "${cleanNisn}" sudah terdaftar (${duplicateNisn.nama}).`,
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const targetCls = kelasList.find((k) => k.id === formData.kelas_id);
      const res = await importStudentsWithAutoAccount({
        rows: [
          {
            nama: formData.nama.trim(),
            nisn: cleanNisn || editingStudent?.nisn || null,
            kelas_id: formData.kelas_id,
            nama_kelas: targetCls?.nama_kelas,
            jurusan: targetCls?.jurusan,
            email: formData.email ? formData.email.trim() : null,
            no_hp: normalizedPhone,
            alergi_makanan: formData.alergi_makanan.trim() || null,
            is_perwakilan_kelas: formData.is_perwakilan_kelas,
            status_aktif: formData.status_aktif,
          },
        ],
        penggunaId: user?.id,
        schoolId: activeSchoolId,
        allowUpdate: !!editingStudent,
      });

      const msg = editingStudent
        ? normalizedPhone
          ? `Data siswa & kunci login (${normalizedPhone}) berhasil diperbarui!`
          : 'Data siswa berhasil diperbarui!'
        : res.message;

      setShowAddModal(false);
      resetStudentForm();
      setFeedback({ type: 'success', message: msg });
      notify.success('Data Siswa Tersimpan', msg);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan siswa' });
    } finally {
      setSubmitting(false);
    }
  };

  // Seed sample data if table is completely empty
  const handleSeedDemoData = async () => {
    setLoading(true);
    try {
      let currentKelas = [...kelasList];
      if (currentKelas.length === 0) {
        const defaultClasses = [
          { nama_kelas: 'X RPL 1', tingkat: 'X', jurusan: 'Rekayasa Perangkat Lunak' },
          { nama_kelas: 'X RPL 2', tingkat: 'X', jurusan: 'Rekayasa Perangkat Lunak' },
          { nama_kelas: 'XI TKJ 1', tingkat: 'XI', jurusan: 'Teknik Komputer & Jaringan' },
          { nama_kelas: 'XI TKJ 2', tingkat: 'XI', jurusan: 'Teknik Komputer & Jaringan' },
          { nama_kelas: 'XII DKV 1', tingkat: 'XII', jurusan: 'Desain Komunikasi Visual' },
        ];
        const { data: createdClasses } = await supabase
          .from('kelas')
          .insert(defaultClasses)
          .select();
        if (createdClasses) {
          currentKelas = createdClasses as Kelas[];
          setKelasList(currentKelas);
        }
      }

      const kelasA = currentKelas[0]?.id;
      const kelasB = currentKelas[1]?.id || kelasA;

      const demoStudents = [
        { nama: 'Ahmad Fauzi', nisn: '0061234567', kelas_id: kelasA, status_aktif: true },
        { nama: 'Ahmad Fauzan', nisn: '0061234568', kelas_id: kelasB, status_aktif: true },
        { nama: 'Budi Santoso', nisn: '0061234569', kelas_id: kelasA, status_aktif: true },
        { nama: 'Citra Dewi Permata', nisn: '0061234570', kelas_id: kelasA, status_aktif: true },
        { nama: 'Dimas Prasetyo', nisn: '0061234571', kelas_id: kelasB, status_aktif: true },
        { nama: 'Eka Nurhayati', nisn: '0061234572', kelas_id: kelasA, status_aktif: true },
        { nama: 'Farhan Maulana', nisn: '0061234573', kelas_id: kelasB, status_aktif: true },
        { nama: 'Gita Rahmawati', nisn: '0061234574', kelas_id: kelasA, status_aktif: true },
        { nama: 'Hendra Gunawan', nisn: '0061234575', kelas_id: kelasB, status_aktif: true },
        { nama: 'Indah Lestari', nisn: '0061234576', kelas_id: kelasA, status_aktif: true },
      ];

      const { error } = await supabase.from('siswa').insert(demoStudents);
      if (error) throw error;

      setFeedback({ type: 'success', message: '10 Data contoh siswa & kelas berhasil di-generate!' });
      notify.success('Data Contoh Dibuat', '10 Data contoh siswa & kelas berhasil ditambahkan.');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal generate demo data' });
    } finally {
      setLoading(false);
    }
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Lengkap': 'Ahmad Fauzi',
        NISN: '0061234567',
        'Nama Kelas': kelasList[0]?.nama_kelas || 'X RPL 1',
        Email: 'fauzi@example.com',
        'No HP': '081234567890',
      },
      {
        'Nama Lengkap': 'Budi Pratama',
        NISN: '0061234568',
        'Nama Kelas': kelasList[0]?.nama_kelas || 'X RPL 1',
        Email: '',
        'No HP': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');
    XLSX.writeFile(workbook, 'Template_Import_Siswa_MBG.xlsx');
    notify.info('Template Diunduh', 'File Template_Import_Siswa_MBG.xlsx berhasil diunduh.');
  };

  // Handle File Upload & Parse Excel / CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportMessage('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Format export Dapodik (sheet "Daftar Siswa") terdeteksi otomatis
        const dapodik = parseDapodikWorkbook(wb);
        if (dapodik) {
          if (!isAdmin) {
            setDapodikPreview(null);
            setImportPreview([]);
            setImportMessage('Import massal format Dapodik hanya dapat dilakukan oleh Super Admin.');
            return;
          }
          setDapodikPreview(dapodik);
          setImportSchoolName(normalizeSchoolName(dapodik.schoolNameRaw));
          setImportPreview([]);
          return;
        }

        setDapodikPreview(null);
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setImportPreview(data);
      } catch (err) {
        setImportMessage('Gagal membaca file excel/csv');
      }
    };
    reader.readAsBinaryString(file);
  };

  const resetImportState = () => {
    setImportPreview([]);
    setImportMessage('');
    setDapodikPreview(null);
    setImportSchoolName('');
    setImportProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Import massal format Dapodik ke Supabase
  const handleExecuteDapodikImport = async () => {
    if (!dapodikPreview) return;
    if (!dapodikPreview.npsn) {
      setImportMessage('NPSN tidak ditemukan di file. Pastikan sheet "Catatan" atau judul sheet memuat NPSN.');
      return;
    }
    setImporting(true);
    setImportMessage('');
    setImportProgress({ done: 0, total: dapodikPreview.rows.length * 2, stage: 'Memulai import' });

    try {
      const res = await importDapodikStudents({
        npsn: dapodikPreview.npsn,
        schoolName: importSchoolName,
        rows: dapodikPreview.rows,
        penggunaId: user?.id,
        onProgress: (done, total, stage) => setImportProgress({ done, total, stage }),
      });

      setFeedback({ type: 'success', message: res.message });
      notify.fire({
        icon: 'success',
        title: 'Import Data Siswa Berhasil',
        text: res.message,
        badgeText: `${res.classesCount} KELAS`,
      });
      resetImportState();
      setShowImportModal(false);
      if (res.schoolId !== activeSchoolId) {
        setActiveSchoolId(res.schoolId);
      } else {
        loadData();
      }
    } catch (err: any) {
      setImportMessage(err.message || 'Gagal mengimpor data Dapodik.');
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  // Process Import Data with Auto-Account Generation (Tahap 5 RBAC)
  const handleExecuteImport = async () => {
    if (dapodikPreview) {
      await handleExecuteDapodikImport();
      return;
    }
    if (importPreview.length === 0) return;
    setImporting(true);
    setImportMessage('');

    try {
      const classMap = new Map(kelasList.map((k) => [k.nama_kelas.toLowerCase().trim(), k]));
      const mappedRows = importPreview.map((row) => {
        const nama = row['Nama Lengkap'] || row['nama'] || row['Nama'] || '';
        const namaKelas = row['Nama Kelas'] || row['kelas'] || row['Kelas'] || '';
        const nisn = row['NISN'] || row['nisn'] || null;
        const email = row['Email'] || row['email'] || null;
        const noHp = row['No HP'] || row['no_hp'] || row['WhatsApp'] || '';
        const matchedCls =
          (namaKelas ? classMap.get(String(namaKelas).toLowerCase().trim()) : null) ||
          kelasList[0];

        return {
          nama: String(nama).trim(),
          nisn: nisn ? String(nisn).trim() : null,
          kelas_id: matchedCls?.id || SEED_CLASSES[0].id,
          nama_kelas: matchedCls?.nama_kelas || 'XII RPL 1',
          jurusan: matchedCls?.jurusan || 'RPL',
          email: email ? String(email).trim() : null,
          no_hp: noHp ? String(noHp).trim() : null,
        };
      });

      const res = await importStudentsWithAutoAccount({
        rows: mappedRows,
        penggunaId: user?.id,
      });

      setFeedback({
        type: 'success',
        message: res.message,
      });
      notify.fire({
        icon: 'success',
        title: 'Import Siswa Berhasil',
        text: res.message,
        badgeText: 'AUTO-ACCOUNT 628xxx',
      });
      setShowImportModal(false);
      setImportPreview([]);
      loadData();
    } catch (err: any) {
      setImportMessage(err.message || 'Gagal memproses import data.');
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    setStudentPage(1);
  }, [searchQuery, selectedKelasId, activeSchoolId]);

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchName =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nisn && s.nisn.includes(searchQuery));
    const matchKelas = !selectedKelasId || s.kelas_id === selectedKelasId;
    return matchName && matchKelas;
  });

  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));
  const safeStudentPage = Math.min(studentPage, totalStudentPages);
  const paginatedStudents = filteredStudents.slice(
    (safeStudentPage - 1) * studentPageSize,
    safeStudentPage * studentPageSize
  );

  return (
    <ProtectedRoute
      allowedRoles={['super_admin', 'admin', 'guru_piket', 'kepala_sekolah', 'guru']}
    >
      <div className="space-y-6 pb-16">
        {/* Header */}
      <PageHeader
        title="Manajemen Data Siswa"
        subtitle="Daftar seluruh siswa terdaftar untuk konfirmasi Makan Bergizi Gratis."
        badgeText="DATA INDUK SEKOLAH"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          {students.length === 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleSeedDemoData}
              leftIcon={<Database className="w-4 h-4 text-amber-600" />}
            >
              Isi Data Contoh
            </Button>
          )}

          {canManageStudents && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowImportModal(true)}
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Import Excel
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setFeedback(null);
                  resetStudentForm();
                  setShowAddModal(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Tambah Siswa
              </Button>
            </>
          )}
        </div>
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

      {/* Filter & Search Bar */}
      <div className="micro-card rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div className="sm:col-span-2">
          <Input
            label="Cari Siswa (Nama atau NISN)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama atau NISN siswa..."
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>

        <div>
          <Select
            label="Filter Kelas"
            value={selectedKelasId}
            onValueChange={(val) => setSelectedKelasId(val)}
            placeholder={`Semua Kelas (${kelasList.length})`}
            options={[
              { value: '', label: `Semua Kelas (${kelasList.length})` },
              ...kelasList.map((k) => ({
                value: k.id,
                label: k.nama_kelas,
              })),
            ]}
          />
        </div>
      </div>

      {/* Table Siswa */}
      <div className="micro-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold uppercase tracking-wider">
          <span>Menampilkan {filteredStudents.length} Siswa</span>
          <span>Total Terdaftar: {students.length}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Memuat data siswa...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Belum ada data siswa yang cocok dengan filter pencarian.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">NISN</th>
                    <th className="py-3 px-4">Kelas & Jurusan</th>
                    <th className="py-3 px-4">Status</th>
                    {canManageStudents && <th className="py-3 px-4 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-sm font-mono text-slate-500">
                        {(safeStudentPage - 1) * studentPageSize + idx + 1}
                      </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">{s.nama}</td>
                    <td className="py-3.5 px-4 text-sm font-mono text-slate-600">
                      {s.nisn || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-sm">
                      <div className="font-semibold text-slate-800">
                        {s.kelas?.nama_kelas || '-'}
                      </div>
                      <div className="text-slate-500">{s.kelas?.jurusan || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-sm">
                      {s.status_aktif ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    {canManageStudents && (
                      <td className="py-3.5 px-4 text-right text-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setFeedback(null);
                            setEditingStudent(s);
                            setFormData({
                              nama: s.nama,
                              nisn: s.nisn || '',
                              kelas_id: s.kelas_id,
                              email: s.email || '',
                              no_hp: s.no_hp || '',
                              alergi_makanan: s.alergi_makanan || '',
                              is_perwakilan_kelas: !!s.is_perwakilan_kelas,
                              status_aktif: s.status_aktif,
                            });
                            setShowAddModal(true);
                          }}
                          className="micro-tap p-2 text-slate-600 hover:text-brand-blue rounded-lg hover:bg-slate-100 transition"
                          title="Edit Siswa"
                          aria-label={`Edit siswa ${s.nama}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={safeStudentPage}
            totalItems={filteredStudents.length}
            pageSize={studentPageSize}
            pageSizeOptions={[20, 50, 100]}
            onPageChange={setStudentPage}
            onPageSizeChange={(size) => {
              setStudentPageSize(size);
              setStudentPage(1);
            }}
            itemLabel="siswa"
          />
        </>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT SISWA (FR-17) */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetStudentForm();
        }}
        title={editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
        size="md"
      >
        <form onSubmit={handleSaveStudent} className="space-y-4">
          {feedback && (
            <Alert variant={feedback.type} message={feedback.message} />
          )}

          <ModalInput
            label="Nama Lengkap"
            required
            value={formData.nama}
            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            placeholder="Contoh: Muhammad Rizky"
            leftIcon={<GraduationCap className="w-5 h-5" />}
            autoComplete="name"
          />

          <ModalInput
            label="NISN (Nomor Induk Siswa Nasional)"
            value={formData.nisn}
            onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
            placeholder="Contoh: 0061234567"
            helperText="10 digit angka unik per siswa."
            inputMode="numeric"
            autoComplete="off"
          />

          <ModalSelect
            label="Kelas"
            required
            value={formData.kelas_id}
            onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
            placeholder="Pilih Kelas"
            options={kelasList.map((k) => ({
              value: k.id,
              label: `${k.nama_kelas} • ${k.jurusan}`,
            }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ModalInput
              label="Email (Opsional)"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="siswa@gmail.com"
              autoComplete="email"
            />
            <ModalInput
              label="No. WhatsApp / HP (Opsional)"
              type="tel"
              value={formData.no_hp}
              onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
              placeholder="0812345678"
              inputMode="tel"
              autoComplete="tel"
              helperText="Opsional. Boleh dikosongkan dan diisi nanti. Siswa tanpa HP tetap bisa menerima MBG lewat klaim perwakilan kelas."
            />
          </div>

          <ModalInput
            label="Indikator Alergi Makanan (Opsional)"
            value={formData.alergi_makanan}
            onChange={(e) => setFormData({ ...formData, alergi_makanan: e.target.value })}
            placeholder="Contoh: Alergi Udang / Kacang / Telur"
            helperText="Peringatan keselamatan makanan ini akan muncul di daftar hadir operasional."
          />

          <ModalCheckbox
            label="Tetapkan sebagai Ketua / Perwakilan Kelas"
            checked={formData.is_perwakilan_kelas}
            onChange={(checked) => setFormData({ ...formData, is_perwakilan_kelas: checked })}
          />

          <ModalCheckbox
            label="Status Siswa Aktif"
            checked={formData.status_aktif}
            onChange={(checked) => setFormData({ ...formData, status_aktif: checked })}
          />

          <ModalActions
            onCancel={() => {
              setShowAddModal(false);
              resetStudentForm();
            }}
            submitLabel={editingStudent ? 'Simpan Perubahan' : 'Simpan Siswa'}
            submitting={submitting}
          />
        </form>
      </Modal>

      {/* MODAL IMPORT EXCEL (FR-17) */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          if (importing) return;
          setShowImportModal(false);
          resetImportState();
        }}
        title="Import Data Siswa dari Excel / CSV"
        size="lg"
      >
        <div className="space-y-4 text-sm">
          {importMessage && (
            <Alert variant="error" message={importMessage} />
          )}

          <p className="text-slate-600 leading-relaxed">
            Unggah file Excel (<code>.xlsx</code> / <code>.xls</code>) atau CSV dengan kolom:{' '}
            <strong>Nama Lengkap</strong>, <strong>NISN</strong>, dan <strong>Nama Kelas</strong>.
            {isAdmin && (
              <>
                {' '}
                File <strong>export Dapodik</strong> (sheet <em>Daftar Siswa</em>) terdeteksi otomatis
                dan diimpor massal.
              </>
            )}
          </p>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 text-brand-blue hover:underline font-semibold"
          >
            <Download className="w-4 h-4" />
            Unduh Format Template Excel
          </button>

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              disabled={importing}
              aria-label="Pilih file Excel atau CSV siswa"
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-blue-700"
            />
          </div>

          {dapodikPreview && (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 text-xs leading-relaxed">
                <strong>Format Dapodik terdeteksi.</strong> NIK, alamat, dan nama orang tua disimpan
                di database terpisah dan <strong>tidak ditampilkan</strong> di aplikasi.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ModalInput
                  label="Nama Sekolah"
                  required
                  value={importSchoolName}
                  onChange={(e) => setImportSchoolName(e.target.value)}
                  helperText="Dipakai bila sekolah dengan NPSN ini belum terdaftar."
                />
                <ModalInput
                  label="NPSN"
                  value={dapodikPreview.npsn || 'Tidak terdeteksi'}
                  readOnly
                  disabled
                />
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xl font-black text-slate-900">{dapodikPreview.rows.length}</div>
                  <div className="text-[11px] font-semibold uppercase text-slate-500">Siswa</div>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <div className="text-xl font-black text-slate-900">{dapodikPreview.perClass.length}</div>
                  <div className="text-[11px] font-semibold uppercase text-slate-500">Kelas</div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
                  <div className="text-xl font-black text-amber-800">{dapodikPreview.totalTanpaHp}</div>
                  <div className="text-[11px] font-semibold uppercase text-amber-700">Tanpa No. HP</div>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3 text-left">Kelas</th>
                      <th className="py-2 px-3 text-right">Siswa</th>
                      <th className="py-2 px-3 text-right">Tanpa HP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dapodikPreview.perClass.map((c) => (
                      <tr key={c.kelas}>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">{c.kelas}</td>
                        <td className="py-1.5 px-3 text-right font-mono">{c.jumlah}</td>
                        <td className="py-1.5 px-3 text-right font-mono text-amber-700">{c.tanpaHp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {dapodikPreview.issues.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-1 max-h-28 overflow-y-auto">
                  <div className="font-bold">Catatan ({dapodikPreview.issues.length}):</div>
                  {dapodikPreview.issues.map((issue, i) => (
                    <div key={i}>• {issue}</div>
                  ))}
                </div>
              )}

              {importProgress && (
                <div className="space-y-1" role="status" aria-live="polite">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span>{importProgress.stage}</span>
                    <span>
                      {importProgress.done} / {importProgress.total}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-brand-blue transition-all duration-300"
                      style={{
                        width: `${
                          importProgress.total > 0
                            ? Math.round((importProgress.done / importProgress.total) * 100)
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {!dapodikPreview && importPreview.length > 0 && (
            <div className="space-y-2">
              <div className="font-bold text-slate-800">
                Pratinjau Data: {importPreview.length} baris terdeteksi
              </div>
              <div className="max-h-40 overflow-y-auto bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                {importPreview.slice(0, 5).map((row, i) => (
                  <div key={i} className="text-sm text-slate-700">
                    {i + 1}. {row['Nama Lengkap'] || row['nama']} ({row['Nama Kelas'] || row['kelas']})
                  </div>
                ))}
                {importPreview.length > 5 && (
                  <div className="text-xs text-slate-500 italic">
                    ... dan {importPreview.length - 5} baris lainnya
                  </div>
                )}
              </div>
            </div>
          )}

          <ModalActions
            onCancel={() => {
              if (importing) return;
              setShowImportModal(false);
              resetImportState();
            }}
            onSubmit={handleExecuteImport}
            submitType="button"
            submitDisabled={
              dapodikPreview
                ? !importSchoolName.trim() || !dapodikPreview.npsn
                : importPreview.length === 0
            }
            submitLabel={
              dapodikPreview
                ? `Mulai Import Dapodik (${dapodikPreview.rows.length} Siswa)`
                : `Mulai Import (${importPreview.length} Data)`
            }
            submitting={importing}
          />
        </div>
      </Modal>
      </div>
    </ProtectedRoute>
  );
}
