'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Search, RotateCw, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { RiwayatAktivitas } from '@/lib/types';
import { formatIndonesianDateTime } from '@/lib/utils';
import { Modal, ModalActions } from '@/components/ui/ModalField';
import { PageHeader, Input, Button } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AuditLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<RiwayatAktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<RiwayatAktivitas | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let localList: RiwayatAktivitas[] = [];
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('mbg_audit_logs');
          if (raw) localList = JSON.parse(raw);
        } catch {
          // ignore
        }
      }

      const { data } = await supabase
        .from('riwayat_aktivitas')
        .select('*, pengguna:pengguna_id(id, nama, email)')
        .order('waktu_aktivitas', { ascending: false })
        .limit(100);

      const dbList = (data as any as RiwayatAktivitas[]) || [];
      const combined = [...localList, ...dbList];
      const seen = new Set<string>();
      const unique = combined.filter((item) => {
        const key = `${item.aktivitas}|${item.waktu_aktivitas}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      unique.sort(
        (a, b) => new Date(b.waktu_aktivitas).getTime() - new Date(a.waktu_aktivitas).getTime()
      );
      setLogs(unique);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const actMatch = l.aktivitas.toLowerCase().includes(searchQuery.toLowerCase());
    const tableMatch = l.tabel_terkait.toLowerCase().includes(searchQuery.toLowerCase());
    const userMatch = l.pengguna?.nama?.toLowerCase().includes(searchQuery.toLowerCase());
    return actMatch || tableMatch || userMatch;
  });

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <PageHeader
        title="Log Riwayat Aktivitas Sistem"
        subtitle="Penelusuran jejak perubahan data, kedatangan MBG, dan transaksi penerimaan."
        badgeText="AUDIT & KEAMANAN"
      >
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={loadLogs}
          loading={loading}
          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
        >
          Muat Ulang Log
        </Button>
      </PageHeader>

      {/* Filter Bar */}
      <div className="micro-card rounded-2xl p-5">
        <Input
          label="Cari Aktivitas Audit"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan nama aktivitas, tabel, atau nama petugas..."
          leftIcon={<Search className="w-5 h-5" />}
        />
      </div>

      {/* Table Audit Logs */}
      <div className="micro-card rounded-2xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 font-semibold uppercase tracking-wider">
          <span>Menampilkan {filteredLogs.length} Aktivitas Terbaru</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Memuat audit log...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Belum ada catatan aktivitas di log sistem.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Aktivitas</th>
                  <th className="py-3 px-4">Tabel Terkait</th>
                  <th className="py-3 px-4">Pelaku / Petugas</th>
                  <th className="py-3 px-4 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition text-xs">
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {formatIndonesianDateTime(log.waktu_aktivitas)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      <span
                        className={`font-mono px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                          log.aktivitas === 'CORRECTION_BY_KEPSEK'
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : log.aktivitas.includes('CAMPAIGN') ||
                              log.aktivitas.includes('DAPODIK')
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        {log.aktivitas}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{log.tabel_terkait}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {log.pengguna?.nama || (log.pengguna_id ? 'Petugas' : 'Sistem / Siswa')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedDetail(log)}
                        className="micro-tap p-2 text-slate-600 hover:text-brand-blue rounded-lg hover:bg-slate-100 transition"
                        title="Lihat Detail JSON"
                        aria-label={`Lihat detail log ${log.aktivitas}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail JSON */}
      <Modal
        isOpen={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title="Detail Audit Log"
        size="lg"
      >
        {selectedDetail && (
          <div className="space-y-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="text-slate-500 font-mono text-xs">ID Aktivitas: {selectedDetail.id}</div>
              <div className="text-slate-800 font-bold">
                Aktivitas: {selectedDetail.aktivitas} ({selectedDetail.tabel_terkait})
              </div>
              <div className="text-slate-500">
                Waktu: {formatIndonesianDateTime(selectedDetail.waktu_aktivitas)}
              </div>
            </div>

            <div>
              <span className="block font-semibold text-slate-700 mb-1.5">
                Data Sesudah Perubahan:
              </span>
              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-xs font-mono max-h-48">
                {JSON.stringify(selectedDetail.data_sesudah, null, 2) || '(Kosong)'}
              </pre>
            </div>

            {selectedDetail.data_sebelum && (
              <div>
                <span className="block font-semibold text-slate-700 mb-1.5">
                  Data Sebelum Perubahan:
                </span>
                <pre className="p-4 bg-slate-900 text-amber-400 rounded-xl overflow-x-auto text-xs font-mono max-h-48">
                  {JSON.stringify(selectedDetail.data_sebelum, null, 2)}
                </pre>
              </div>
            )}

            <ModalActions
              onCancel={() => setSelectedDetail(null)}
              submitLabel="Tutup"
              submitType="button"
              onSubmit={() => setSelectedDetail(null)}
              variant="primary"
            />
          </div>
        )}
      </Modal>
      </div>
    </ProtectedRoute>
  );
}
