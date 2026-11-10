'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  GraduationCap,
  Search,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Trash2,
  Edit2,
  Sparkles,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';
import { Kelas, Siswa } from '@/lib/types';
import {
  logActivity,
  importStudentsWithAutoAccount,
  normalizePhone628,
  SEED_CLASSES,
  SEED_STUDENTS,
  SEED_STUDENT_PHONES,
} from '@/lib/services';
import {
  Modal,
  ModalInput,
  ModalSelect,
  ModalCheckbox,
  ModalActions,
} from '@/components/ui/ModalField';

export default function DataSiswaPage() {
  const { user, role } = useAuth();
  const isAdmin = role === 'super_admin' || role === 'admin' || !role;

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState('');

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
    status_aktif: true,
  });

  // Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importMessage, setImportMessage] = useState('');
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
      status_aktif: true,
    });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let resolvedClasses: Kelas[] = SEED_CLASSES as any;
      try {
        const { data: v12Classes } = await supabase
          .from('classes')
          .select('*')
          .order('nama_kelas');
        if (v12Classes && v12Classes.length > 0) {
          resolvedClasses = v12Classes as Kelas[];
        }
      } catch {
        // fallback SEED_CLASSES
      }
      setKelasList(resolvedClasses);

      const classById = new Map(resolvedClasses.map((c) => [c.id, c]));
      const mergedMap = new Map<string, Siswa>();

      // 1. Load from v1.2 `students` table
      try {
        const { data: v12Students } = await supabase
          .from('students')
          .select('*')
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
              status_aktif: true,
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
            const cls = classById.get(item.id_kelas) || resolvedClasses[0];
            const normPhone = normalizePhone628(item.no_hp || '');
            const key = `${String(item.nama_lengkap).toLowerCase()}|${normPhone}`;
            if (!mergedMap.has(key)) {
              mergedMap.set(key, {
                id: item.nisn,
                nisn: item.nisn,
                nama: item.nama_lengkap,
                nama_lengkap: item.nama_lengkap,
                id_kelas: item.id_kelas,
                kelas_id: item.id_kelas,
                no_hp: normPhone,
                email: null,
                jurusan: item.jurusan || cls?.jurusan || 'RPL',
                alergi_makanan: null,
                is_perwakilan_kelas: !!item.is_perwakilan_kelas,
                lead_score: 0,
                lead_status: 'COLD',
                status_aktif: true,
                dibuat_pada: '',
                diperbarui_pada: '',
                kelas: cls,
              });
            }
          }
        } catch {
          // ignore
        }
      }

      // 3. Fallback to SEED_STUDENTS if still empty
      if (mergedMap.size === 0) {
        for (const seed of SEED_STUDENTS) {
          const cls = classById.get(seed.id_kelas) || resolvedClasses[0];
          const phone = SEED_STUDENT_PHONES[seed.nisn] || `62812000${seed.nisn.slice(-5)}`;
          const key = `${seed.nama_lengkap.toLowerCase()}|${phone}`;
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

      setStudents(Array.from(mergedMap.values()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save (Create or Update) Student with Auto-Account Generation (628xxx) & Deduplication
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.kelas_id) {
      setFeedback({ type: 'error', message: 'Nama dan kelas wajib diisi' });
      return;
    }

    const normalizedPhone = formData.no_hp
      ? normalizePhone628(formData.no_hp)
      : `62813${String(Math.floor(1000000 + Math.random() * 9000000))}`;

    // Cek duplikasi Nama + No. HP di satu sekolah
    const duplicate = students.find(
      (s) =>
        s.id !== editingStudent?.id &&
        s.nama.trim().toLowerCase() === formData.nama.trim().toLowerCase() &&
        normalizePhone628(s.no_hp || '') === normalizedPhone
    );
    if (duplicate) {
      setFeedback({
        type: 'error',
        message: `Duplikasi ditolak: Siswa "${formData.nama}" dengan No. HP ${normalizedPhone} sudah terdaftar di sekolah ini.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const targetCls = kelasList.find((k) => k.id === formData.kelas_id);
      const res = await importStudentsWithAutoAccount({
        rows: [
          {
            nama: formData.nama.trim(),
            nisn: formData.nisn ? formData.nisn.trim() : editingStudent?.nisn || null,
            kelas_id: formData.kelas_id,
            nama_kelas: targetCls?.nama_kelas,
            jurusan: targetCls?.jurusan,
            email: formData.email ? formData.email.trim() : null,
            no_hp: normalizedPhone,
          },
        ],
        penggunaId: user?.id,
      });

      setShowAddModal(false);
      resetStudentForm();
      setFeedback({
        type: 'success',
        message: editingStudent
          ? `Data siswa & kunci login (${normalizedPhone}) berhasil diperbarui!`
          : res.message,
      });
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
      // 1. Create default classes if none
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
  };

  // Handle File Upload & Parse Excel / CSV
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
      } catch (err) {
        setImportMessage('Gagal membaca file excel/csv');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Process Import Data with Auto-Account Generation (Tahap 5 RBAC)
  const handleExecuteImport = async () => {
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
      setShowImportModal(false);
      setImportPreview([]);
      loadData();
    } catch (err: any) {
      setImportMessage(err.message || 'Gagal memproses import data.');
    } finally {
      setImporting(false);
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchName =
      s.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.nisn && s.nisn.includes(searchQuery));
    const matchKelas = !selectedKelasId || s.kelas_id === selectedKelasId;
    return matchName && matchKelas;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-brand-blue rounded-full text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            Data Induk Sekolah
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            Manajemen Data Siswa
          </h1>
          <p className="text-base text-slate-600 mt-1">
            Daftar seluruh siswa terdaftar untuk konfirmasi Makan Bergizi Gratis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {students.length === 0 && (
            <button
              onClick={handleSeedDemoData}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              Isi Data Contoh
            </button>
          )}

          {isAdmin && (
            <>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                <Upload className="w-4 h-4" />
                Import Excel
              </button>

              <button
                onClick={() => {
                  setFeedback(null);
                  resetStudentForm();
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-3 bg-brand-blue hover:bg-brand-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Tambah Siswa
              </button>
            </>
          )}
        </div>
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

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama atau NISN siswa..."
            aria-label="Cari siswa"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-300 rounded-2xl text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue transition"
          />
        </div>

        <div className="w-full sm:w-64">
          <label htmlFor="filter-kelas" className="sr-only">
            Filter kelas
          </label>
          <select
            id="filter-kelas"
            value={selectedKelasId}
            onChange={(e) => setSelectedKelasId(e.target.value)}
            className="w-full py-3.5 px-4 bg-white border border-slate-300 rounded-2xl text-base text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue transition"
          >
            <option value="">Semua Kelas ({kelasList.length})</option>
            {kelasList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama_kelas}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Siswa */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
          <span>Menampilkan {filteredStudents.length} Siswa</span>
          <span>Total Terdaftar: {students.length}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Memuat data siswa...
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Belum ada data siswa yang cocok dengan filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">NISN</th>
                  <th className="py-3 px-4">Kelas & Jurusan</th>
                  <th className="py-3 px-4">Status</th>
                  {isAdmin && <th className="py-3 px-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-sm font-mono text-slate-400">{idx + 1}</td>
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
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right text-xs">
                        <button
                          onClick={() => {
                            setFeedback(null);
                            setEditingStudent(s);
                            setFormData({
                              nama: s.nama,
                              nisn: s.nisn || '',
                              kelas_id: s.kelas_id,
                              email: s.email || '',
                              no_hp: s.no_hp || '',
                              status_aktif: s.status_aktif,
                            });
                            setShowAddModal(true);
                          }}
                          className="p-2 text-slate-600 hover:text-brand-blue rounded-lg hover:bg-slate-100 transition"
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
            placeholder="Contoh: Muhammad Rizky"
            leftIcon={<GraduationCap className="w-5 h-5" />}
            autoComplete="name"
          />

          <ModalInput
            label="NISN (Nomor Induk Siswa Nasional)"
            value={formData.nisn}
            onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
            placeholder="Contoh: 0061234567"
            helperText="10 digit angka, opsional jika belum ada."
            inputMode="numeric"
            autoComplete="off"
          />

          <ModalSelect
            label="Kelas"
            required
            value={formData.kelas_id}
            onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
            placeholder="-- Pilih Kelas --"
            options={kelasList.map((k) => ({
              value: k.id,
              label: `${k.nama_kelas} - ${k.jurusan}`,
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
              label="No. HP (Opsional)"
              type="tel"
              value={formData.no_hp}
              onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
              placeholder="0812345678"
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

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
          setShowImportModal(false);
          setImportPreview([]);
          setImportMessage('');
        }}
        title="Import Data Siswa dari Excel / CSV"
        size="lg"
      >
        <div className="space-y-4 text-sm">
          {importMessage && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm" role="alert">
              {importMessage}
            </div>
          )}

          <p className="text-slate-600 leading-relaxed">
            Unggah file Excel (<code>.xlsx</code> / <code>.xls</code>) atau CSV dengan kolom:{' '}
            <strong>Nama Lengkap</strong>, <strong>NISN</strong>, dan <strong>Nama Kelas</strong>.
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
              className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-blue-700"
            />
          </div>

          {importPreview.length > 0 && (
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
                  <div className="text-xs text-slate-400 italic">
                    ... dan {importPreview.length - 5} baris lainnya
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
            onSubmit={handleExecuteImport}
            submitType="button"
            submitDisabled={importPreview.length === 0}
            submitLabel={`Mulai Import (${importPreview.length} Data)`}
            submitting={importing}
          />
        </div>
      </Modal>
    </div>
  );
}

