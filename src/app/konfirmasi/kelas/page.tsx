'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  Building,
  Clock,
  ArrowRight,
  Filter,
  Check,
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import {
  getTodayDistribution,
  confirmTeacherClassMass,
} from '@/lib/services';
import { DistribusiMBG, Kelas, Siswa } from '@/lib/types';
import { formatWIBTime, formatIndonesianDate, getJakartaDateString } from '@/lib/utils';

export default function KonfirmasiKelasPage() {
  const { user } = useAuth();
  const [distribusi, setDistribusi] = useState<DistribusiMBG | null>(null);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [selectedKelasId, setSelectedKelasId] = useState('');
  const [loading, setLoading] = useState(true);

  // Class students state
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Preview & Confirm Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState<{
    berhasil: number;
    dilewati: number;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Load active classes & distribution
  useEffect(() => {
    async function init() {
      try {
        const dist = await getTodayDistribution();
        setDistribusi(dist);

        const { data: classes } = await supabase
          .from('kelas')
          .select('*')
          .eq('status_aktif', true)
          .order('nama_kelas');

        if (classes) {
          setKelasList(classes as Kelas[]);
          if (classes.length > 0) {
            setSelectedKelasId(classes[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Load students whenever selected class changes
  useEffect(() => {
    if (!selectedKelasId || !distribusi) return;

    async function fetchStudentsForClass() {
      setLoadingStudents(true);
      setErrorMsg('');
      setResultSummary(null);
      try {
        // Fetch all active students in class
        const { data: students, error: err } = await supabase
          .from('siswa')
          .select('*, kelas:kelas_id(id, nama_kelas, jurusan)')
          .eq('kelas_id', selectedKelasId)
          .eq('status_aktif', true)
          .order('nama');

        if (err || !students) {
          setClassStudents([]);
          return;
        }

        // Fetch receipts for today
        const studentIds = students.map((s) => s.id);
        const { data: receipts } = await supabase
          .from('penerimaan_mbg')
          .select('*')
          .eq('distribusi_id', distribusi?.id)
          .in('siswa_id', studentIds);

        const receiptMap = new Map((receipts || []).map((r: any) => [r.siswa_id, r]));

        const processed = students.map((s) => ({
          ...s,
          receipt: receiptMap.get(s.id) || null,
        }));

        setClassStudents(processed);

        // BR-05: Automatically select all students who have NOT received yet
        const defaultSelected = new Set<string>();
        processed.forEach((s) => {
          if (!s.receipt) {
            defaultSelected.add(s.id);
          }
        });
        setSelectedStudentIds(defaultSelected);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStudents(false);
      }
    }

    fetchStudentsForClass();
  }, [selectedKelasId, distribusi]);

  // Toggle selection for a student
  const toggleStudent = (id: string) => {
    const updated = new Set(selectedStudentIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedStudentIds(updated);
  };

  // Select all unrecorded
  const selectAllUnrecorded = () => {
    const updated = new Set<string>();
    classStudents.forEach((s) => {
      if (!s.receipt) {
        updated.add(s.id);
      }
    });
    setSelectedStudentIds(updated);
  };

  // Unselect all
  const unselectAll = () => {
    setSelectedStudentIds(new Set());
  };

  // Execute mass confirmation
  const handleExecuteMassConfirm = async () => {
    if (!distribusi || selectedStudentIds.size === 0) return;

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await confirmTeacherClassMass({
        distribusiId: distribusi.id,
        siswaIds: Array.from(selectedStudentIds),
        petugasId: user?.id || '00000000-0000-0000-0000-000000000000',
      });

      setResultSummary(res);
      setShowPreviewModal(false);

      // Refresh student receipts
      const { data: updatedReceipts } = await supabase
        .from('penerimaan_mbg')
        .select('*')
        .eq('distribusi_id', distribusi.id)
        .in('siswa_id', classStudents.map((s) => s.id));

      const receiptMap = new Map((updatedReceipts || []).map((r: any) => [r.siswa_id, r]));

      setClassStudents((prev) =>
        prev.map((s) => ({
          ...s,
          receipt: receiptMap.get(s.id) || s.receipt,
        }))
      );
      setSelectedStudentIds(new Set());
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan konfirmasi massal.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClass = kelasList.find((k) => k.id === selectedKelasId);
  const unrecordedCount = classStudents.filter((s) => !s.receipt).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-brand-blue rounded-full text-xs font-semibold mb-2">
          <Users className="w-3.5 h-3.5" />
          Konfirmasi Massal
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
          Pencatatan MBG Per Kelas
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Guru dapat mencatat penerimaan seluruh siswa dalam satu kelas sekaligus dengan opsi unselect siswa tidak hadir
        </p>
      </div>

      {resultSummary && (
        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-base text-emerald-950">
              Konfirmasi Massal Berhasil Diproses!
            </h4>
            <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
              Sebanyak <strong>{resultSummary.berhasil} siswa</strong> berhasil dicatat menerima MBG.{' '}
              {resultSummary.dilewati > 0 && (
                <span>
                  ({resultSummary.dilewati} siswa dilewati karena sudah memiliki catatan sebelumnya).
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Selector Kelas & Control Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Kelas Distribusi
            </label>
            <div className="relative">
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="w-full py-3 px-4 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
              >
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama_kelas} ({k.jurusan})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedClass && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Jurusan</span>
                <span className="font-bold text-slate-800">{selectedClass.jurusan}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Tingkat</span>
                <span className="font-bold text-slate-800">{selectedClass.tingkat}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Belum Tercatat</span>
                <span className="font-bold text-amber-600">{unrecordedCount} Siswa</span>
              </div>
            </div>
          )}
        </div>

        {/* Quick selection helper buttons (FR-13) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllUnrecorded}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
            >
              Pilih Semua yang Belum
            </button>
            <button
              type="button"
              onClick={unselectAll}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition"
            >
              Batalkan Semua Pilihan
            </button>
          </div>

          <div className="text-slate-500 font-medium">
            Terpilih:{' '}
            <strong className="text-brand-blue font-bold text-sm">
              {selectedStudentIds.size}
            </strong>{' '}
            dari {classStudents.length} siswa
          </div>
        </div>
      </div>

      {/* Table Daftar Siswa Kelas */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="font-bold text-sm text-slate-800">
            Daftar Siswa Kelas {selectedClass?.nama_kelas}
          </div>
          <div className="text-xs text-slate-400">
            Hilangkan centang pada siswa yang tidak hadir atau tidak mengambil MBG
          </div>
        </div>

        {loadingStudents ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Memuat daftar siswa kelas...
          </div>
        ) : classStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Tidak ada siswa aktif terdaftar di kelas ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {classStudents.map((s, idx) => {
              const hasReceived = !!s.receipt;
              const isChecked = selectedStudentIds.has(s.id);

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    if (!hasReceived) toggleStudent(s.id);
                  }}
                  className={`p-4 flex items-center justify-between gap-3 transition ${
                    hasReceived
                      ? 'bg-slate-50/70 text-slate-400 cursor-not-allowed'
                      : isChecked
                      ? 'bg-blue-50/40 hover:bg-blue-50/70 cursor-pointer'
                      : 'hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      {hasReceived ? (
                        <div className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStudent(s.id)}
                          className="w-5 h-5 rounded text-brand-blue focus:ring-brand-blue rounded-md border-slate-300"
                        />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">{idx + 1}.</span>
                        <span
                          className={`font-bold text-sm truncate ${
                            hasReceived ? 'text-slate-500 line-through' : 'text-slate-900'
                          }`}
                        >
                          {s.nama}
                        </span>
                        {s.nisn && (
                          <span className="text-[11px] font-mono text-slate-400">
                            ({s.nisn})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    {hasReceived ? (
                      <div>
                        <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                          Sudah Tercatat
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {formatWIBTime(s.receipt.waktu_penerimaan)} ({s.receipt.sumber_pencatatan})
                        </div>
                      </div>
                    ) : isChecked ? (
                      <span className="text-xs font-semibold text-brand-blue bg-blue-100/70 px-2.5 py-0.5 rounded-full">
                        Akan Dicatat
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Dilewati (Unselected)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Floating Bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600">
            Total yang akan diproses: <strong>{selectedStudentIds.size} Siswa</strong>
          </div>

          <button
            type="button"
            onClick={() => setShowPreviewModal(true)}
            disabled={selectedStudentIds.size === 0 || submitting}
            className="w-full sm:w-auto px-7 py-3 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-40"
          >
            Pratinjau & Konfirmasi Sekarang
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MODAL PRATINJAU KONFIRMASI MASSAL (FR-14, BR-05, AC-11, AC-12) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Pratinjau Konfirmasi Massal
                </h3>
                <p className="text-xs text-slate-500">Kelas: {selectedClass?.nama_kelas}</p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 leading-relaxed">
              Anda akan mencatat bahwa <strong>{selectedStudentIds.size} siswa</strong> berikut telah
              menerima Makan Bergizi Gratis (MBG) hari ini dengan pencatat atas nama{' '}
              <strong>{user?.nama || 'Petugas'}</strong>.
            </div>

            {/* List nama yang akan dicatat */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              {classStudents
                .filter((s) => selectedStudentIds.has(s.id))
                .map((s, i) => (
                  <div
                    key={s.id}
                    className="flex justify-between py-1 px-2 hover:bg-white rounded"
                  >
                    <span className="font-medium text-slate-800">
                      {i + 1}. {s.nama}
                    </span>
                    <span className="font-mono text-slate-400">{s.nisn || '-'}</span>
                  </div>
                ))}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                disabled={submitting}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Periksa Ulang
              </button>
              <button
                type="button"
                onClick={handleExecuteMassConfirm}
                disabled={submitting}
                className="flex-1 py-3 bg-brand-blue hover:bg-brand-blue-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
              >
                {submitting ? 'Memproses Transaksi...' : `Simpan ${selectedStudentIds.size} Transaksi`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

