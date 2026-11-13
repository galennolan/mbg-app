'use client';

import React from 'react';
import { DistribusiMBG, IncidentReport, School } from '@/lib/types';
import { formatDateDDMMYYYY, formatIndonesianDate, formatWIBTime } from '@/lib/utils';

export type LaporanTab = 'harian' | 'siswa' | 'kelas' | 'kejadian';

export interface PrintReportTotalStats {
  totalSiswaSekolah: number;
  totalDiterima: number;
  totalBelum: number;
  totalAbsenAtauTidakAmbil: number;
  persentase: string;
  waktuPertama: string | null;
  waktuTerakhir: string | null;
}

export interface PrintReportFiltersApplied {
  searchSiswa?: string;
  filterKelas?: string;
  filterStatus?: string;
  filterSumber?: string;
  searchIncident?: string;
  filterIncKategori?: string;
  filterIncSeverity?: string;
  filterIncStatus?: string;
  filterIncDateRange?: string;
}

export interface PrintReportDocumentProps {
  activeTab: LaporanTab;
  selectedDate: string;
  distribusi: DistribusiMBG | null;
  schoolInfo: School;
  kelasList: any[];
  receipts: any[];
  filteredReceipts: any[];
  filteredIncidents: IncidentReport[];
  incidentsForSelectedDate: IncidentReport[];
  totalStats: PrintReportTotalStats;
  filtersApplied: PrintReportFiltersApplied;
  showNISN: boolean;
  petugasNama?: string;
}

function getStatusDistribusiLabel(status?: string): string {
  if (status === 'tiba') return 'Sudah Tiba / Sedang Berlangsung';
  if (status === 'ditutup') return 'Selesai / Ditutup';
  return 'Menunggu Kedatangan';
}

function getStatusPenerimaanLabel(status: string): string {
  if (status === 'diterima') return 'Diterima';
  if (status === 'tidak_mengambil') return 'Tidak Mengambil';
  return 'Tidak Hadir';
}

function formatDateRangeLabel(range?: string, selectedDate?: string): string {
  if (range === 'selected') return `Tanggal ${formatDateDDMMYYYY(selectedDate || '')}`;
  if (range === '7days') return '7 Hari Terakhir';
  if (range === 'month') return 'Bulan Berjalan';
  return 'Semua Periode';
}

function PrintKopHeader({
  schoolInfo,
  selectedDate,
  documentTitle,
}: {
  schoolInfo: School;
  selectedDate: string;
  documentTitle: string;
}) {
  return (
    <header className="mb-4">
      <div className="text-center pb-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-black">
          PROGRAM MAKAN BERGIZI GRATIS (MBG)
        </p>
        <h1 className="text-base font-bold uppercase tracking-wide text-black mt-0.5">
          {schoolInfo.nama_sekolah}
        </h1>
        <p className="text-[11px] text-black mt-0.5">
          NPSN: {schoolInfo.npsn} • Mitra Penyedia: {schoolInfo.nama_sppg_mitra || 'SPPG Mitra Bergizi'}
        </p>
      </div>
      <div className="border-t-2 border-black pt-[2px]">
        <div className="border-t border-black" />
      </div>
      <div className="text-center mt-3 mb-2">
        <h2 className="text-sm font-bold uppercase underline underline-offset-4 text-black">
          {documentTitle}
        </h2>
        <p className="text-[11px] text-black mt-1">
          Tanggal Laporan: {formatIndonesianDate(selectedDate)} ({formatDateDDMMYYYY(selectedDate)})
        </p>
      </div>
    </header>
  );
}

function PrintExecutionIdentity({
  selectedDate,
  distribusi,
  schoolInfo,
}: {
  selectedDate: string;
  distribusi: DistribusiMBG | null;
  schoolInfo: School;
}) {
  const sppgName =
    distribusi?.nama_sppg_aktual || schoolInfo.nama_sppg_mitra || 'SPPG Mitra Bergizi';
  const waktuTiba = distribusi?.waktu_kedatangan
    ? `${formatWIBTime(distribusi.waktu_kedatangan)} WIB`
    : 'Belum Tercatat';

  return (
    <table className="w-full text-[11px] border-collapse border border-black mb-4 print-avoid-break">
      <tbody>
        <tr>
          <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-100 w-1/4">
            Hari / Tanggal
          </td>
          <td className="border border-black px-2.5 py-1.5 w-1/4">
            {formatIndonesianDate(selectedDate)}
          </td>
          <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-100 w-1/4">
            Mitra Penyedia (SPPG)
          </td>
          <td className="border border-black px-2.5 py-1.5 w-1/4">{sppgName}</td>
        </tr>
        <tr>
          <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-100">
            Waktu Kedatangan MBG
          </td>
          <td className="border border-black px-2.5 py-1.5">{waktuTiba}</td>
          <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-100">
            Status Pelaksanaan / QC
          </td>
          <td className="border border-black px-2.5 py-1.5">
            {getStatusDistribusiLabel(distribusi?.status)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function PrintSignatureBlock({
  selectedDate,
  schoolInfo,
  petugasNama,
  rightTitle = 'Guru Piket / Koordinator MBG',
}: {
  selectedDate: string;
  schoolInfo: School;
  petugasNama?: string;
  rightTitle?: string;
}) {
  return (
    <footer className="mt-8 pt-2 print-avoid-break text-[11px] text-black">
      <div className="grid grid-cols-2 gap-8">
        <div className="text-center">
          <p>Mengetahui,</p>
          <p className="font-bold">Kepala Sekolah</p>
          <div className="h-16" />
          <p className="font-bold underline underline-offset-2">
            {schoolInfo.nama_kepala_sekolah || '........................................'}
          </p>
          <p>NIP. {schoolInfo.nip_kepala_sekolah || '................................'}</p>
        </div>

        <div className="text-center">
          <p>Dicetak pada {formatDateDDMMYYYY(selectedDate)}</p>
          <p className="font-bold">{rightTitle}</p>
          <div className="h-16" />
          <p className="font-bold underline underline-offset-2">
            {petugasNama || '........................................'}
          </p>
          <p>Petugas Pelaksana MBG</p>
        </div>
      </div>
    </footer>
  );
}

function PrintHarianTemplate({
  selectedDate,
  distribusi,
  schoolInfo,
  kelasList,
  receipts,
  incidentsForSelectedDate,
  totalStats,
  petugasNama,
}: PrintReportDocumentProps) {
  const validDiterima = receipts.filter((r) => r.status_penerimaan === 'diterima');

  return (
    <div>
      <PrintKopHeader
        schoolInfo={schoolInfo}
        selectedDate={selectedDate}
        documentTitle="FORMULIR LAPORAN HARIAN PELAKSANAAN MBG"
      />
      <PrintExecutionIdentity
        selectedDate={selectedDate}
        distribusi={distribusi}
        schoolInfo={schoolInfo}
      />

      {/* Ringkasan Kuota */}
      <table className="w-full text-[11px] border-collapse border border-black mb-4 print-avoid-break">
        <thead className="print-table-header bg-gray-200">
          <tr>
            <th className="border border-black px-2.5 py-1.5 text-center">Total Siswa Terdaftar</th>
            <th className="border border-black px-2.5 py-1.5 text-center">Porsi Diterima</th>
            <th className="border border-black px-2.5 py-1.5 text-center">Porsi Belum Tercatat</th>
            <th className="border border-black px-2.5 py-1.5 text-center">Tidak Hadir / Ambil</th>
            <th className="border border-black px-2.5 py-1.5 text-center">Persentase Serapan</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center font-bold">
            <td className="border border-black px-2.5 py-2">{totalStats.totalSiswaSekolah}</td>
            <td className="border border-black px-2.5 py-2">{totalStats.totalDiterima}</td>
            <td className="border border-black px-2.5 py-2">{totalStats.totalBelum}</td>
            <td className="border border-black px-2.5 py-2">{totalStats.totalAbsenAtauTidakAmbil}</td>
            <td className="border border-black px-2.5 py-2">{totalStats.persentase}%</td>
          </tr>
        </tbody>
      </table>

      {/* Bagian A */}
      <section className="mb-4 print-avoid-break">
        <h3 className="text-xs font-bold uppercase mb-1.5">
          A. Kedatangan SPPG &amp; Rentang Waktu Distribusi
        </h3>
        <table className="w-full text-[11px] border-collapse border border-black">
          <tbody>
            <tr>
              <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-100 w-1/3">
                Penerimaan Siswa Pertama
              </td>
              <td className="border border-black px-2.5 py-1.5">
                {totalStats.waktuPertama ? `${formatWIBTime(totalStats.waktuPertama)} WIB` : '-'}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-100">
                Penerimaan Siswa Terakhir
              </td>
              <td className="border border-black px-2.5 py-1.5">
                {totalStats.waktuTerakhir ? `${formatWIBTime(totalStats.waktuTerakhir)} WIB` : '-'}
              </td>
            </tr>
            <tr>
              <td className="border border-black px-2.5 py-1.5 font-bold bg-gray-100">
                Catatan Kedatangan / Organoleptik
              </td>
              <td className="border border-black px-2.5 py-1.5">
                {distribusi?.keterangan || 'Kondisi paket makanan baik dan sesuai standar kelayakan.'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Bagian B */}
      <section className="mb-4">
        <h3 className="text-xs font-bold uppercase mb-1.5">
          B. Rekapitulasi Penerimaan Per Rombel Kelas
        </h3>
        <table className="w-full text-[11px] border-collapse border border-black">
          <thead className="print-table-header bg-gray-200">
            <tr>
              <th className="border border-black px-2 py-1.5 text-center w-8">No</th>
              <th className="border border-black px-2 py-1.5 text-left">Nama Kelas</th>
              <th className="border border-black px-2 py-1.5 text-left">Jurusan</th>
              <th className="border border-black px-2 py-1.5 text-right">Kuota</th>
              <th className="border border-black px-2 py-1.5 text-right">Diterima</th>
              <th className="border border-black px-2 py-1.5 text-right">Sisa</th>
              <th className="border border-black px-2 py-1.5 text-center">Serapan</th>
              <th className="border border-black px-2 py-1.5 text-center">Status Wadah</th>
            </tr>
          </thead>
          <tbody>
            {kelasList.map((k: any, idx: number) => {
              const total = k.total_siswa_dapodik || k.siswa?.length || 0;
              const sudah =
                typeof k.jumlah_hadir === 'number'
                  ? k.jumlah_hadir
                  : validDiterima.filter((r) => r.kelas === k.nama_kelas).length;
              const belum =
                typeof k.jumlah_absen === 'number' ? k.jumlah_absen : Math.max(0, total - sudah);
              const pct = total > 0 ? Math.round((sudah / total) * 100) : 0;
              const statusWadah =
                sudah >= total && total > 0 ? 'Tuntas' : sudah > 0 ? 'Sebagian' : 'Belum';

              return (
                <tr key={k.id || k.nama_kelas}>
                  <td className="border border-black px-2 py-1 text-center">{idx + 1}</td>
                  <td className="border border-black px-2 py-1 font-bold">{k.nama_kelas}</td>
                  <td className="border border-black px-2 py-1">{k.jurusan || '-'}</td>
                  <td className="border border-black px-2 py-1 text-right">{total}</td>
                  <td className="border border-black px-2 py-1 text-right font-bold">{sudah}</td>
                  <td className="border border-black px-2 py-1 text-right">{belum}</td>
                  <td className="border border-black px-2 py-1 text-center">{pct}%</td>
                  <td className="border border-black px-2 py-1 text-center">{statusWadah}</td>
                </tr>
              );
            })}
            <tr className="bg-gray-100 font-bold">
              <td colSpan={3} className="border border-black px-2 py-1.5 text-right uppercase">
                Total Keseluruhan
              </td>
              <td className="border border-black px-2 py-1.5 text-right">
                {totalStats.totalSiswaSekolah}
              </td>
              <td className="border border-black px-2 py-1.5 text-right">
                {totalStats.totalDiterima}
              </td>
              <td className="border border-black px-2 py-1.5 text-right">
                {totalStats.totalBelum}
              </td>
              <td className="border border-black px-2 py-1.5 text-center">
                {totalStats.persentase}%
              </td>
              <td className="border border-black px-2 py-1.5 text-center">-</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Bagian C */}
      <section className="mb-4 print-avoid-break">
        <h3 className="text-xs font-bold uppercase mb-1.5">
          C. Catatan Kejadian Khusus MBG ({formatDateDDMMYYYY(selectedDate)})
        </h3>
        {incidentsForSelectedDate.length === 0 ? (
          <div className="border border-black px-3 py-2 text-[11px]">
            Status: <strong>NIHIL</strong> — Tidak terdapat laporan kejadian khusus pada tanggal ini.
          </div>
        ) : (
          <table className="w-full text-[11px] border-collapse border border-black">
            <thead className="print-table-header bg-gray-200">
              <tr>
                <th className="border border-black px-2 py-1.5 text-center w-8">No</th>
                <th className="border border-black px-2 py-1.5 text-center w-16">Jam</th>
                <th className="border border-black px-2 py-1.5 text-left">Kategori &amp; Keparahan</th>
                <th className="border border-black px-2 py-1.5 text-left">Judul &amp; Deskripsi</th>
                <th className="border border-black px-2 py-1.5 text-left">Tindak Lanjut</th>
                <th className="border border-black px-2 py-1.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {incidentsForSelectedDate.map((inc, idx) => (
                <tr key={inc.id}>
                  <td className="border border-black px-2 py-1 text-center">{idx + 1}</td>
                  <td className="border border-black px-2 py-1 text-center">
                    {inc.waktu_kejadian.slice(0, 5)}
                  </td>
                  <td className="border border-black px-2 py-1 uppercase">
                    {inc.kategori.replace(/_/g, ' ')} ({inc.tingkat_keparahan})
                  </td>
                  <td className="border border-black px-2 py-1">
                    <strong>{inc.judul_kejadian}</strong>: {inc.deskripsi}
                  </td>
                  <td className="border border-black px-2 py-1">{inc.tindak_lanjut || '-'}</td>
                  <td className="border border-black px-2 py-1 text-center uppercase">
                    {inc.status_penyelesaian}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <PrintSignatureBlock
        selectedDate={selectedDate}
        schoolInfo={schoolInfo}
        petugasNama={petugasNama}
      />
    </div>
  );
}

function PrintSiswaTemplate({
  selectedDate,
  distribusi,
  schoolInfo,
  filteredReceipts,
  filtersApplied,
  showNISN,
  petugasNama,
}: PrintReportDocumentProps) {
  const diterimaCount = filteredReceipts.filter((r) => r.status_penerimaan === 'diterima').length;
  const belumCount = filteredReceipts.length - diterimaCount;

  const filterSummary = [
    `Kelas: ${filtersApplied.filterKelas || 'Semua Kelas'}`,
    `Status: ${filtersApplied.filterStatus ? getStatusPenerimaanLabel(filtersApplied.filterStatus) : 'Semua Status'}`,
    `Sumber: ${filtersApplied.filterSumber ? filtersApplied.filterSumber.toUpperCase() : 'Semua Sumber'}`,
    filtersApplied.searchSiswa ? `Pencarian: "${filtersApplied.searchSiswa}"` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <div>
      <PrintKopHeader
        schoolInfo={schoolInfo}
        selectedDate={selectedDate}
        documentTitle="DAFTAR PENERIMAAN MAKAN BERGIZI GRATIS (MBG) TINGKAT SISWA"
      />
      <PrintExecutionIdentity
        selectedDate={selectedDate}
        distribusi={distribusi}
        schoolInfo={schoolInfo}
      />

      <p className="text-[11px] mb-2">
        <strong>Filter Aktif:</strong> {filterSummary}
      </p>

      <table className="w-full text-[10.5px] border-collapse border border-black mb-3">
        <thead className="print-table-header bg-gray-200">
          <tr>
            <th className="border border-black px-1.5 py-1.5 text-center w-8">No</th>
            <th className="border border-black px-2 py-1.5 text-left">Nama Lengkap Siswa</th>
            {showNISN && <th className="border border-black px-2 py-1.5 text-left">NISN</th>}
            <th className="border border-black px-2 py-1.5 text-left">Kelas</th>
            <th className="border border-black px-2 py-1.5 text-left">Jurusan</th>
            <th className="border border-black px-2 py-1.5 text-center">Status</th>
            <th className="border border-black px-2 py-1.5 text-center">Waktu (WIB)</th>
            <th className="border border-black px-2 py-1.5 text-center">Sumber</th>
            <th className="border border-black px-2 py-1.5 text-left">Petugas</th>
          </tr>
        </thead>
        <tbody>
          {filteredReceipts.length === 0 ? (
            <tr>
              <td
                colSpan={showNISN ? 9 : 8}
                className="border border-black px-3 py-4 text-center italic"
              >
                Tidak ada data siswa yang sesuai dengan filter aktif.
              </td>
            </tr>
          ) : (
            filteredReceipts.map((r, idx) => (
              <tr key={r.id || idx}>
                <td className="border border-black px-1.5 py-1 text-center">{idx + 1}</td>
                <td className="border border-black px-2 py-1 font-medium">{r.nama_siswa}</td>
                {showNISN && (
                  <td className="border border-black px-2 py-1 font-mono">{r.nisn || '-'}</td>
                )}
                <td className="border border-black px-2 py-1">{r.kelas}</td>
                <td className="border border-black px-2 py-1">{r.jurusan || '-'}</td>
                <td className="border border-black px-2 py-1 text-center">
                  {getStatusPenerimaanLabel(r.status_penerimaan)}
                </td>
                <td className="border border-black px-2 py-1 text-center font-mono">
                  {r.waktu_penerimaan ? formatWIBTime(r.waktu_penerimaan) : '-'}
                </td>
                <td className="border border-black px-2 py-1 text-center">
                  {r.sumber_pencatatan === 'siswa' ? 'Scan Mandiri' : 'Guru Piket'}
                </td>
                <td className="border border-black px-2 py-1">{r.petugas?.nama || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <table className="w-full text-[11px] border-collapse border border-black print-avoid-break">
        <tbody>
          <tr className="bg-gray-100 font-bold">
            <td className="border border-black px-2.5 py-1.5">
              Total Data Tercetak: {filteredReceipts.length} Siswa
            </td>
            <td className="border border-black px-2.5 py-1.5">
              Sudah Menerima: {diterimaCount} Siswa
            </td>
            <td className="border border-black px-2.5 py-1.5">
              Absen / Belum Ambil: {belumCount} Siswa
            </td>
          </tr>
        </tbody>
      </table>

      <PrintSignatureBlock
        selectedDate={selectedDate}
        schoolInfo={schoolInfo}
        petugasNama={petugasNama}
      />
    </div>
  );
}

function PrintKelasTemplate({
  selectedDate,
  distribusi,
  schoolInfo,
  kelasList,
  receipts,
  totalStats,
  petugasNama,
}: PrintReportDocumentProps) {
  const validDiterima = receipts.filter((r) => r.status_penerimaan === 'diterima');

  return (
    <div>
      <PrintKopHeader
        schoolInfo={schoolInfo}
        selectedDate={selectedDate}
        documentTitle="REKAPITULASI PENYERAPAN MBG TINGKAT KELAS / ROMBEL"
      />
      <PrintExecutionIdentity
        selectedDate={selectedDate}
        distribusi={distribusi}
        schoolInfo={schoolInfo}
      />

      <table className="w-full text-[11px] border-collapse border border-black mb-4">
        <thead className="print-table-header bg-gray-200">
          <tr>
            <th className="border border-black px-2 py-1.5 text-center w-8">No</th>
            <th className="border border-black px-2 py-1.5 text-left">Nama Kelas</th>
            <th className="border border-black px-2 py-1.5 text-center">Tingkat</th>
            <th className="border border-black px-2 py-1.5 text-left">Jurusan</th>
            <th className="border border-black px-2 py-1.5 text-right">Total Kuota</th>
            <th className="border border-black px-2 py-1.5 text-right">Diterima</th>
            <th className="border border-black px-2 py-1.5 text-right">Sisa / Belum</th>
            <th className="border border-black px-2 py-1.5 text-center">Penyerapan (%)</th>
            <th className="border border-black px-2 py-1.5 text-center">Status Rombel</th>
          </tr>
        </thead>
        <tbody>
          {kelasList.map((k: any, idx: number) => {
            const total = k.total_siswa_dapodik || k.siswa?.length || 0;
            const sudah =
              typeof k.jumlah_hadir === 'number'
                ? k.jumlah_hadir
                : validDiterima.filter((r) => r.kelas === k.nama_kelas).length;
            const belum =
              typeof k.jumlah_absen === 'number' ? k.jumlah_absen : Math.max(0, total - sudah);
            const pct = total > 0 ? Math.round((sudah / total) * 100) : 0;
            const statusRombel =
              sudah >= total && total > 0 ? 'Selesai 100%' : sudah > 0 ? 'Berjalan' : 'Belum Mulai';

            return (
              <tr key={k.id || k.nama_kelas}>
                <td className="border border-black px-2 py-1.5 text-center">{idx + 1}</td>
                <td className="border border-black px-2 py-1.5 font-bold">{k.nama_kelas}</td>
                <td className="border border-black px-2 py-1.5 text-center">{k.tingkat || '-'}</td>
                <td className="border border-black px-2 py-1.5">{k.jurusan || '-'}</td>
                <td className="border border-black px-2 py-1.5 text-right">{total}</td>
                <td className="border border-black px-2 py-1.5 text-right font-bold">{sudah}</td>
                <td className="border border-black px-2 py-1.5 text-right">{belum}</td>
                <td className="border border-black px-2 py-1.5 text-center font-bold">{pct}%</td>
                <td className="border border-black px-2 py-1.5 text-center">{statusRombel}</td>
              </tr>
            );
          })}
          <tr className="bg-gray-100 font-bold">
            <td colSpan={4} className="border border-black px-2 py-2 text-right uppercase">
              Total Akumulasi Sekolah
            </td>
            <td className="border border-black px-2 py-2 text-right">
              {totalStats.totalSiswaSekolah}
            </td>
            <td className="border border-black px-2 py-2 text-right">{totalStats.totalDiterima}</td>
            <td className="border border-black px-2 py-2 text-right">{totalStats.totalBelum}</td>
            <td className="border border-black px-2 py-2 text-center">
              {totalStats.persentase}%
            </td>
            <td className="border border-black px-2 py-2 text-center">-</td>
          </tr>
        </tbody>
      </table>

      <PrintSignatureBlock
        selectedDate={selectedDate}
        schoolInfo={schoolInfo}
        petugasNama={petugasNama}
      />
    </div>
  );
}

function PrintKejadianTemplate({
  selectedDate,
  distribusi,
  schoolInfo,
  filteredIncidents,
  filtersApplied,
  petugasNama,
}: PrintReportDocumentProps) {
  const filterInfo = [
    `Periode: ${formatDateRangeLabel(filtersApplied.filterIncDateRange, selectedDate)}`,
    `Kategori: ${filtersApplied.filterIncKategori && filtersApplied.filterIncKategori !== 'semua' ? filtersApplied.filterIncKategori.replace(/_/g, ' ').toUpperCase() : 'Semua'}`,
    `Keparahan: ${filtersApplied.filterIncSeverity && filtersApplied.filterIncSeverity !== 'semua' ? filtersApplied.filterIncSeverity.toUpperCase() : 'Semua'}`,
    `Status: ${filtersApplied.filterIncStatus && filtersApplied.filterIncStatus !== 'semua' ? filtersApplied.filterIncStatus.toUpperCase() : 'Semua'}`,
  ].join(' • ');

  return (
    <div>
      <PrintKopHeader
        schoolInfo={schoolInfo}
        selectedDate={selectedDate}
        documentTitle="BERITA ACARA & LOG REKAPITULASI KEJADIAN KHUSUS MBG"
      />
      <PrintExecutionIdentity
        selectedDate={selectedDate}
        distribusi={distribusi}
        schoolInfo={schoolInfo}
      />

      <p className="text-[11px] mb-2">
        <strong>Filter Aktif:</strong> {filterInfo}
      </p>

      <table className="w-full text-[10.5px] border-collapse border border-black mb-4">
        <thead className="print-table-header bg-gray-200">
          <tr>
            <th className="border border-black px-1.5 py-1.5 text-center w-8">No</th>
            <th className="border border-black px-2 py-1.5 text-center w-24">Tanggal &amp; Jam</th>
            <th className="border border-black px-2 py-1.5 text-left">Kategori</th>
            <th className="border border-black px-2 py-1.5 text-center">Keparahan</th>
            <th className="border border-black px-2 py-1.5 text-left">Judul &amp; Deskripsi</th>
            <th className="border border-black px-2 py-1.5 text-left">Tindak Lanjut</th>
            <th className="border border-black px-2 py-1.5 text-left">Pelapor</th>
            <th className="border border-black px-2 py-1.5 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredIncidents.length === 0 ? (
            <tr>
              <td colSpan={8} className="border border-black px-3 py-4 text-center italic">
                Tidak ada catatan kejadian khusus pada rentang dan filter yang dipilih.
              </td>
            </tr>
          ) : (
            filteredIncidents.map((inc, idx) => (
              <tr key={inc.id}>
                <td className="border border-black px-1.5 py-1 text-center">{idx + 1}</td>
                <td className="border border-black px-2 py-1 text-center font-mono">
                  {formatDateDDMMYYYY(inc.tanggal)}
                  <br />
                  {inc.waktu_kejadian.slice(0, 5)} WIB
                </td>
                <td className="border border-black px-2 py-1 uppercase">
                  {inc.kategori.replace(/_/g, ' ')}
                </td>
                <td className="border border-black px-2 py-1 text-center uppercase font-bold">
                  {inc.tingkat_keparahan}
                </td>
                <td className="border border-black px-2 py-1">
                  <strong>{inc.judul_kejadian}</strong>
                  <div className="mt-0.5">{inc.deskripsi}</div>
                </td>
                <td className="border border-black px-2 py-1">{inc.tindak_lanjut || '-'}</td>
                <td className="border border-black px-2 py-1">{inc.nama_petugas_pelapor || '-'}</td>
                <td className="border border-black px-2 py-1 text-center uppercase font-bold">
                  {inc.status_penyelesaian}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <PrintSignatureBlock
        selectedDate={selectedDate}
        schoolInfo={schoolInfo}
        petugasNama={petugasNama}
        rightTitle="Penanggung Jawab MBG"
      />
    </div>
  );
}

export function PrintReportDocument(props: PrintReportDocumentProps) {
  return (
    <div className="hidden print:block print-document-container bg-white text-black font-serif leading-snug">
      {props.activeTab === 'harian' && <PrintHarianTemplate {...props} />}
      {props.activeTab === 'siswa' && <PrintSiswaTemplate {...props} />}
      {props.activeTab === 'kelas' && <PrintKelasTemplate {...props} />}
      {props.activeTab === 'kejadian' && <PrintKejadianTemplate {...props} />}
    </div>
  );
}

