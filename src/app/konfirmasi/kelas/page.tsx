'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Check,
  ShieldCheck,
  Building,
  ArrowRight,
  Utensils,
  Lock,
} from 'lucide-react';
import {
  getTodayOrganolepticSession,
  getClassRoster,
  submitClassRepresentativeClaim,
  SEED_CLASSES,
} from '@/lib/services';
import { OrganolepticTest, StudentRecord } from '@/lib/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';

export default function KonfirmasiKelasPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<OrganolepticTest | null>(null);

  const [selectedClassId, setSelectedClassId] = useState(SEED_CLASSES[0].id);
  const [roster, setRoster] = useState<StudentRecord[]>([]);
  const [selectedNisns, setSelectedNisns] = useState<Set<string>>(new Set());
  const [searchRoster, setSearchRoster] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const sess = await getTodayOrganolepticSession();
      setSession(sess);
      const list = await getClassRoster(selectedClassId);
      setRoster(list);

      // Default: Select all students who haven't received yet
      const available = list.filter((s) => !s.sudah_ambil).map((s) => s.nisn);
      setSelectedNisns(new Set(available));
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Gagal memuat data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  const toggleStudent = (nisn: string, sudahAmbil: boolean) => {
    if (sudahAmbil) return; // Locked!
    const next = new Set(selectedNisns);
    if (next.has(nisn)) {
      next.delete(nisn);
    } else {
      next.add(nisn);
    }
    setSelectedNisns(next);
  };

  const availableStudents = roster.filter((s) => !s.sudah_ambil);
  const isAllSelected =
    availableStudents.length > 0 && availableStudents.every((s) => selectedNisns.has(s.nisn));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNisns(new Set());
    } else {
      setSelectedNisns(new Set(availableStudents.map((s) => s.nisn)));
    }
  };

  const handleConfirmClass = async () => {
    if (selectedNisns.size === 0) {
      setFeedback({ type: 'error', message: 'Pilih minimal satu siswa yang hadir.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const pin = session?.kode_pin_harian || '0000';
    try {
      const res = await submitClassRepresentativeClaim({
        classId: selectedClassId,
        attendedNisns: Array.from(selectedNisns),
        pinOrToken: pin,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        const updated = await getClassRoster(selectedClassId);
        setRoster(updated);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan konfirmasi' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRoster = roster.filter(
    (s) =>
      s.nama_lengkap.toLowerCase().includes(searchRoster.toLowerCase()) ||
      s.nisn.includes(searchRoster)
  );

  const hadirCount = selectedNisns.size;
  const absenCount = Math.max(0, roster.length - hadirCount);
  const currentClass = SEED_CLASSES.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Konfirmasi Kolektif Kelas (FR-3.2)"
        subtitle="Checklist massal penerimaan MBG per kelas oleh Guru Piket atau Wali Kelas."
        badgeText="STAFF MODE"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 text-xs font-bold border border-slate-200/80 shadow-sm transition"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
          >
            Live Monitor
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </PageHeader>

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Class Selector Bar */}
      <div className="rounded-3xl border border-white/20 bg-white/70 p-4 sm:p-5 shadow-lg backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-brand-blue">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pilih Kelas
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-black text-brand-navy shadow-sm focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              >
                {SEED_CLASSES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nama_kelas} ({c.jurusan} - {c.total_siswa_dapodik} Siswa)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchRoster}
            onChange={(e) => setSearchRoster(e.target.value)}
            placeholder="Cari siswa atau NISN..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
          />
        </div>
      </div>

      {/* Roster Checklist */}
      <div className="rounded-3xl border border-white/20 bg-white/80 p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                isAllSelected
                  ? 'bg-brand-blue text-white border-brand-blue'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAllSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua Hadir (Default)'}
            </button>
            <span className="text-xs text-slate-500">
              {selectedNisns.size} dari {roster.length} terpilih
            </span>
          </div>

          <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              Indikator Alergi Aktif
            </span>
          </div>
        </div>

        {/* Student items */}
        <div className="divide-y divide-slate-100">
          {filteredRoster.map((student) => {
            const isSelected = selectedNisns.has(student.nisn);
            const isClaimed = student.sudah_ambil;

            return (
              <div
                key={student.nisn}
                onClick={() => toggleStudent(student.nisn, isClaimed)}
                className={`py-3.5 px-3 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer select-none ${
                  isClaimed
                    ? 'opacity-60 bg-slate-50/80 cursor-not-allowed'
                    : isSelected
                    ? 'bg-blue-50/60 border border-blue-200/60'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition flex-shrink-0 ${
                      isClaimed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isSelected
                        ? 'bg-brand-blue border-brand-blue text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {(isSelected || isClaimed) && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <span
                      className={`text-xs font-bold ${
                        isClaimed ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      {student.nama_lengkap}
                    </span>
                    <p className="text-[11px] text-slate-500 font-mono">NISN: {student.nisn}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {student.alergi_makanan && (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                      {student.alergi_makanan}
                    </span>
                  )}

                  {isClaimed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Sudah Ambil
                    </span>
                  ) : (
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                        isSelected ? 'text-brand-blue' : 'text-slate-400'
                      }`}
                    >
                      {isSelected ? 'Hadir' : 'Absen'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-4 z-30 rounded-3xl border border-white/20 bg-slate-900/90 text-white p-4 sm:p-5 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="block text-[11px] text-sky-200 font-bold uppercase tracking-wider">
            {currentClass?.nama_kelas} ({currentClass?.jurusan})
          </span>
          <p className="text-sm font-black text-white mt-0.5">
            <span className="text-emerald-400">Hadir = {hadirCount} Siswa</span>
            <span className="text-slate-400 mx-2">|</span>
            <span className="text-amber-300">Absen (Sisa) = {absenCount} Siswa</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleConfirmClass}
          disabled={submitting || hadirCount === 0}
          className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm shadow-xl shadow-blue-900/40 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <>
              <RotateCw className="w-4 h-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Utensils className="w-4 h-4" />
              Kunci Konfirmasi Kelas ({hadirCount} Porsi)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
