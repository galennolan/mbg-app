'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  UserCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  School,
  Building,
  UserX,
  XCircle,
  Utensils,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  getTodayDistribution,
  confirmTeacherIndividual,
} from '@/lib/services';
import { DistribusiMBG, StatusPenerimaan } from '@/lib/types';
import { formatWIBTime, formatIndonesianDate, getJakartaDateString } from '@/lib/utils';

export default function KonfirmasiIndividuPage() {
  const { user } = useAuth();
  const [distribusi, setDistribusi] = useState<DistribusiMBG | null>(null);
  const [loadingDist, setLoadingDist] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [students, setStudents] = useState<any[]>([]);

  // Selected student for recording
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusPenerimaan>('diterima');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    async function load() {
      try {
        const dist = await getTodayDistribution();
        setDistribusi(dist);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDist(false);
      }
    }
    load();
  }, []);

  // Search students
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setFeedback(null);
    try {
      // Find students matching nama or nisn
      const { data, error } = await supabase
        .from('siswa')
        .select('*, kelas:kelas_id(id, nama_kelas, jurusan)')
        .or(`nama.ilike.%${searchQuery.trim()}%,nisn.ilike.%${searchQuery.trim()}%`)
        .eq('status_aktif', true)
        .limit(20);

      if (data && distribusi) {
        // Fetch today's receipt status for these students
        const studentIds = data.map((s) => s.id);
        const { data: receipts } = await supabase
          .from('penerimaan_mbg')
          .select('*')
          .eq('distribusi_id', distribusi.id)
          .in('siswa_id', studentIds);

        const recMap = new Map((receipts || []).map((r: any) => [r.siswa_id, r]));

        const combined = data.map((s) => ({
          ...s,
          receipt: recMap.get(s.id) || null,
        }));
        setStudents(combined);
      } else {
        setStudents(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleSimpan = async () => {
    if (!selectedStudent || !distribusi) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const rec = await confirmTeacherIndividual({
        distribusiId: distribusi.id,
        siswaId: selectedStudent.id,
        status: selectedStatus,
        petugasId: user?.id || '00000000-0000-0000-0000-000000000000',
      });

      setFeedback({
        type: 'success',
        message: `Berhasil mencatat status ${
          selectedStatus === 'diterima'
            ? 'DITERIMA'
            : selectedStatus === 'tidak_hadir'
            ? 'TIDAK HADIR'
            : 'TIDAK MENGAMBIL'
        } untuk ${selectedStudent.nama}`,
      });

      // Update student list in state
      setStudents((prev) =>
        prev.map((s) => (s.id === selectedStudent.id ? { ...s, receipt: rec } : s))
      );
      setSelectedStudent(null);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Gagal menyimpan transaksi individu',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-brand-blue rounded-full text-xs font-semibold mb-2">
          <UserCheck className="w-3.5 h-3.5" />
          Pencatatan Guru
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
          Konfirmasi Penerimaan Individu
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pencatatan langsung oleh guru untuk siswa yang tidak membawa ponsel atau terkendala akses
        </p>
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

      {/* Warning jika distribusi belum tiba */}
      {distribusi?.status === 'menunggu' && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>MBG hari ini belum ditandai tiba oleh petugas.</span>
          </div>
        </div>
      )}

      {/* Pencarian Siswa */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan Nama Siswa atau NISN..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold text-sm rounded-xl shadow transition disabled:opacity-50"
          >
            {searching ? 'Mencari...' : 'Cari'}
          </button>
        </form>

        {/* Results */}
        {students.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Daftar Siswa Ditemukan ({students.length})
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
              {students.map((s) => {
                const isReceived = s.receipt?.status_penerimaan === 'diterima';
                const isAbsent = s.receipt?.status_penerimaan === 'tidak_hadir';
                const isNotTaking = s.receipt?.status_penerimaan === 'tidak_mengambil';

                return (
                  <div
                    key={s.id}
                    className="p-4 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{s.nama}</span>
                        {s.nisn && (
                          <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            NISN: {s.nisn}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="font-medium text-slate-700">{s.kelas?.nama_kelas}</span>
                        <span>•</span>
                        <span>{s.kelas?.jurusan}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {s.receipt ? (
                        <div className="text-right">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                              isReceived
                                ? 'bg-emerald-100 text-emerald-800'
                                : isAbsent
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isReceived && '✓ Sudah Diterima'}
                            {isAbsent && 'Tidak Hadir'}
                            {isNotTaking && 'Tidak Mengambil'}
                          </span>
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {formatWIBTime(s.receipt.waktu_penerimaan)} ({s.receipt.sumber_pencatatan})
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                          Belum Tercatat
                        </span>
                      )}

                      <button
                        onClick={() => setSelectedStudent(s)}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-brand-blue text-white text-xs font-bold rounded-xl transition"
                      >
                        {s.receipt ? 'Ubah Status' : 'Catat Status'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL CATAT STATUS INDIVIDU (BR-08, BR-10) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-bold text-base text-slate-900">Catat Penerimaan Siswa</h3>
                <p className="text-xs text-slate-500">Pencatatan resmi oleh guru penanggung jawab</p>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="font-extrabold text-slate-900 text-sm">{selectedStudent.nama}</div>
              <div className="text-slate-600">
                {selectedStudent.kelas?.nama_kelas} • {selectedStudent.kelas?.jurusan}
              </div>
              {selectedStudent.nisn && (
                <div className="text-slate-500 font-mono">NISN: {selectedStudent.nisn}</div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Status Operasional (BR-08)
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="status_penerimaan"
                    value="diterima"
                    checked={selectedStatus === 'diterima'}
                    onChange={() => setSelectedStatus('diterima')}
                    className="w-4 h-4 text-brand-blue"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Diterima (Makan Siang)</div>
                    <div className="text-xs text-slate-500">
                      Siswa menerima makanan dengan waktu server saat ini.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="status_penerimaan"
                    value="tidak_hadir"
                    checked={selectedStatus === 'tidak_hadir'}
                    onChange={() => setSelectedStatus('tidak_hadir')}
                    className="w-4 h-4 text-brand-blue"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Tidak Hadir (Absen)</div>
                    <div className="text-xs text-slate-500">
                      Siswa sakit, izin, atau tidak masuk sekolah hari ini.
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:bg-blue-50/50 cursor-pointer transition">
                  <input
                    type="radio"
                    name="status_penerimaan"
                    value="tidak_mengambil"
                    checked={selectedStatus === 'tidak_mengambil'}
                    onChange={() => setSelectedStatus('tidak_mengambil')}
                    className="w-4 h-4 text-brand-blue"
                  />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Tidak Mengambil MBG</div>
                    <div className="text-xs text-slate-500">
                      Siswa hadir tapi menolak, berpuasa, atau bawa bekal.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSimpan}
                disabled={submitting}
                className="flex-1 py-3 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Transaksi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

