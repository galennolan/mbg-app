'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Utensils,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  UserCheck,
  Building,
  School,
  XCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  getTodayDistribution,
  searchStudentsForConfirmation,
  confirmStudentSelf,
  CandidateStudent,
} from '@/lib/services';
import { DistribusiMBG, Kelas } from '@/lib/types';
import { formatWIBTime, formatIndonesianDate, getJakartaDateString } from '@/lib/utils';

export default function StudentPortalPage() {
  const [loading, setLoading] = useState(true);
  const [distribusi, setDistribusi] = useState<DistribusiMBG | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [selectedJurusan, setSelectedJurusan] = useState('');
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jurusanList, setJurusanList] = useState<string[]>([]);

  // Search Results
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<CandidateStudent[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Confirmation Modal
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateStudent | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState<{
    success: boolean;
    message: string;
    already_received?: boolean;
    nama_siswa?: string;
    kelas?: string;
    waktu_penerimaan?: string;
  } | null>(null);

  // Load Distribution and Classes
  const loadData = useCallback(async () => {
    try {
      const dist = await getTodayDistribution();
      setDistribusi(dist);

      // Fetch active classes for filter
      const { data: classes } = await supabase
        .from('kelas')
        .select('*')
        .eq('status_aktif', true)
        .order('nama_kelas');

      if (classes) {
        setKelasList(classes as Kelas[]);
        const uniqueJurusan = Array.from(new Set(classes.map((c) => c.jurusan)));
        setJurusanList(uniqueJurusan);
      }
    } catch (err) {
      console.error('Error loading student portal data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Execute search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() && !selectedKelasId && !selectedJurusan) {
      return;
    }

    setSearching(true);
    setHasSearched(true);
    try {
      const results = await searchStudentsForConfirmation(
        searchQuery,
        selectedKelasId || undefined,
        selectedJurusan || undefined
      );
      setCandidates(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Trigger search on debounce or button click
  useEffect(() => {
    if (searchQuery.trim().length >= 2 || selectedKelasId || selectedJurusan) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setCandidates([]);
      setHasSearched(false);
    }
  }, [searchQuery, selectedKelasId, selectedJurusan]);

  // Submit Confirmation
  const handleConfirmReceipt = async () => {
    if (!selectedCandidate) return;
    setConfirming(true);
    try {
      const result = await confirmStudentSelf(selectedCandidate.id);
      setConfirmResult(result);
      if (result.success) {
        // Update local candidate list
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === selectedCandidate.id
              ? { ...c, sudah_menerima: true, waktu_penerimaan: result.waktu_penerimaan }
              : c
          )
        );
      }
    } catch (err: any) {
      setConfirmResult({
        success: false,
        message: err.message || 'Terjadi kesalahan sistem.',
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleRefreshStatus = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Memeriksa status distribusi MBG...</p>
      </div>
    );
  }

  const isArrived = distribusi?.status === 'tiba';
  const isClosed = distribusi?.status === 'ditutup';
  const isWaiting = !distribusi || distribusi.status === 'menunggu';

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Header Info Sekolah */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-brand-blue rounded-full text-xs font-semibold mb-2">
          <School className="w-3.5 h-3.5" />
          MBG Tracker • {formatIndonesianDate(distribusi?.tanggal || getJakartaDateString())}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-navy tracking-tight">
          Penerimaan Makan Bergizi Gratis
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Konfirmasi mandiri penerimaan makan siang harian siswa
        </p>
      </div>

      {/* KONDISI 1: MBG BELUM TIBA (FR-07, AC-02) */}
      {isWaiting && (
        <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden text-center p-6 sm:p-8">
          <div className="w-20 h-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2">
            Status: MBG Belum Tiba
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
            Makanan Belum Sampai di Sekolah
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed mb-6">
            Kedatangan Makan Bergizi Gratis (MBG) hari ini belum dicatat oleh guru atau petugas
            penanggung jawab. Mohon menunggu arahan bapak/ibu guru di kelas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-700 text-white font-medium px-6 py-3 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Memeriksa...' : 'Periksa Status Lagi'}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            Pencarian identitas dan konfirmasi akan otomatis aktif setelah guru mencatat kedatangan MBG.
          </div>
        </div>
      )}

      {/* KONDISI 2: DISTRIBUSI SUDAH DITUTUP */}
      {isClosed && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-center p-6 sm:p-8">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4 border border-slate-200">
            <XCircle className="w-8 h-8 text-slate-500" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
            Status: Distribusi Ditutup
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Distribusi Hari Ini Telah Berakhir
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto mb-4">
            Pencatatan konfirmasi penerimaan MBG untuk tanggal ini telah ditutup. Bila Anda belum
            tercatat, silakan hubungi guru pembina atau petugas MBG sekolah.
          </p>
        </div>
      )}

      {/* KONDISI 3: MBG SUDAH TIBA (FR-02 - FR-09) */}
      {isArrived && (
        <div className="space-y-6">
          {/* Status Banner Tiba */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-medium text-emerald-100">Status MBG Hari Ini</div>
                <div className="font-bold text-base sm:text-lg">Makanan Sudah Tiba di Sekolah</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-emerald-100">Waktu Kedatangan</div>
              <div className="font-mono font-bold text-sm sm:text-base">
                {formatWIBTime(distribusi?.waktu_kedatangan)}
              </div>
            </div>
          </div>

          {/* Form Pencarian Siswa */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-brand-navy">Konfirmasi Penerimaan</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Masukkan nama lengkap Anda untuk mencari data siswa. Gunakan filter kelas dan
                jurusan bila terdapat nama yang serupa.
              </p>
            </div>

            <div className="space-y-3">
              {/* Nama Lengkap Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik nama lengkap Anda..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue transition"
                />
              </div>

              {/* Filter Kelas & Jurusan (FR-03 & FR-04) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Filter Kelas
                  </label>
                  <select
                    value={selectedKelasId}
                    onChange={(e) => setSelectedKelasId(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="">Semua Kelas</option>
                    {kelasList.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Filter Jurusan
                  </label>
                  <select
                    value={selectedJurusan}
                    onChange={(e) => setSelectedJurusan(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  >
                    <option value="">Semua Jurusan</option>
                    {jurusanList.map((j) => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Hasil Pencarian (FR-05) */}
          {searching && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
              Mencari data siswa...
            </div>
          )}

          {!searching && hasSearched && candidates.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">Data Siswa Tidak Ditemukan</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-3">
                Pastikan ejaan nama Anda sudah tepat atau coba pilih kelas Anda.
              </p>
              <div className="text-xs bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200 inline-block">
                Jika data Anda tetap tidak muncul, hubungi bapak/ibu guru untuk dicatat langsung.
              </div>
            </div>
          )}

          {!searching && candidates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Ditemukan {candidates.length} Siswa Cocok
                </span>
                <span className="text-xs text-slate-400">Pilih nama Anda di bawah</span>
              </div>

              <div className="space-y-2.5">
                {candidates.map((c) => (
                  <div
                    key={c.id}
                    className={`rounded-2xl border p-4 transition ${
                      c.sudah_menerima
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-white border-slate-200 hover:border-brand-blue hover:shadow-md cursor-pointer'
                    }`}
                    onClick={() => {
                      if (!c.sudah_menerima) {
                        setSelectedCandidate(c);
                        setConfirmResult(null);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base truncate">
                            {c.nama}
                          </h4>
                          {c.sudah_menerima && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Sudah Menerima
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            <Building className="w-3 h-3 text-slate-400" />
                            {c.nama_kelas}
                          </span>
                          <span>•</span>
                          <span>{c.jurusan}</span>
                        </div>
                        {c.sudah_menerima && c.waktu_penerimaan && (
                          <div className="text-[11px] text-emerald-700 mt-1 font-mono">
                            Dikonfirmasi: {formatWIBTime(c.waktu_penerimaan)}
                          </div>
                        )}
                      </div>

                      <div>
                        {c.sudah_menerima ? (
                          <div className="text-xs text-slate-400 font-medium px-3 py-1.5 bg-slate-200/60 rounded-xl">
                            Tercatat
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCandidate(c);
                              setConfirmResult(null);
                            }}
                            className="bg-brand-blue hover:bg-brand-blue-700 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition active:scale-95"
                          >
                            Pilih
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL KONFIRMASI PENERIMAAN SISWA (FR-08, BR-03, AC-06, AC-07) */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-brand-navy p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-base">Konfirmasi Identitas</h3>
              </div>
              <button
                onClick={() => {
                  if (!confirming) {
                    setSelectedCandidate(null);
                    setConfirmResult(null);
                  }
                }}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {!confirmResult ? (
                <>
                  <div className="text-center mb-5">
                    <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">
                      Identitas Anda
                    </p>
                    <div className="text-xl font-extrabold text-slate-900">
                      {selectedCandidate.nama}
                    </div>
                    <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-blue-50 text-brand-blue rounded-full text-xs font-semibold">
                      <span>{selectedCandidate.nama_kelas}</span>
                      <span>•</span>
                      <span>{selectedCandidate.jurusan}</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 text-xs leading-relaxed mb-6">
                    <div className="font-semibold flex items-center gap-1.5 text-amber-800 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      Penting untuk diperhatikan:
                    </div>
                    Pastikan nama dan kelas di atas benar-benar adalah data Anda. Tindakan ini akan
                    mencatat waktu penerimaan Anda secara permanen dengan jam server sekolah.
                  </div>

                  <div className="space-y-2.5">
                    <button
                      onClick={handleConfirmReceipt}
                      disabled={confirming}
                      className="w-full py-4 bg-brand-blue hover:bg-brand-blue-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-base transition disabled:opacity-50"
                    >
                      {confirming ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Menyimpan ke Server...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Saya Sudah Menerima MBG
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setSelectedCandidate(null)}
                      disabled={confirming}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition"
                    >
                      Bukan Data Saya (Kembali)
                    </button>
                  </div>
                </>
              ) : confirmResult.success ? (
                /* Sukses Konfirmasi */
                <div className="text-center py-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-inner">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-1">
                    Konfirmasi Berhasil!
                  </h4>
                  <p className="text-xs text-slate-500 mb-5">
                    Data penerimaan Anda telah tersimpan dengan aman di server sekolah.
                  </p>

                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left text-xs space-y-2 mb-6">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nama Siswa:</span>
                      <span className="font-semibold text-slate-800">
                        {confirmResult.nama_siswa || selectedCandidate.nama}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kelas:</span>
                      <span className="font-semibold text-slate-800">
                        {confirmResult.kelas || selectedCandidate.nama_kelas}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Waktu Tercatat:</span>
                      <span className="font-mono font-bold text-brand-blue">
                        {formatWIBTime(confirmResult.waktu_penerimaan)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sumber:</span>
                      <span className="font-medium text-slate-700">Konfirmasi Mandiri Siswa</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedCandidate(null);
                      setConfirmResult(null);
                    }}
                    className="w-full py-3.5 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold rounded-2xl text-sm shadow transition"
                  >
                    Tutup & Selesai
                  </button>
                </div>
              ) : (
                /* Gagal / Sudah Pernah Menerima */
                <div className="text-center py-2">
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-1">
                    {confirmResult.already_received
                      ? 'Sudah Pernah Menerima'
                      : 'Konfirmasi Tidak Berhasil'}
                  </h4>
                  <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                    {confirmResult.message}
                  </p>

                  {confirmResult.waktu_penerimaan && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6 text-xs text-slate-700">
                      Tercatat pada:{' '}
                      <span className="font-mono font-bold text-brand-blue">
                        {formatWIBTime(confirmResult.waktu_penerimaan)}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedCandidate(null);
                      setConfirmResult(null);
                    }}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-2xl text-sm transition"
                  >
                    Kembali
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

