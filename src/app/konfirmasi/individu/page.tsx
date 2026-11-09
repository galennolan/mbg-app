'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  UserCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCw,
  Utensils,
  Lock,
} from 'lucide-react';
import {
  getTodayOrganolepticSession,
  searchStudentsForConfirmation,
  submitIndividualStudentClaim,
  CandidateStudent,
} from '@/lib/services';
import { OrganolepticTest } from '@/lib/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { FeedbackBanner } from '@/components/ui/FeedbackBanner';

export default function KonfirmasiIndividuPage() {
  const { user } = useAuth();
  const [session, setSession] = useState<OrganolepticTest | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [candidates, setCandidates] = useState<CandidateStudent[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<CandidateStudent | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  useEffect(() => {
    async function load() {
      try {
        const sess = await getTodayOrganolepticSession();
        setSession(sess);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSession(false);
      }
    }
    load();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setHasSearched(true);
    setFeedback(null);
    try {
      const results = await searchStudentsForConfirmation(searchQuery);
      setCandidates(results);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirmSingle = async (student: CandidateStudent) => {
    setSelectedStudent(student);
    setSubmitting(true);
    setFeedback(null);

    const pin = session?.kode_pin_harian || '0000';
    try {
      const res = await submitIndividualStudentClaim({
        nisn: student.id,
        pinOrToken: pin,
        tipeKlaim: 'SUSULAN',
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        // Refresh search list
        const results = await searchStudentsForConfirmation(searchQuery);
        setCandidates(results);
      } else {
        setFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Gagal menyimpan klaim individu.' });
    } finally {
      setSubmitting(false);
      setSelectedStudent(null);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Klaim Susulan & Individu (FR-3.2)"
        subtitle="Verifikasi penerimaan mandiri untuk siswa yang terlambat atau mengambil porsi susulan."
        badgeText="STAFF MODE"
      />

      {feedback && (
        <FeedbackBanner
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Search Input Box */}
      <div className="rounded-3xl border border-white/20 bg-white/70 p-5 shadow-lg backdrop-blur-xl">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nama siswa atau 10 digit NISN..."
              aria-label="Cari siswa untuk klaim susulan"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-300 bg-white text-base text-slate-800 placeholder-slate-400 shadow-sm focus:border-brand-blue focus:outline-none focus:ring-4 focus:ring-brand-blue/20 transition"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-6 py-3.5 rounded-2xl bg-brand-blue hover:bg-brand-blue-700 text-white text-base font-bold shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-4 focus:ring-brand-blue/30 focus:ring-offset-2"
          >
            {searching ? <RotateCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            Cari Siswa
          </button>
        </form>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="rounded-3xl border border-white/20 bg-white/80 p-5 sm:p-6 shadow-xl backdrop-blur-xl space-y-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
            Hasil Pencarian ({candidates.length} Siswa)
          </h3>

          {candidates.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {candidates.map((st) => (
                <div
                  key={st.id}
                  className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-base font-black text-slate-900">{st.nama}</h4>
                    <p className="text-sm text-slate-600">
                      NISN: {st.id} • Kelas: {st.nama_kelas} ({st.jurusan})
                    </p>
                  </div>

                  <div>
                    {st.sudah_menerima ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Sudah Menerima MBG
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleConfirmSingle(st)}
                        disabled={submitting && selectedStudent?.id === st.id}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white text-sm font-bold shadow-md transition active:scale-95 disabled:opacity-50"
                      >
                        <Utensils className="w-3.5 h-3.5" />
                        {submitting && selectedStudent?.id === st.id
                          ? 'Memproses...'
                          : 'Klaim Susulan 1 Porsi'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-xs text-slate-500">
              Tidak ada siswa yang cocok dengan kata kunci pencarian.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
