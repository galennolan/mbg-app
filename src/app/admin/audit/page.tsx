'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { History, ShieldCheck, Search, Filter, RotateCw, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { RiwayatAktivitas } from '@/lib/types';
import { formatIndonesianDateTime } from '@/lib/utils';

export default function AuditLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<RiwayatAktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetail, setSelectedDetail] = useState<RiwayatAktivitas | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('riwayat_aktivitas')
        .select('*, pengguna:pengguna_id(id, nama, email)')
        .order('waktu_aktivitas', { ascending: false })
        .limit(100);

      if (data) {
        setLogs(data as any);
      }
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-semibold mb-2 border border-amber-200">
            <History className="w-3.5 h-3.5" />
            Audit & Keamanan
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
            Log Riwayat Aktivitas Sistem
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Penelusuran jejak perubahan data, kedatangan MBG, dan transaksi penerimaan
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Muat Ulang Log
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama aktivitas, tabel, atau nama petugas..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue"
          />
        </div>
      </div>

      {/* Table Audit Logs */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
          <span>Menampilkan {filteredLogs.length} Aktivitas Terbaru</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Memuat audit log...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Belum ada catatan aktivitas di log sistem.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
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
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className="font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                        {log.aktivitas}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{log.tabel_terkait}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {log.pengguna?.nama || (log.pengguna_id ? 'Petugas' : 'Sistem / Siswa')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedDetail(log)}
                        className="p-1.5 text-slate-600 hover:text-brand-blue rounded-lg hover:bg-slate-100 transition"
                        title="Lihat Detail JSON"
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
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-base text-slate-900">Detail Audit Log</h3>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-500">ID Aktivitas: {selectedDetail.id}</div>
                <div className="text-slate-800 font-bold">
                  Aktivitas: {selectedDetail.aktivitas} ({selectedDetail.tabel_terkait})
                </div>
                <div className="text-slate-500">
                  Waktu: {formatIndonesianDateTime(selectedDetail.waktu_aktivitas)}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Data Sesudah Perubahan:
                </label>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono max-h-48">
                  {JSON.stringify(selectedDetail.data_sesudah, null, 2) || '(Kosong)'}
                </pre>
              </div>

              {selectedDetail.data_sebelum && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Data Sebelum Perubahan:
                  </label>
                  <pre className="p-3 bg-slate-900 text-amber-400 rounded-xl overflow-x-auto text-[11px] font-mono max-h-48">
                    {JSON.stringify(selectedDetail.data_sebelum, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedDetail(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

