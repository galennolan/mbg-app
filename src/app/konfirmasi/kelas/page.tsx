'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import {
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Check,
  ArrowRight,
  Utensils,
  Building2,
  Users as UsersIcon,
  Plus,
} from 'lucide-react';
import {
  getTodayOrganolepticSession,
  getClassRoster,
  submitClassRepresentativeClaim,
  getClassesBySchool,
  SEED_CLASSES,
} from '@/lib/services';
import { OrganolepticTest, StudentRecord, Kelas } from '@/lib/types';
import { PageHeader, FeedbackBanner, Select, Input, Button, useNotify } from '@/components/ui';
import ClassModuleTabs from '@/components/navigation/ClassModuleTabs';

export default function KonfirmasiKelasPage() {
  const { user, activeSchoolId } = useAuth();
  const notify = useNotify();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<OrganolepticTest | null>(null);

  const [classList, setClassList] = useState<Kelas[]>(SEED_CLASSES as any);
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
      const sess = await getTodayOrganolepticSession(activeSchoolId);
      setSession(sess);

      // Fetch dynamic classes for active school
      try {
        const fetchedClasses = await getClassesBySchool(activeSchoolId);
        if (fetchedClasses && fetchedClasses.length > 0) {
          setClassList(fetchedClasses);
          if (!selectedClassId || !fetchedClasses.some((c) => c.id === selectedClassId)) {
            setSelectedClassId(fetchedClasses[0].id);
          }
        }
      } catch (err) {
        console.warn('Fallback to seed classes:', err);
      }

      if (selectedClassId) {
        const list = await getClassRoster(selectedClassId);
        setRoster(list);

        // Default: Select all students who haven't received yet
        const available = list.filter((s) => !s.sudah_ambil).map((s) => s.nisn);
        setSelectedNisns(new Set(available));
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Gagal memuat data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedClassId, activeSchoolId]);

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
      notify.warning('Belum Ada Siswa Dipilih', 'Pilih minimal satu siswa yang hadir.');
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const pin = session?.kode_pin_harian || '0000';
    const currentCls = SEED_CLASSES.find((c) => c.id === selectedClassId);
    try {
      const res = await submitClassRepresentativeClaim({
        classId: selectedClassId,
        attendedNisns: Array.from(selectedNisns),
        pinOrToken: pin,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        notify.fire({
          icon: 'success',
          title: 'Konfirmasi Kelas Berhasil Dikunci',
          text: res.message,
          badgeText: currentCls?.nama_kelas || 'KOLEKTIF KELAS',
          details: [
            { label: 'Kelas', value: `${currentCls?.nama_kelas} (${currentCls?.jurusan})` },
            { label: 'Porsi Terserap', value: `${res.berhasilCount} Porsi` },
            { label: 'Porsi Dilewati', value: `${res.dilewatiCount} Porsi` },
          ],
        });
        const updated = await getClassRoster(selectedClassId);
        setRoster(updated);
      } else {
        setFeedback({ type: 'error', message: res.message });
        notify.error('Gagal Menyimpan Konfirmasi', res.message);
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal menyimpan konfirmasi';
      setFeedback({ type: 'error', message: msg });
      notify.error('Gagal Menyimpan Konfirmasi', msg);
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
  const currentClass =
    classList.find((c) => c.id === selectedClassId) ||
    SEED_CLASSES.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
          title="Konfirmasi Kolektif Kelas (FR-3.2)"
          subtitle="Checklist massal penerimaan MBG per kelas oleh Guru Piket atau Wali Kelas."
          badgeText="STAFF MODE"
        >
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={loadData}
              loading={loading}
              leftIcon={<RotateCw className="w-3.5 h-3.5" />}
            >
              Segarkan
            </Button>
            <Link
              href="/dashboard"
              className="micro-tap inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-brand-navy hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition"
            >
              Live Monitor
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </PageHeader>

        {/* Master Data & Operasional Module Tabs */}
        <ClassModuleTabs />

        {feedback && (
          <FeedbackBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        )}

        {/* Class Selector, Search Bar & Quick CRUD Links */}
        <div className="micro-card rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Select
              label="Pilih Kelas"
              value={selectedClassId}
              onValueChange={(val) => setSelectedClassId(val)}
              options={classList.map((c) => ({
                value: c.id,
                label: `${c.nama_kelas} (${c.jurusan || 'Umum'} • ${c.total_siswa_dapodik || 0} Siswa)`,
              }))}
            />

            <Input
              label="Filter Daftar Siswa"
              value={searchRoster}
              onChange={(e) => setSearchRoster(e.target.value)}
              placeholder="Cari siswa atau NISN..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <span>Mau menambah kelas baru atau memperbarui daftar murid?</span>
            </span>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/kelas"
                className="inline-flex items-center gap-1.5 font-bold text-brand-blue hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5" />
                + Tambah / Edit Kelas
              </Link>
              <span className="text-slate-300">|</span>
              <Link
                href="/siswa"
                className="inline-flex items-center gap-1.5 font-bold text-brand-blue hover:text-blue-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors"
              >
                <UsersIcon className="w-3.5 h-3.5" />
                + Kelola Siswa & Import Excel
              </Link>
            </div>
          </div>
        </div>

      {/* Roster Checklist */}
      <div className="micro-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant={isAllSelected ? 'primary' : 'secondary'}
              size="sm"
              onClick={handleToggleSelectAll}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              {isAllSelected ? 'Batalkan Pilih Semua' : 'Pilih Semua Hadir (Default)'}
            </Button>
            <span className="text-xs text-slate-600 font-medium">
              {selectedNisns.size} dari {roster.length} terpilih
            </span>
          </div>

          <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
            <span className="text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
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
                role="checkbox"
                aria-checked={isClaimed || isSelected}
                aria-disabled={isClaimed}
                tabIndex={isClaimed ? -1 : 0}
                onClick={() => toggleStudent(student.nisn, isClaimed)}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleStudent(student.nisn, isClaimed);
                  }
                }}
                className={`min-h-[52px] py-3.5 px-3 rounded-xl flex items-center justify-between gap-3 transition cursor-pointer select-none ${isClaimed
                    ? 'opacity-60 bg-slate-50 cursor-not-allowed'
                    : isSelected
                      ? 'bg-blue-50/70 border border-blue-200'
                      : 'hover:bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition flex-shrink-0 ${isClaimed
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
                      className={`text-xs font-bold ${isClaimed ? 'text-slate-500 line-through' : 'text-slate-900'
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
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${isSelected ? 'text-brand-blue' : 'text-slate-400'
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
      <div className="sticky bottom-4 z-sticky rounded-2xl border border-slate-800 bg-brand-navy text-white p-4 sm:p-5 shadow-modal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        <Button
          type="button"
          size="lg"
          onClick={handleConfirmClass}
          disabled={submitting || hadirCount === 0}
          loading={submitting}
          leftIcon={<Utensils className="w-4 h-4" />}
        >
          Kunci Konfirmasi Kelas ({hadirCount} Porsi)
        </Button>
      </div>
    </div>
  );
}
