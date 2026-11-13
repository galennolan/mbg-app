'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Download,
  Printer,
  Search,
  Edit2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Info,
  RotateCw,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  DistribusiMBG,
  Kelas,
  IncidentReport,
  IncidentCategory,
  IncidentSeverity,
  IncidentStatus,
  School,
} from '@/lib/types';
import {
  formatWIBTime,
  formatIndonesianDate,
  formatDateDDMMYYYY,
  getJakartaDateString,
} from '@/lib/utils';
import {
  getTodayDistribution,
  getMonitoringOverview,
  SEED_CLASSES,
  SEED_SCHOOL,
  getSchoolById,
  getClassRoster,
  correctClassAttendance,
  getIncidentReports,
  updateIncidentReport,
} from '@/lib/services';
import { Modal, ModalInput, ModalActions } from '@/components/ui/ModalField';
import {
  PageHeader,
  Input,
  Select,
  DatePicker,
  Button,
  FeedbackBanner,
  useNotify,
} from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LaporanCharts } from '@/components/laporan/LaporanCharts';
import { PrintReportDocument } from '@/components/laporan/PrintReportDocument';

export default function LaporanPage() {
  const { user, role, activeSchoolId } = useAuth();
  const notify = useNotify();
  const canCorrectData =
    role === 'kepala_sekolah' || role === 'super_admin' || role === 'admin' || role === 'guru_piket';
  const isSuperAdmin = role === 'super_admin' || role === 'admin';
  const showNISN = isSuperAdmin;
  const [activeTab, setActiveTab] = useState<'harian' | 'siswa' | 'kelas' | 'kejadian'>('harian');

  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [corrHadir, setCorrHadir] = useState(0);
  const [corrAbsen, setCorrAbsen] = useState(0);
  const [corrReason, setCorrReason] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [correctionFeedback, setCorrectionFeedback] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getJakartaDateString());
  const [schoolInfo, setSchoolInfo] = useState<School>(SEED_SCHOOL);
  const [distribusi, setDistribusi] = useState<DistribusiMBG | null>(null);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);

  // Incident Reports State
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [searchIncident, setSearchIncident] = useState('');
  const [filterIncKategori, setFilterIncKategori] = useState('');
  const [filterIncSeverity, setFilterIncSeverity] = useState('');
  const [filterIncStatus, setFilterIncStatus] = useState('');
  const [filterIncDateRange, setFilterIncDateRange] = useState<'selected' | 'all' | '7days' | 'month'>('all');

  // Filters for Siswa Tab
  const [searchSiswa, setSearchSiswa] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSumber, setFilterSumber] = useState('');

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [school, dist, overview] = await Promise.all([
        getSchoolById(activeSchoolId),
        getTodayDistribution(activeSchoolId),
        getMonitoringOverview(activeSchoolId),
      ]);
      setSchoolInfo(school);
      setDistribusi(dist as any);

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

      // Load Incidents
      try {
        const incList = await getIncidentReports({ schoolId: activeSchoolId });
        setIncidents(incList);
      } catch (incErr) {
        console.warn('Failed to load incidents for report:', incErr);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedDate, activeSchoolId]);

  // Calculations for Laporan Harian
  const validDiterima = receipts
    .filter((r) => r.status_penerimaan === 'diterima')
    .sort((a, b) => {
      const timeA = a.waktu_penerimaan ? new Date(a.waktu_penerimaan).getTime() : 0;
      const timeB = b.waktu_penerimaan ? new Date(b.waktu_penerimaan).getTime() : 0;
      return timeA - timeB;
    });
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

  // Filtered Incidents for Kejadian Khusus Tab
  const filteredIncidents = incidents.filter((inc) => {
    if (filterIncDateRange === 'selected' && inc.tanggal !== selectedDate) return false;
    if (filterIncDateRange === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const minDate = d.toISOString().slice(0, 10);
      if (inc.tanggal < minDate) return false;
    }
    if (filterIncDateRange === 'month') {
      const currentMonth = getJakartaDateString().slice(0, 7);
      if (!inc.tanggal.startsWith(currentMonth)) return false;
    }

    if (filterIncKategori && filterIncKategori !== 'semua' && inc.kategori !== filterIncKategori)
      return false;
    if (
      filterIncSeverity &&
      filterIncSeverity !== 'semua' &&
      inc.tingkat_keparahan !== filterIncSeverity
    )
      return false;
    if (filterIncStatus && filterIncStatus !== 'semua' && inc.status_penyelesaian !== filterIncStatus)
      return false;

    if (searchIncident.trim()) {
      const q = searchIncident.toLowerCase();
      const matchJudul = inc.judul_kejadian.toLowerCase().includes(q);
      const matchDesk = inc.deskripsi.toLowerCase().includes(q);
      const matchPelapor = (inc.nama_petugas_pelapor || '').toLowerCase().includes(q);
      if (!matchJudul && !matchDesk && !matchPelapor) return false;
    }

    return true;
  });

  const incidentsForSelectedDate = incidents.filter((inc) => inc.tanggal === selectedDate);

  const handleToggleIncidentStatus = async (incident: IncidentReport) => {
    const nextStatus: Record<IncidentStatus, IncidentStatus> = {
      menunggu: 'diproses',
      diproses: 'selesai',
      selesai: 'menunggu',
    };
    const newStatus = nextStatus[incident.status_penyelesaian];
    try {
      const updated = await updateIncidentReport(incident.id, {
        status_penyelesaian: newStatus,
      });
      setIncidents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      notify.success(`Status kejadian diperbarui menjadi "${newStatus}".`, 'Status Diperbarui');
    } catch (err: any) {
      notify.error(err.message || 'Gagal memperbarui status kejadian', 'Gagal');
    }
  };

  const sanitizeFilePart = (val: string) =>
    val.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'Semua';

  const buildStyledSheet = (
    title: string,
    filterInfo: string,
    headers: string[],
    rows: (string | number)[][],
    colWidths: number[],
    totalRow?: (string | number)[]
  ) => {
    const aoa: (string | number)[][] = [
      [title],
      [`Sekolah: ${schoolInfo.nama_sekolah} (NPSN: ${schoolInfo.npsn})`],
      [`Tanggal Laporan: ${formatIndonesianDate(selectedDate)} (${formatDateDDMMYYYY(selectedDate)})`],
      [`Filter: ${filterInfo}`],
      [],
      headers,
      ...rows,
    ];
    if (totalRow) {
      aoa.push(totalRow);
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = colWidths.map((wch) => ({ wch }));
    return ws;
  };

  // Export to Excel (Tab-Aware & Terstruktur)
  const handleExportExcel = () => {
    if (loading) {
      notify.warning('Data laporan masih dimuat, mohon tunggu sebentar.', 'Data Belum Siap');
      return;
    }

    const formattedDate = formatDateDDMMYYYY(selectedDate);
    const wb = XLSX.utils.book_new();

    const buildSiswaSheet = (filterDesc: string) => {
      const headers = [
        'No',
        'Tanggal Distribusi',
        'Nama Lengkap Siswa',
        ...(showNISN ? ['NISN'] : []),
        'Kelas',
        'Jurusan',
        'Status Penerimaan',
        'Waktu Terima (WIB)',
        'Sumber Konfirmasi',
        'Petugas Pencatat',
      ];
      const rows = filteredReceipts.map((r, i) => [
        i + 1,
        formattedDate,
        r.nama_siswa,
        ...(showNISN ? [r.nisn || '-'] : []),
        r.kelas,
        r.jurusan || '-',
        r.status_penerimaan.toUpperCase(),
        r.waktu_penerimaan ? formatWIBTime(r.waktu_penerimaan) : '-',
        r.sumber_pencatatan === 'siswa' ? 'Scan Mandiri' : 'Guru Piket',
        r.petugas?.nama || '-',
      ]);
      const colWidths = [
        5,
        18,
        28,
        ...(showNISN ? [15] : []),
        14,
        22,
        18,
        18,
        18,
        22,
      ];
      const diterimaFiltered = filteredReceipts.filter((r) => r.status_penerimaan === 'diterima').length;
      const totalRow = [
        'TOTAL',
        `${filteredReceipts.length} Siswa`,
        `Diterima: ${diterimaFiltered}`,
        ...(showNISN ? [''] : []),
        '',
        '',
        `Belum/Absen: ${filteredReceipts.length - diterimaFiltered}`,
        '',
        '',
        '',
      ];
      return buildStyledSheet(
        'DAFTAR PENERIMAAN MAKAN BERGIZI GRATIS (MBG) TINGKAT SISWA',
        filterDesc,
        headers,
        rows,
        colWidths,
        totalRow
      );
    };

    const buildKelasSheet = (filterDesc: string) => {
      const headers = [
        'No',
        'Nama Kelas',
        'Tingkat',
        'Jurusan',
        'Total Kuota Siswa',
        'Sudah Menerima',
        'Belum / Sisa',
        'Penyerapan (%)',
        'Status Rombel',
      ];
      const rows = kelasList.map((k: any, i) => {
        const total = k.total_siswa_dapodik || k.siswa?.length || 0;
        const sudah =
          typeof k.jumlah_hadir === 'number'
            ? k.jumlah_hadir
            : validDiterima.filter((r) => r.kelas === k.nama_kelas).length;
        const belum =
          typeof k.jumlah_absen === 'number'
            ? k.jumlah_absen
            : Math.max(0, total - sudah);
        const pct = total > 0 ? `${Math.round((sudah / total) * 100)}%` : '0%';
        const statusRombel =
          sudah >= total && total > 0 ? 'Selesai 100%' : sudah > 0 ? 'Berjalan' : 'Belum Mulai';

        return [i + 1, k.nama_kelas, k.tingkat || '-', k.jurusan || '-', total, sudah, belum, pct, statusRombel];
      });
      const totalRow = [
        'TOTAL',
        'Akumulasi Sekolah',
        '-',
        '-',
        totalSiswaSekolah,
        totalDiterima,
        totalBelum,
        `${persentase}%`,
        '-',
      ];
      return buildStyledSheet(
        'REKAPITULASI PENYERAPAN MBG TINGKAT KELAS / ROMBEL',
        filterDesc,
        headers,
        rows,
        [5, 18, 10, 24, 18, 16, 14, 16, 16],
        totalRow
      );
    };

    const buildKejadianSheet = (list: IncidentReport[], filterDesc: string) => {
      const headers = [
        'No',
        'Tanggal',
        'Jam (WIB)',
        'Kategori Insiden',
        'Tingkat Keparahan',
        'Judul Kejadian',
        'Deskripsi Lengkap',
        'Tindak Lanjut',
        'Petugas Pelapor',
        'Status Penyelesaian',
      ];
      const rows = list.map((inc, i) => [
        i + 1,
        formatDateDDMMYYYY(inc.tanggal),
        `${inc.waktu_kejadian.slice(0, 5)} WIB`,
        inc.kategori.replace(/_/g, ' ').toUpperCase(),
        inc.tingkat_keparahan.toUpperCase(),
        inc.judul_kejadian,
        inc.deskripsi,
        inc.tindak_lanjut || '-',
        inc.nama_petugas_pelapor || '-',
        inc.status_penyelesaian.toUpperCase(),
      ]);
      const totalRow = ['TOTAL', `${list.length} Kejadian`, '', '', '', '', '', '', '', ''];
      return buildStyledSheet(
        'BERITA ACARA & LOG REKAPITULASI KEJADIAN KHUSUS MBG',
        filterDesc,
        headers,
        rows,
        [5, 14, 12, 22, 18, 28, 42, 32, 22, 20],
        totalRow
      );
    };

    if (activeTab === 'harian') {
      const sppgName =
        distribusi?.nama_sppg_aktual || schoolInfo.nama_sppg_mitra || 'SPPG Mitra Bergizi';
      const summaryRows: (string | number)[][] = [
        ['Mitra Penyedia (SPPG)', sppgName],
        ['Waktu Kedatangan MBG', distribusi?.waktu_kedatangan ? `${formatWIBTime(distribusi.waktu_kedatangan)} WIB` : 'Belum Tercatat'],
        ['Status Distribusi / QC', distribusi?.status ? distribusi.status.toUpperCase() : 'MENUNGGU'],
        ['Total Siswa Terdaftar', totalSiswaSekolah],
        ['Sudah Menerima', `${totalDiterima} (${persentase}%)`],
        ['Belum Tercatat', totalBelum],
        ['Tidak Hadir / Tidak Mengambil', tidakHadir.length + tidakMengambil.length],
        ['Penerimaan Pertama', waktuPertama ? `${formatWIBTime(waktuPertama)} WIB` : '-'],
        ['Penerimaan Terakhir', waktuTerakhir ? `${formatWIBTime(waktuTerakhir)} WIB` : '-'],
      ];
      const wsRingkasan = buildStyledSheet(
        'RINGKASAN LAPORAN HARIAN PELAKSANAAN MBG',
        `Tanggal ${formattedDate}`,
        ['Parameter Pelaksanaan', 'Nilai / Keterangan'],
        summaryRows,
        [34, 48]
      );
      XLSX.utils.book_append_sheet(wb, wsRingkasan, 'Ringkasan Harian');
      XLSX.utils.book_append_sheet(wb, buildKelasSheet(`Tanggal ${formattedDate}`), 'Rekap Kelas');
      XLSX.utils.book_append_sheet(wb, buildSiswaSheet(`Tanggal ${formattedDate}`), 'Daftar Siswa');
      XLSX.utils.book_append_sheet(
        wb,
        buildKejadianSheet(incidentsForSelectedDate, `Tanggal ${formattedDate}`),
        'Kejadian Khusus'
      );

      const fileName = `Laporan_Harian_MBG_${formattedDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      notify.success('Ekspor Excel Berhasil', `File ${fileName} telah diunduh.`);
      return;
    }

    if (activeTab === 'siswa') {
      const kelasSlug = filterKelas ? sanitizeFilePart(filterKelas) : 'Semua_Kelas';
      const filterDesc = `Kelas: ${filterKelas || 'Semua'}, Status: ${filterStatus || 'Semua'}, Sumber: ${filterSumber || 'Semua'}`;
      XLSX.utils.book_append_sheet(wb, buildSiswaSheet(filterDesc), 'Daftar Siswa');
      const fileName = `Laporan_Siswa_MBG_${kelasSlug}_${formattedDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      notify.success('Ekspor Excel Berhasil', `File ${fileName} telah diunduh.`);
      return;
    }

    if (activeTab === 'kelas') {
      XLSX.utils.book_append_sheet(wb, buildKelasSheet(`Tanggal ${formattedDate}`), 'Rekap Kelas');
      const fileName = `Laporan_Rekap_Kelas_MBG_${formattedDate}.xlsx`;
      XLSX.writeFile(wb, fileName);
      notify.success('Ekspor Excel Berhasil', `File ${fileName} telah diunduh.`);
      return;
    }

    // Tab Kejadian Khusus
    const filterSlug = sanitizeFilePart(
      `${filterIncDateRange}_${filterIncKategori || 'Semua'}_${filterIncStatus || 'Semua'}`
    );
    const incFilterDesc = `Rentang: ${filterIncDateRange}, Kategori: ${filterIncKategori || 'Semua'}, Keparahan: ${filterIncSeverity || 'Semua'}, Status: ${filterIncStatus || 'Semua'}`;
    XLSX.utils.book_append_sheet(
      wb,
      buildKejadianSheet(filteredIncidents, incFilterDesc),
      'Kejadian Khusus'
    );
    const fileName = `Laporan_Kejadian_Khusus_MBG_${filterSlug}_${formattedDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
    notify.success('Ekspor Excel Berhasil', `File ${fileName} telah diunduh.`);
  };

  // Export to CSV (Tab-Aware + UTF-8 BOM)
  const downloadCSV = (csvOutput: string, fileName: string) => {
    const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (loading) {
      notify.warning('Data laporan masih dimuat, mohon tunggu sebentar.', 'Data Belum Siap');
      return;
    }

    const formattedDate = formatDateDDMMYYYY(selectedDate);

    if (activeTab === 'harian') {
      const harianData = [
        { Parameter: 'Sekolah', Nilai: schoolInfo.nama_sekolah },
        { Parameter: 'NPSN', Nilai: schoolInfo.npsn },
        { Parameter: 'Tanggal Laporan', Nilai: formattedDate },
        {
          Parameter: 'Mitra SPPG',
          Nilai: distribusi?.nama_sppg_aktual || schoolInfo.nama_sppg_mitra || 'SPPG Mitra Bergizi',
        },
        {
          Parameter: 'Waktu Kedatangan MBG',
          Nilai: distribusi?.waktu_kedatangan ? `${formatWIBTime(distribusi.waktu_kedatangan)} WIB` : 'Belum Tercatat',
        },
        { Parameter: 'Total Siswa Terdaftar', Nilai: totalSiswaSekolah },
        { Parameter: 'Porsi Diterima', Nilai: totalDiterima },
        { Parameter: 'Porsi Belum Tercatat', Nilai: totalBelum },
        { Parameter: 'Tidak Hadir / Tidak Mengambil', Nilai: tidakHadir.length + tidakMengambil.length },
        { Parameter: 'Persentase Penyerapan (%)', Nilai: `${persentase}%` },
        {
          Parameter: 'Kejadian Khusus Tanggal Ini',
          Nilai: incidentsForSelectedDate.length,
        },
      ];
      const ws = XLSX.utils.json_to_sheet(harianData);
      const fileName = `Laporan_Harian_MBG_${formattedDate}.csv`;
      downloadCSV(XLSX.utils.sheet_to_csv(ws), fileName);
      notify.success('Ekspor CSV Berhasil', `File ${fileName} telah diunduh.`);
      return;
    }

    if (activeTab === 'kelas') {
      const kelasData = kelasList.map((k: any, i) => {
        const total = k.total_siswa_dapodik || k.siswa?.length || 0;
        const sudah =
          typeof k.jumlah_hadir === 'number'
            ? k.jumlah_hadir
            : validDiterima.filter((r) => r.kelas === k.nama_kelas).length;
        const belum =
          typeof k.jumlah_absen === 'number'
            ? k.jumlah_absen
            : Math.max(0, total - sudah);
        return {
          No: i + 1,
          'Nama Kelas': k.nama_kelas,
          Tingkat: k.tingkat || '-',
          Jurusan: k.jurusan || '-',
          'Total Kuota': total,
          'Sudah Menerima': sudah,
          'Sisa / Belum': belum,
          'Penyerapan (%)': total > 0 ? `${Math.round((sudah / total) * 100)}%` : '0%',
        };
      });
      const ws = XLSX.utils.json_to_sheet(kelasData);
      const fileName = `Laporan_Kelas_MBG_${formattedDate}.csv`;
      downloadCSV(XLSX.utils.sheet_to_csv(ws), fileName);
      notify.success('Ekspor CSV Berhasil', `File ${fileName} telah diunduh.`);
      return;
    }

    if (activeTab === 'kejadian') {
      const dataToExport = filteredIncidents.map((inc, i) => ({
        No: i + 1,
        Tanggal: formatDateDDMMYYYY(inc.tanggal),
        Waktu: `${inc.waktu_kejadian.slice(0, 5)} WIB`,
        Kategori: inc.kategori,
        Keparahan: inc.tingkat_keparahan,
        Judul: inc.judul_kejadian,
        Deskripsi: inc.deskripsi,
        TindakLanjut: inc.tindak_lanjut || '',
        Pelapor: inc.nama_petugas_pelapor || '',
        Status: inc.status_penyelesaian,
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const fileName = `Laporan_Kejadian_Khusus_${formattedDate}.csv`;
      downloadCSV(XLSX.utils.sheet_to_csv(ws), fileName);
      notify.success('Ekspor CSV Berhasil', `File ${fileName} telah diunduh.`);
      return;
    }

    // Tab Siswa
    const dataToExport = filteredReceipts.map((r, i) => {
      const row: Record<string, any> = {
        No: i + 1,
        Tanggal: formattedDate,
        Nama: r.nama_siswa,
      };

      if (showNISN) {
        row['NISN'] = r.nisn || '';
      }

      row['Kelas'] = r.kelas;
      row['Jurusan'] = r.jurusan;
      row['Status'] = r.status_penerimaan;
      row['Waktu'] = r.waktu_penerimaan ? formatWIBTime(r.waktu_penerimaan) : '';
      row['Sumber'] = r.sumber_pencatatan;
      row['Petugas'] = r.petugas?.nama || '';

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const fileName = `Laporan_Siswa_MBG_${formattedDate}.csv`;
    downloadCSV(XLSX.utils.sheet_to_csv(ws), fileName);
    notify.success('Ekspor CSV Berhasil', `File ${fileName} telah diunduh.`);
  };

  // Print PDF
  const handlePrint = () => {
    if (loading) {
      notify.warning('Data laporan masih dimuat sebelum mencetak.', 'Tunggu Sebentar');
      return;
    }
    window.print();
  };

  return (
    <ProtectedRoute allowedRoles={['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru']}>
      <div className="no-print space-y-6 pb-12">
        {/* Top Header & Export Controls */}
        <div>
          <PageHeader
            title="Laporan Distribusi MBG"
            subtitle="Rekap harian, per siswa, per kelas, serta ekspor format Excel, CSV, dan cetak PDF."
            badgeText="LAPORAN & REKAPITULASI"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleExportExcel}
                leftIcon={<Download className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Export Excel (Tab Ini)
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleExportCSV}
              >
                Export CSV (Tab Ini)
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Cetak PDF (Tab Ini)
              </Button>
            </div>
          </PageHeader>
        </div>

      {/* Filter Tanggal & Tab Nav (Hidden on Print) */}
      <div className="no-print micro-card rounded-2xl p-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="w-full md:w-72">
          <DatePicker
            label="Pilih Tanggal Laporan"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            showFormattedBadge={false}
          />
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('harian')}
            className={`micro-tap min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'harian'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Harian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('siswa')}
            className={`micro-tap min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'siswa'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Per Siswa ({receipts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kelas')}
            className={`micro-tap min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'kelas'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Laporan Per Kelas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('kejadian')}
            className={`micro-tap min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition shrink-0 ${
              activeTab === 'kejadian'
                ? 'bg-white text-brand-navy shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kejadian Khusus ({filteredIncidents.length})
          </button>
        </div>
      </div>

      {/* TAB 1: LAPORAN HARIAN (PRD 9.1) */}
      {activeTab === 'harian' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="micro-card rounded-2xl p-5">
              <div className="text-xs font-bold uppercase text-slate-500">Total Siswa Terdaftar</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalSiswaSekolah}</div>
            </div>
            <div className="micro-card rounded-2xl p-5">
              <div className="text-xs font-bold uppercase text-emerald-700">Sudah Menerima</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {totalDiterima} ({persentase}%)
              </div>
            </div>
            <div className="micro-card rounded-2xl p-5">
              <div className="text-xs font-bold uppercase text-amber-700">Belum Tercatat</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{totalBelum}</div>
            </div>
            <div className="micro-card rounded-2xl p-5">
              <div className="text-xs font-bold uppercase text-red-700">Tidak Hadir / Mengambil</div>
              <div className="text-2xl font-black text-red-600 mt-1">
                {tidakHadir.length + tidakMengambil.length}
              </div>
            </div>
          </div>

          <div className="micro-card rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">
                Waktu Kedatangan MBG
              </span>
              <span className="font-mono font-bold text-sm text-slate-800">
                {formatWIBTime(distribusi?.waktu_kedatangan)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">
                Konfirmasi Pertama
              </span>
              <span className="font-mono font-bold text-sm text-emerald-700">
                {formatWIBTime(waktuPertama)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase font-bold text-[10px]">
                Konfirmasi Terakhir
              </span>
              <span className="font-mono font-bold text-sm text-blue-700">
                {formatWIBTime(waktuTerakhir)}
              </span>
            </div>
          </div>

          {/* VISUALISASI ANALITIK LAPORAN MBG */}
          <LaporanCharts
            kelasList={kelasList}
            distribusi={distribusi}
            selectedDate={selectedDate}
            totalSiswaSekolah={totalSiswaSekolah}
            totalDiterima={totalDiterima}
            totalBelum={totalBelum}
            persentaseSekolah={Number(persentase) || 0}
          />

          {/* Bagian C: Ringkasan Kejadian Khusus Hari Ini */}
          <div className="micro-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Bagian C: Catatan Kejadian Khusus MBG
                </h3>
                <p className="text-xs text-slate-500">
                  Rekapitulasi insiden dan kendala operasional pada {formatDateDDMMYYYY(selectedDate)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('kejadian')}
                className="micro-tap text-xs font-bold text-brand-navy hover:underline"
              >
                Buka Log Lengkap ({incidentsForSelectedDate.length}) →
              </button>
            </div>

            {incidentsForSelectedDate.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center">
                Nihil / Tidak ada catatan kejadian khusus pada tanggal ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {incidentsForSelectedDate.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {inc.waktu_kejadian.slice(0, 5)} WIB
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {inc.kategori.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            inc.tingkat_keparahan === 'kritis'
                              ? 'bg-red-100 text-red-800'
                              : inc.tingkat_keparahan === 'tinggi'
                              ? 'bg-orange-100 text-orange-800'
                              : inc.tingkat_keparahan === 'sedang'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {inc.tingkat_keparahan}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-800">{inc.judul_kejadian}</div>
                      <div className="text-xs text-slate-600 line-clamp-2">{inc.deskripsi}</div>
                      {inc.tindak_lanjut && (
                        <div className="text-[11px] text-slate-500 italic">
                          Tindak Lanjut: {inc.tindak_lanjut}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          inc.status_penyelesaian === 'selesai'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : inc.status_penyelesaian === 'diproses'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {inc.status_penyelesaian === 'selesai'
                          ? 'Selesai'
                          : inc.status_penyelesaian === 'diproses'
                          ? 'Diproses'
                          : 'Menunggu'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bagian C: Print Only Table Form Harian MBG */}
          <div className="hidden print:block mt-8 pt-4 border-t border-slate-300">
            <h3 className="text-sm font-bold uppercase mb-2">Bagian C: Catatan Kejadian Khusus MBG</h3>
            {incidentsForSelectedDate.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                Nihil - Tidak ada kejadian khusus tercatat pada tanggal {formatDateDDMMYYYY(selectedDate)}.
              </p>
            ) : (
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 font-bold uppercase text-slate-700 border-b border-slate-300">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-300">Waktu</th>
                    <th className="py-2 px-3 border-r border-slate-300">Kategori</th>
                    <th className="py-2 px-3 border-r border-slate-300">Keparahan</th>
                    <th className="py-2 px-3 border-r border-slate-300">Judul & Keterangan</th>
                    <th className="py-2 px-3 border-r border-slate-300">Tindak Lanjut</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {incidentsForSelectedDate.map((inc) => (
                    <tr key={inc.id}>
                      <td className="py-2 px-3 font-mono border-r border-slate-300">
                        {inc.waktu_kejadian.slice(0, 5)} WIB
                      </td>
                      <td className="py-2 px-3 font-bold border-r border-slate-300 uppercase">
                        {inc.kategori.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300 uppercase font-semibold">
                        {inc.tingkat_keparahan}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300">
                        <span className="font-bold">{inc.judul_kejadian}:</span> {inc.deskripsi}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-300">
                        {inc.tindak_lanjut || '-'}
                      </td>
                      <td className="py-2 px-3 font-bold uppercase">{inc.status_penyelesaian}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LAPORAN PER SISWA (PRD 9.2) */}
      {activeTab === 'siswa' && (
        <div className="space-y-4">
          <div className="no-print micro-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              label="Cari Siswa"
              value={searchSiswa}
              onChange={(e) => setSearchSiswa(e.target.value)}
              placeholder="Cari nama atau NISN..."
              leftIcon={<Search className="w-4 h-4" />}
            />

            <Select
              label="Filter Kelas"
              value={filterKelas}
              onValueChange={(val) => setFilterKelas(val)}
              placeholder="Semua Kelas"
              options={[
                { value: '', label: 'Semua Kelas' },
                ...kelasList.map((k) => ({
                  value: k.nama_kelas,
                  label: k.nama_kelas,
                })),
              ]}
            />

            <Select
              label="Filter Status"
              value={filterStatus}
              onValueChange={(val) => setFilterStatus(val)}
              placeholder="Semua Status"
              options={[
                { value: '', label: 'Semua Status' },
                { value: 'diterima', label: 'Diterima' },
                { value: 'tidak_hadir', label: 'Tidak Hadir' },
                { value: 'tidak_mengambil', label: 'Tidak Mengambil' },
              ]}
            />

            <Select
              label="Filter Sumber"
              value={filterSumber}
              onValueChange={(val) => setFilterSumber(val)}
              placeholder="Semua Sumber"
              options={[
                { value: '', label: 'Semua Sumber' },
                { value: 'siswa', label: 'Scan Siswa' },
                { value: 'guru', label: 'Input Guru' },
              ]}
            />
          </div>

          {/* Table Transaksi Per Siswa */}
          <div className="micro-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold uppercase">
              <span>Total Catatan: {filteredReceipts.length} Transaksi</span>
            </div>

            {filteredReceipts.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                Tidak ada data penerimaan pada tanggal dan filter ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">No</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      {showNISN && <th className="py-3 px-4">NISN</th>}
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
                        <td className="py-3 px-4 font-mono text-slate-500">{i + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{r.nama_siswa}</td>
                        {showNISN && <td className="py-3 px-4 font-mono text-slate-600">{r.nisn || '-'}</td>}
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
            <FeedbackBanner
              type="success"
              message={correctionFeedback}
              onDismiss={() => setCorrectionFeedback(null)}
            />
          )}

          <div className="micro-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
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
                              className="micro-tap inline-flex items-center gap-1 min-h-[36px] px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition"
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

      {/* TAB 4: LOG REKAP KEJADIAN KHUSUS (PRD 9.3) */}
      {activeTab === 'kejadian' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="micro-card rounded-2xl p-5">
              <div className="text-xs font-bold uppercase text-slate-500">Total Kejadian Khusus</div>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {filteredIncidents.length}
              </div>
            </div>
            <div className="micro-card rounded-2xl p-5">
              <div className="text-xs font-bold uppercase text-emerald-700">Status Selesai</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {filteredIncidents.filter((i) => i.status_penyelesaian === 'selesai').length}
              </div>
            </div>
            <div className="micro-card rounded-2xl p-5">
              <div className="text-xs font-bold uppercase text-blue-700">Sedang Diproses</div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                {filteredIncidents.filter((i) => i.status_penyelesaian === 'diproses').length}
              </div>
            </div>
            <div className="micro-card rounded-2xl p-5">
              <div className="text-xs font-bold uppercase text-amber-700">Menunggu Tindak Lanjut</div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {filteredIncidents.filter((i) => i.status_penyelesaian === 'menunggu').length}
              </div>
            </div>
          </div>

          {/* Filter Bar (no-print) */}
          <div className="no-print micro-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Input
              label="Cari Kejadian"
              value={searchIncident}
              onChange={(e) => setSearchIncident(e.target.value)}
              placeholder="Cari judul, rincian, pelapor..."
              leftIcon={<Search className="w-4 h-4" />}
            />

            <Select
              label="Rentang Waktu"
              value={filterIncDateRange}
              onValueChange={(val: any) => setFilterIncDateRange(val)}
              placeholder="Semua Riwayat"
              options={[
                { value: 'all', label: 'Semua Riwayat' },
                { value: 'selected', label: `Tanggal Terpilih (${formatDateDDMMYYYY(selectedDate)})` },
                { value: '7days', label: '7 Hari Terakhir' },
                { value: 'month', label: 'Bulan Ini' },
              ]}
            />

            <Select
              label="Filter Kategori"
              value={filterIncKategori}
              onValueChange={(val) => setFilterIncKategori(val)}
              placeholder="Semua Kategori"
              options={[
                { value: 'semua', label: 'Semua Kategori' },
                { value: 'keterlambatan', label: 'Keterlambatan' },
                { value: 'kualitas_makanan', label: 'Kualitas Makanan' },
                { value: 'kemasan_rusak', label: 'Kemasan Rusak' },
                { value: 'alergi_siswa', label: 'Alergi Siswa' },
                { value: 'lainnya', label: 'Lainnya' },
              ]}
            />

            <Select
              label="Tingkat Keparahan"
              value={filterIncSeverity}
              onValueChange={(val) => setFilterIncSeverity(val)}
              placeholder="Semua Keparahan"
              options={[
                { value: 'semua', label: 'Semua Keparahan' },
                { value: 'rendah', label: 'Rendah' },
                { value: 'sedang', label: 'Sedang' },
                { value: 'tinggi', label: 'Tinggi' },
                { value: 'kritis', label: 'Kritis' },
              ]}
            />

            <Select
              label="Status Penyelesaian"
              value={filterIncStatus}
              onValueChange={(val) => setFilterIncStatus(val)}
              placeholder="Semua Status"
              options={[
                { value: 'semua', label: 'Semua Status' },
                { value: 'menunggu', label: 'Menunggu' },
                { value: 'diproses', label: 'Diproses' },
                { value: 'selesai', label: 'Selesai' },
              ]}
            />
          </div>

          {/* Table / List View */}
          <div className="micro-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 font-semibold uppercase">
              <span>Menampilkan: {filteredIncidents.length} Catatan Kejadian Khusus</span>
              {(searchIncident || (filterIncKategori && filterIncKategori !== 'semua') || (filterIncSeverity && filterIncSeverity !== 'semua') || (filterIncStatus && filterIncStatus !== 'semua') || filterIncDateRange !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchIncident('');
                    setFilterIncKategori('');
                    setFilterIncSeverity('');
                    setFilterIncStatus('');
                    setFilterIncDateRange('all');
                  }}
                  className="micro-tap text-brand-navy hover:underline lowercase font-medium"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {filteredIncidents.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold">Tidak ada catatan kejadian khusus</p>
                <p className="text-xs text-slate-400">
                  Tidak ditemukan kejadian khusus yang sesuai dengan parameter filter di atas.
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">Tanggal & Waktu</th>
                        <th className="py-3 px-4">Kategori & Keparahan</th>
                        <th className="py-3 px-4">Judul & Rincian Deskripsi</th>
                        <th className="py-3 px-4">Tindak Lanjut</th>
                        <th className="py-3 px-4">Pelapor</th>
                        <th className="py-3 px-4 text-center">Status (Klik Ubah)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredIncidents.map((inc, i) => {
                        const severityBadge =
                          inc.tingkat_keparahan === 'kritis'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : inc.tingkat_keparahan === 'tinggi'
                            ? 'bg-orange-50 text-orange-800 border-orange-200'
                            : inc.tingkat_keparahan === 'sedang'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200';

                        const statusStyle =
                          inc.status_penyelesaian === 'selesai'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : inc.status_penyelesaian === 'diproses'
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            : 'bg-amber-100 text-amber-800 hover:bg-amber-200';

                        return (
                          <tr key={inc.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3 px-4 font-mono text-slate-500">{i + 1}</td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="font-bold text-slate-800">
                                {formatDateDDMMYYYY(inc.tanggal)}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500">
                                {inc.waktu_kejadian.slice(0, 5)} WIB
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap space-y-1">
                              <span className="inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                                {inc.kategori.replace(/_/g, ' ')}
                              </span>
                              <div>
                                <span
                                  className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${severityBadge}`}
                                >
                                  {inc.tingkat_keparahan}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-bold text-slate-900">{inc.judul_kejadian}</div>
                              <div className="text-slate-600 text-xs mt-0.5 line-clamp-2">
                                {inc.deskripsi}
                              </div>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <div className="text-slate-700 text-xs">
                                {inc.tindak_lanjut || '-'}
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                              {inc.nama_petugas_pelapor || '-'}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleToggleIncidentStatus(inc)}
                                title="Klik untuk memajukan status penyelesaian"
                                className={`micro-tap inline-flex items-center gap-1 min-h-[32px] px-3 py-1 rounded-full text-xs font-bold transition ${statusStyle}`}
                              >
                                {inc.status_penyelesaian === 'selesai' && (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                {inc.status_penyelesaian === 'diproses' && (
                                  <RotateCw className="w-3.5 h-3.5" />
                                )}
                                {inc.status_penyelesaian === 'menunggu' && (
                                  <Clock className="w-3.5 h-3.5" />
                                )}
                                <span className="capitalize">{inc.status_penyelesaian}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredIncidents.map((inc) => {
                    const severityBadge =
                      inc.tingkat_keparahan === 'kritis'
                        ? 'bg-red-50 text-red-800 border-red-200'
                        : inc.tingkat_keparahan === 'tinggi'
                        ? 'bg-orange-50 text-orange-800 border-orange-200'
                        : inc.tingkat_keparahan === 'sedang'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200';

                    const statusStyle =
                      inc.status_penyelesaian === 'selesai'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inc.status_penyelesaian === 'diproses'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800';

                    return (
                      <div key={inc.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-800">
                              {formatDateDDMMYYYY(inc.tanggal)}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {inc.waktu_kejadian.slice(0, 5)} WIB
                            </span>
                            <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                              {inc.kategori.replace(/_/g, ' ')}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${severityBadge}`}
                            >
                              {inc.tingkat_keparahan}
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-bold text-slate-900">
                            {inc.judul_kejadian}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{inc.deskripsi}</p>
                        </div>

                        {inc.tindak_lanjut && (
                          <div className="rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-200 text-slate-700">
                            <span className="font-bold block text-[10px] uppercase text-slate-500">
                              Tindak Lanjut:
                            </span>
                            {inc.tindak_lanjut}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                          <span>Pelapor: {inc.nama_petugas_pelapor || '-'}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleIncidentStatus(inc)}
                            className={`micro-tap min-h-[44px] px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 ${statusStyle}`}
                          >
                            <span className="capitalize">{inc.status_penyelesaian}</span>
                            <span className="text-[10px] font-normal text-slate-500">(Ganti)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
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
                notify.success('Koreksi Disimpan', res.message);
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

      {/* Dedicated Formal Print Sheet (Hidden on Screen, Visible on Print) */}
      <PrintReportDocument
        activeTab={activeTab}
        selectedDate={selectedDate}
        distribusi={distribusi}
        schoolInfo={schoolInfo}
        kelasList={kelasList}
        receipts={receipts}
        filteredReceipts={filteredReceipts}
        filteredIncidents={filteredIncidents}
        incidentsForSelectedDate={incidentsForSelectedDate}
        totalStats={{
          totalSiswaSekolah,
          totalDiterima,
          totalBelum,
          totalAbsenAtauTidakAmbil: tidakHadir.length + tidakMengambil.length,
          persentase,
          waktuPertama,
          waktuTerakhir,
        }}
        filtersApplied={{
          searchSiswa,
          filterKelas,
          filterStatus,
          filterSumber,
          searchIncident,
          filterIncKategori,
          filterIncSeverity,
          filterIncStatus,
          filterIncDateRange,
        }}
        showNISN={showNISN}
        petugasNama={user?.nama}
      />
    </ProtectedRoute>
  );
}
