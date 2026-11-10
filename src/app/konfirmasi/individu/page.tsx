'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Search,
  CheckCircle2,
  Utensils,
} from 'lucide-react';
import {
  getTodayOrganolepticSession,
  searchStudentsForConfirmation,
  submitIndividualStudentClaim,
  CandidateStudent,
} from '@/lib/services';
import { OrganolepticTest } from '@/lib/types';
import { PageHeader, FeedbackBanner, Input, Button, useNotify } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function KonfirmasiIndividuPage() {
  const { user } = useAuth();
  const notify = useNotify();
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
    if (!searchQuery.trim()) {
      notify.warning('Kata Kunci Kosong', 'Masukkan nama siswa atau NISN untuk mencari.');
      return;
    }

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
        notify.success('Klaim Susulan Tercatat', `${student.nama} (${student.nama_kelas}) telah menerima 1 porsi MBG.`);
        // Refresh search list
        const results = await searchStudentsForConfirmation(searchQuery);
        setCandidates(results);
      } else {
        setFeedback({ type: 'error', message: res.message });
        notify.error('Klaim Gagal', res.message);
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal menyimpan klaim individu.';
      setFeedback({ type: 'error', message: msg });
      notify.error('Klaim Gagal', msg);
    } finally {
      setSubmitting(false);
      setSelectedStudent(null);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['guru_piket', 'kepala_sekolah', 'super_admin', 'admin', 'guru']}>
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
      <div className="micro-card rounded-2xl p-5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <Input
              label="Cari Siswa (Nama atau NISN)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik nama siswa atau 10 digit NISN..."
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <Button
            type="submit"
            loading={searching}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Cari Siswa
          </Button>
        </form>
      </div>

      {/* Results */}
      {hasSearched && (
        <div className="micro-card rounded-2xl p-5 sm:p-6 space-y-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
            Hasil Pencarian ({candidates.length} Siswa)
          </h2>

          {candidates.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {candidates.map((st) => (
                <div
                  key={st.id}
                  className="py-3.5 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h3 className="text-base font-black text-slate-900">{st.nama}</h3>
                    <p className="text-sm text-slate-600">
                      NISN: {st.id} • Kelas: {st.nama_kelas} ({st.jurusan})
                    </p>
                  </div>

                  <div>
                    {st.sudah_menerima ? (
                      <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Sudah Menerima MBG
                      </span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleConfirmSingle(st)}
                        loading={submitting && selectedStudent?.id === st.id}
                        leftIcon={<Utensils className="w-3.5 h-3.5" />}
                      >
                        Klaim Susulan 1 Porsi
                      </Button>
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
    </ProtectedRoute>
  );
}
