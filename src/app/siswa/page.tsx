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
import { logActivity } from '@/lib/services';

export default function DataSiswaPage() {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';

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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: classes } = await supabase
        .from('kelas')
        .select('*')
        .eq('status_aktif', true)
        .order('nama_kelas');

      if (classes) {
        setKelasList(classes as Kelas[]);
      }

      const { data: stList } = await supabase
        .from('siswa')
        .select('*, kelas:kelas_id(id, nama_kelas, jurusan)')
        .order('nama');

      if (stList) {
        setStudents(stList as any);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save (Create or Update) Student
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.kelas_id) {
      setFeedback({ type: 'error', message: 'Nama dan kelas wajib diisi' });
      return;
    }

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('siswa')
          .update({
            nama: formData.nama.trim(),
            nisn: formData.nisn ? formData.nisn.trim() : null,
            kelas_id: formData.kelas_id,
            email: formData.email ? formData.email.trim() : null,
            no_hp: formData.no_hp ? formData.no_hp.trim() : null,
            status_aktif: formData.status_aktif,
            diperbarui_pada: new Date().toISOString(),
          })
          .eq('id', editingStudent.id);

        if (error) throw error;
        await logActivity('edit_siswa', 'siswa', editingStudent.id, editingStudent, formData, user?.id);
        setFeedback({ type: 'success', message: 'Data siswa berhasil diperbarui' });
      } else {
        const { data, error } = await supabase
          .from('siswa')
          .insert({
            nama: formData.nama.trim(),
            nisn: formData.nisn ? formData.nisn.trim() : null,
            kelas_id: formData.kelas_id,
            email: formData.email ? formData.email.trim() : null,
            no_hp: formData.no_hp ? formData.no_hp.trim() : null,
            status_aktif: true,
          })
          .select()
          .single();

        if (error) throw error;
        await logActivity('tambah_siswa', 'siswa', data.id, null, data, user?.id);
        setFeedback({ type: 'success', message: 'Siswa baru berhasil ditambahkan' });
      }

      setShowAddModal(false);
      setEditingStudent(null);
      setFormData({
        nama: '',
        nisn: '',
        kelas_id: kelasList[0]?.id || '',
        email: '',
        no_hp: '',
        status_aktif: true,
      });
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan siswa' });
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

  // Process Import Data
  const handleExecuteImport = async () => {
    if (importPreview.length === 0) return;
    setImporting(true);
    setImportMessage('');

    try {
      // Map class name to id
      const classMap = new Map(kelasList.map((k) => [k.nama_kelas.toLowerCase().trim(), k.id]));

      const toInsert: any[] = [];
      let skipped = 0;

      for (const row of importPreview) {
        const nama = row['Nama Lengkap'] || row['nama'] || row['Nama'];
        const namaKelas = row['Nama Kelas'] || row['kelas'] || row['Kelas'];
        const nisn = row['NISN'] || row['nisn'] || null;
        const email = row['Email'] || row['email'] || null;
        const noHp = row['No HP'] || row['no_hp'] || null;

        if (!nama) {
          skipped++;
          continue;
        }

        const kelasId = namaKelas ? classMap.get(String(namaKelas).toLowerCase().trim()) : null;

        toInsert.push({
          nama: String(nama).trim(),
          nisn: nisn ? String(nisn).trim() : null,
          kelas_id: kelasId || kelasList[0]?.id,
          email: email ? String(email).trim() : null,
          no_hp: noHp ? String(noHp).trim() : null,
          status_aktif: true,
        });
      }

      if (toInsert.length > 0) {
        const { error } = await supabase.from('siswa').insert(toInsert);
        if (error) throw error;
      }

      setFeedback({
        type: 'success',
        message: `Berhasil mengimpor ${toInsert.length} data siswa! (${skipped} dilewati)`,
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
          <p className="text-sm text-slate-500 mt-1">
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
                  setEditingStudent(null);
                  setFormData({
                    nama: '',
                    nisn: '',
                    kelas_id: kelasList[0]?.id || '',
                    email: '',
                    no_hp: '',
                    status_aktif: true,
                  });
                  setShowAddModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
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
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama atau NISN siswa..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedKelasId}
            onChange={(e) => setSelectedKelasId(e.target.value)}
            className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
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
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
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
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{s.nama}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      {s.nisn || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="font-semibold text-slate-800">
                        {s.kelas?.nama_kelas || '-'}
                      </div>
                      <div className="text-slate-500">{s.kelas?.jurusan || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {s.status_aktif ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-right text-xs">
                        <button
                          onClick={() => {
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
                          className="p-1.5 text-slate-600 hover:text-brand-blue rounded-lg hover:bg-slate-100 transition"
                          title="Edit Siswa"
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
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-base text-slate-900">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Muhammad Rizky"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  NISN (Nomor Induk Siswa Nasional)
                </label>
                <input
                  type="text"
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  placeholder="Contoh: 0061234567"
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kelas *
                </label>
                <select
                  required
                  value={formData.kelas_id}
                  onChange={(e) => setFormData({ ...formData, kelas_id: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kelas} - {k.jurusan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email (Opsional)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="siswa@gmail.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No. HP (Opsional)
                  </label>
                  <input
                    type="tel"
                    value={formData.no_hp}
                    onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })}
                    placeholder="0812345678"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="status_aktif"
                  checked={formData.status_aktif}
                  onChange={(e) => setFormData({ ...formData, status_aktif: e.target.checked })}
                  className="w-4 h-4 rounded text-brand-blue"
                />
                <label htmlFor="status_aktif" className="font-semibold text-slate-800">
                  Status Siswa Aktif
                </label>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold rounded-xl transition shadow"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL IMPORT EXCEL (FR-17) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-base text-slate-900">Import Data Siswa dari Excel / CSV</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportPreview([]);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {importMessage && (
              <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs">{importMessage}</div>
            )}

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Unggah file Excel (<code>.xlsx</code> / <code>.xls</code>) atau CSV dengan kolom:{' '}
                <strong>Nama Lengkap</strong>, <strong>NISN</strong>, dan <strong>Nama Kelas</strong>.
              </p>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 text-brand-blue hover:underline font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh Format Template Excel
              </button>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-blue file:text-white hover:file:bg-brand-blue-700"
                />
              </div>

              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-slate-800">
                    Pratinjau Data: {importPreview.length} baris terdeteksi
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-slate-50 p-2 rounded-xl border border-slate-200 space-y-1">
                    {importPreview.slice(0, 5).map((row, i) => (
                      <div key={i} className="text-[11px] text-slate-700">
                        {i + 1}. {row['Nama Lengkap'] || row['nama']} ({row['Nama Kelas'] || row['kelas']})
                      </div>
                    ))}
                    {importPreview.length > 5 && (
                      <div className="text-[10px] text-slate-400 italic">
                        ... dan {importPreview.length - 5} baris lainnya
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  disabled={importPreview.length === 0 || importing}
                  className="flex-1 py-3 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold rounded-xl transition shadow disabled:opacity-40"
                >
                  {importing ? 'Mengimpor Data...' : `Mulai Import (${importPreview.length} Data)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

