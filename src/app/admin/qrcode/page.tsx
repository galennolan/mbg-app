'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ExternalLink, Utensils } from 'lucide-react';
import { PageHeader, Input, Button } from '@/components/ui';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminQRCodePage() {
  const [studentUrl, setStudentUrl] = useState('');
  const [schoolName, setSchoolName] = useState('SMK NEGERI CONTOH');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setStudentUrl(`${origin}/`);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'guru_piket', 'kepala_sekolah', 'guru']}>
      <div className="space-y-6 pb-12">
        {/* Control Bar (Hidden on Print) */}
      <div className="no-print">
        <PageHeader
          title="Poster & QR Code Siswa"
          subtitle="Cetak poster statis untuk ditempel di kelas, mading, atau titik pembagian makanan."
          badgeText="PENGATURAN QR CODE"
        >
          <Button
            type="button"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Cetak Poster (Print / PDF)
          </Button>
        </PageHeader>
      </div>

      {/* Editor Teks Poster (Hidden on Print) */}
      <div className="no-print micro-card rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <Input
          label="Nama Sekolah pada Poster"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
        />

        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Tautan Tujuan QR"
              readOnly
              value={studentUrl}
            />
          </div>
          <a
            href={studentUrl}
            target="_blank"
            rel="noreferrer"
            className="micro-tap inline-flex items-center justify-center min-h-[44px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition"
            title="Buka Halaman Siswa"
            aria-label="Buka halaman siswa di tab baru"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* POSTER KERTAS A4 (PRINT FRIENDLY) */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-card max-w-2xl mx-auto p-8 sm:p-12 text-center space-y-6">
        {/* Poster Header */}
        <div className="space-y-2 border-b-2 border-brand-navy/10 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-navy text-white flex items-center justify-center mx-auto shadow-sm">
            <Utensils className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-brand-navy tracking-tight uppercase">
            {schoolName}
          </h2>
          <div className="inline-block px-4 py-1 rounded-full bg-brand-blue text-white text-xs font-extrabold uppercase tracking-widest">
            MBG TRACKER • SISTEM MAKAN BERGIZI GRATIS
          </div>
        </div>

        {/* Poster Title */}
        <div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            SCAN QR UNTUK KONFIRMASI PENERIMAAN MAKAN SIANG
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Gunakan kamera ponsel Anda untuk memindai kode di bawah ini setiap selesai menerima makanan.
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300 inline-block shadow-inner">
          {studentUrl ? (
            <QRCodeSVG
              value={studentUrl}
              size={240}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: '/icon.png',
                x: undefined,
                y: undefined,
                height: 36,
                width: 36,
                excavate: true,
              }}
            />
          ) : (
            <div className="w-60 h-60 flex items-center justify-center text-slate-400">
              Menyiapkan QR...
            </div>
          )}
          <div className="text-[11px] font-mono text-slate-500 mt-2">{studentUrl}</div>
        </div>

        {/* 3 Langkah Mudah */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-brand-blue text-white font-black text-xs flex items-center justify-center mb-1.5">
              1
            </div>
            <div className="font-bold text-xs text-slate-800">Buka Kamera HP</div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Arahkan kamera ke QR Code atau buka tautan di browser.
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-brand-blue text-white font-black text-xs flex items-center justify-center mb-1.5">
              2
            </div>
            <div className="font-bold text-xs text-slate-800">Cari Nama Anda</div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Ketik nama lengkap Anda, lalu cocokkan dengan kelas.
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-brand-blue text-white font-black text-xs flex items-center justify-center mb-1.5">
              3
            </div>
            <div className="font-bold text-xs text-slate-800">Klik Konfirmasi</div>
            <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Tekan tombol &quot;Saya Sudah Menerima MBG&quot; untuk mencatat waktu.
            </div>
          </div>
        </div>

        {/* Catatan Kaki */}
        <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
          Jika makanan belum tiba atau data Anda tidak ditemukan, silakan hubungi Guru Pembina di
          kelas Anda.
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
