'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  RotateCw,
  Search,
  Edit2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '@/lib/supabase/client';
import { DistribusiMBG, Kelas, PenerimaanMBG } from '@/lib/types';
import {
  formatWIBTime,
  formatIndonesianDate,
  formatIndonesianDateTime,
  getJakartaDateString,
} from '@/lib/utils';
import {
  getTodayDistribution,
  getMonitoringOverview,
  SEED_CLASSES,
  getClassRoster,
  correctClassAttendance,
} from '@/lib/services';
import { Modal, ModalInput, ModalActions } from '@/components/ui/ModalField';

export default function LaporanPage() {
  const { user, role } = useAuth();
  const canCorrectData =
    role === 'kepala_sekolah' || role === 'super_admin' || role === 'admin';
  const [activeTab, setActiveTab] = useState<'harian' | 'siswa' | 'kelas'>('harian');

  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [corrHadir, setCorrHadir] = useState(0);
  const [corrAbsen, setCorrAbsen] = useState(0);
  const [corrReason, setCorrReason] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionFeedback, setCorrectionFeedback] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getJakartaDateString());
  const [distribusi, setDistribusi] = useState<DistribusiMBG | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  // Filters for Siswa Tab
  const [searchSiswa, setSearchSiswa] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSumber, setFilterSumber] = useState('');

  const loadReportData = async () => {
    setLoading(true);
    try {
      // 1. Fetch distribution for selected date via service fallback
      const dist = await getTodayDistribution();
      setDistribusi(dist as any);

      // 2. Fetch overview & classes
      const overview = await getMonitoringOverview();
      const mappedClasses = overview.classes.map((c) => ({
        id: c.id_kelas,
        nama_kelas: c.nama_kelas,
        tingkat: c.tingkat,
        jurusan: c.jurusan,
        total_siswa_dapodik: c.total_siswa,
        jumlah_hadir: c.jumlah_hadir,
        jumlah_absen: c.jumlah_absen,
        siswa: Array.from({ length: c.total_siswa }, (_, i) => ({ id: `s-${i}` })),
      }));
      setKelasList(mappedClasses as any);

      // 3. Synthesize receipts from all student roster
      const allRosterLists = await Promise.all(SEED_CLASSES.map((cls) => getClassRoster(cls.id)));
      const allRoster = allRosterLists.flat();
      const synthReceipts = allRoster.map((st) => ({
        id: `rec-${st.nisn}`,
        distribusi_id: dist?.id || 'today',
        siswa_id: st.nisn,
        nama_siswa: st.nama_lengkap,
        nisn: st.nisn,
        kelas: st.nama_kelas,
        jurusan: st.jurusan,
        status_penerimaan: st.sudah_ambil ? 'diterima' : 'tidak_hadir',
        waktu_penerimaan: st.waktu_ambil || (st.sudah_ambil ? new Date().toISOString() : null),
        sumber_pencatatan: 'siswa',
      }));

      setReceipts(synthReceipts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedDate]);

  // Calculations for Laporan Harian
  const validDiterima = receipts.filter((r) => r.status_penerimaan === 'diterima');
  const tidakHadir = receipts.filter((r) => r.status_penerimaan === 'tidak_hadir');
  const tidakMengambil = receipts.filter((r) => r.status_penerimaan === 'tidak_mengambil');

  const totalSiswaSekolah = kelasList.reduce(
    (acc, k: any) => acc + (k.siswa?.length || 0),
    0
  );
  const totalDiterima = validDiterima.length;
  const totalBelum = Math.max(0, totalSiswaSekolah - totalDiterima);
  const persentase =
    totalSiswaSekolah > 0 ? ((totalDiterima / totalSiswaSekolah) * 100).toFixed(1) : '0';

  const waktuPertama = validDiterima.length > 0 ? validDiterima[0].waktu_penerimaan : null;
  const waktuTerakhir =
    validDiterima.length > 0
      ? validDiterima[validDiterima.length - 1].waktu_penerimaan
      : null;

  // Filtered Receipts for Siswa Tab
  const filteredReceipts = receipts.filter((r) => {
    const matchNama =
      r.nama_siswa.toLowerCase().includes(searchSiswa.toLowerCase()) ||
      (r.nisn && r.nisn.includes(searchSiswa));
    const matchKelas = !filterKelas || r.kelas === filterKelas;
    const matchStatus = !filterStatus || r.status_penerimaan === filterStatus;
    const matchSumber = !filterSumber || r.sumber_pencatatan === filterSumber;
    return matchNama && matchKelas && matchStatus && matchSumber;
  });

  // Export to Excel (FR-22)
  const handleExportExcel = () => {
    const dataToExport = filteredReceipts.map((r, i) => ({
      No: i + 1,
      'Tanggal Distribusi': selectedDate,
      'Nama Siswa': r.nama_siswa,
      NISN: r.nisn || '-',
      Kelas: r.kelas,
      Jurusan: r.jurusan,
      Status: r.status_penerimaan.toUpperCase(),
      'Jam Penerimaan': r.waktu_penerimaan ? formatWIBTime(r.waktu_penerimaan) : '-',
      'Sumber Konfirmasi': r.sumber_pencatatan === 'siswa' ? 'Siswa (Scan)' : 'Guru',
      'Petugas Pencatat': r.petugas?.nama || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan MBG');
    XLSX.writeFile(wb, `Laporan_MBG_${selectedDate}.xlsx`);
  };

  // Export to CSV (FR-24)
  const handleExportCSV = () => {
    const dataToExport = filteredReceipts.map((r, i) => ({
      No: i + 1,
      Tanggal: selectedDate,
      Nama: r.nama_siswa,
      NISN: r.nisn || '',
      Kelas: r.kelas,
      Jurusan: r.jurusan,
      Status: r.status_penerimaan,
      Waktu: r.waktu_penerimaan ? formatWIBTime(r.waktu_penerimaan) : '',
      Sumber: r.sumber_pencatatan,
      Petugas: r.petugas?.nama || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const csvOutput = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_MBG_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Export Controls (Hidden on Print) */}
      <div className="no-print bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-brand-blue rounded-full text-xs font-semibold mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Laporan & Rekapitulasi
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            Laporan Distribusi MBG
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Rekap harian, per siswa, per kelas, serta ekspor format Excel, CSV, dan cetak PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            Export Excel (.xlsx)
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            CSV
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-navy hover:bg-brand-navy-light text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF
          </button>
        </div>
      </div>

      {/* Filter Tanggal & Tab Nav (Hidden on Print) */}
      <div className="no-print bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 uppercase">Pilih Tanggal:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('harian')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'harian'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Harian
          </button>
          <button
            onClick={() => setActiveTab('siswa')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'siswa'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Per Siswa ({receipts.length})
          </button>
          <button
            onClick={() => setActiveTab('kelas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'kelas'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Per Kelas
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block text-center border-b pb-4 mb-6">
        <h2 className="text-xl font-bold uppercase">LAPORAN REKAPITULASI MAKAN BERGIZI GRATIS (MBG)</h2>
        <p className="text-sm">Tanggal: {formatIndonesianDate(selectedDate)}</p>
      </div>

      {/* TAB 1: LAPORAN HARIAN (PRD 9.1) */}
      {activeTab === 'harian' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase text-slate-400">Total Siswa Terdaftar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalSiswaSekolah}</div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase text-emerald-600">Sudah Menerima</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {totalDiterima} ({persentase}%)
              </div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase text-amber-600">Belum Tercatat</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{totalBelum}</div>
            </div>
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase text-red-600">Tidak Hadir / Mengambil</div>
              <div className="text-2xl font-black text-red-600 mt-1">
                {tidakHadir.length + tidakMengambil.length}
              </div>
            </div>
          </div>

          {/* Snapshot Waktu */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                Waktu Kedatangan MBG
              </span>
              <span className="font-mono font-bold text-sm text-slate-800">
                {formatWIBTime(distribusi?.waktu_kedatangan)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                Konfirmasi Pertama
              </span>
              <span className="font-mono font-bold text-sm text-emerald-700">
                {formatWIBTime(waktuPertama)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">
                Konfirmasi Terakhir
              </span>
              <span className="font-mono font-bold text-sm text-blue-700">
                {formatWIBTime(waktuTerakhir)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN PER SISWA (PRD 9.2) */}
      {activeTab === 'siswa' && (
        <div className="space-y-4">
          {/* Filter Bar (Hidden on print) */}
          <div className="no-print bg-white rounded-3xl p-4 border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <input
                type="text"
                value={searchSiswa}
                onChange={(e) => setSearchSiswa(e.target.value)}
                placeholder="Cari nama atau NISN..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              >
                <option value="">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.nama_kelas}>
                    {k.nama_kelas}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              >
                <option value="">Semua Status</option>
                <option value="diterima">Diterima</option>
                <option value="tidak_hadir">Tidak Hadir</option>
                <option value="tidak_mengambil">Tidak Mengambil</option>
              </select>
            </div>
            <div>
              <select
                value={filterSumber}
                onChange={(e) => setFilterSumber(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
              >
                <option value="">Semua Sumber</option>
                <option value="siswa">Scan Siswa</option>
                <option value="guru">Input Guru</option>
              </select>
            </div>
          </div>

          {/* Table Transaksi Per Siswa */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
              <span>Total Catatan: {filteredReceipts.length} Transaksi</span>
            </div>

            {filteredReceipts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                Tidak ada data penerimaan pada tanggal dan filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">NISN</th>
                      <th className="py-3 px-4">Kelas</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Waktu (WIB)</th>
                      <th className="py-3 px-4">Sumber</th>
                      <th className="py-3 px-4">Pencatat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredReceipts.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono text-slate-400">{i + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{r.nama_siswa}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{r.nisn || '-'}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">{r.kelas}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              r.status_penerimaan === 'diterima'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status_penerimaan === 'tidak_hadir'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.status_penerimaan}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {formatWIBTime(r.waktu_penerimaan)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-600">
                            {r.sumber_pencatatan === 'siswa' ? 'Scan Mandiri' : 'Guru'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{r.petugas?.nama || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: LAPORAN PER KELAS (PRD 9.3) */}
      {activeTab === 'kelas' && (
        <div className="space-y-4">
          {correctionFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
              <span>{correctionFeedback}</span>
              <button
                onClick={() => setCorrectionFeedback(null)}
                className="underline text-emerald-800"
              >
                Tutup
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Kelas</th>
                    <th className="py-3 px-4">Jurusan</th>
                    <th className="py-3 px-4">Total Siswa</th>
                    <th className="py-3 px-4">Sudah Menerima</th>
                    <th className="py-3 px-4">Belum Tercatat</th>
                    <th className="py-3 px-4">Capaian (%)</th>
                    {canCorrectData && <th className="py-3 px-4 text-right">Koreksi Kepsek</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kelasList.map((k: any) => {
                    const total = k.total_siswa_dapodik || k.siswa?.length || 0;
                    const sudah =
                      typeof k.jumlah_hadir === 'number'
                        ? k.jumlah_hadir
                        : validDiterima.filter((r) => r.kelas === k.nama_kelas).length;
                    const belum =
                      typeof k.jumlah_absen === 'number'
                        ? k.jumlah_absen
                        : Math.max(0, total - sudah);
                    const pct = total > 0 ? ((sudah / total) * 100).toFixed(0) : '0';

                    return (
                      <tr key={k.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{k.nama_kelas}</td>
                        <td className="py-3.5 px-4 text-slate-600">{k.jurusan}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{total}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{sudah}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{belum}</td>
                        <td className="py-3.5 px-4 font-bold text-brand-blue">{pct}%</td>
                        {canCorrectData && (
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingClass({ ...k, total, sudah, belum });
                                setCorrHadir(sudah);
                                setCorrAbsen(belum);
                                setCorrReason('Koreksi rekapitulasi oleh Kepala Sekolah');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition active:scale-95"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit Data
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Koreksi Data oleh Kepala Sekolah / Super Admin */}
      <Modal
        isOpen={!!editingClass}
        onClose={() => setEditingClass(null)}
        title={`Koreksi Rekapitulasi ${editingClass?.nama_kelas || ''}`}
        description="Perubahan akan dicatat ke Audit Log dengan label CORRECTION_BY_KEPSEK."
        size="sm"
      >
        {editingClass && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmittingCorrection(true);
              try {
                const res = await correctClassAttendance({
                  idKelas: editingClass.id,
                  namaKelas: editingClass.nama_kelas,
                  totalSiswa: editingClass.total,
                  jumlahHadirBaru: corrHadir,
                  jumlahAbsenBaru: corrAbsen,
                  alasanKoreksi: corrReason,
                  penggunaId: user?.id,
                  namaPengguna: user?.nama || 'Kepala Sekolah',
                });
                setEditingClass(null);
                setCorrectionFeedback(res.message);
                await loadReportData();
              } finally {
                setSubmittingCorrection(false);
              }
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <ModalInput
                label="Jumlah Hadir"
                type="number"
                min={0}
                max={editingClass.total}
                required
                value={String(corrHadir)}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(editingClass.total, Number(e.target.value) || 0));
                  setCorrHadir(val);
                  setCorrAbsen(Math.max(0, editingClass.total - val));
                }}
              />
              <ModalInput
                label="Jumlah Absen"
                type="number"
                min={0}
                max={editingClass.total}
                required
                value={String(corrAbsen)}
                onChange={(e) => setCorrAbsen(Math.max(0, Number(e.target.value) || 0))}
              />
            </div>

            <ModalInput
              label="Alasan Koreksi"
              required
              value={corrReason}
              onChange={(e) => setCorrReason(e.target.value)}
            />

            <ModalActions
              onCancel={() => setEditingClass(null)}
              submitLabel="Simpan Koreksi"
              submitting={submittingCorrection}
            />
          </form>
        )}
      </Modal>
    </div>
  );
}

