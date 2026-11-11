# TASK PLAN: VISUALISASI GRAFIK DASHBOARD "MONITOR" & "LAPORAN"

Dokumen ini merinci rencana implementasi lengkap untuk menambahkan **grafik visualisasi data** yang informatif, ringkas, sumatif, dan mudah dibaca pada dua menu utama:
1. **Menu Monitor (`/dashboard`)**: Pemantauan operasional real-time harian.
2. **Menu Laporan (`/laporan`)**: Analisis data historis, tren serapan, food waste, dan kepatuhan SPPG.

---

## 1. Desain & Prinsip Visualisasi
- **Teknologi**: Menggunakan SVG murni + Tailwind CSS tanpa library charting berat eksternal, menjaga performa PWA tetap cepat dan ringan.
- **Aksesibilitas (Usia 40+)**:
  - Ukuran font label minimal `text-xs`/`text-sm` dengan kontras tinggi (WCAG AA).
  - Target sentuh (touch target) pada tooltip dan bar minimal 44x44px.
  - Skema warna konsisten dengan Brand UBSI: Royal Blue (`#1E3A8A`), Cyan (`#06B6D4`), Emerald (`#10B981`), Amber (`#F59E0B`), dan Rose (`#F43F5E`).
- **Sumatif & Sekali Lirik**: Menampilkan angka persentase besar, ringkasan perbandingan porsi, dan indikator tren.

---

## 2. Modul Visualisasi Menu "Monitor" (`src/app/dashboard/page.tsx`)

### Komponen Grafik yang Dibuat:
- [x] **1. Donut Gauge: Rasio Serapan MBG Hari Ini**
  - Lingkaran donut SVG interaktif dengan persentase serapan besar di tengah (contoh: **85% Terserap**).
  - 3 segmen warna:
    - **Hijau Emerald**: Porsi terserap / sudah diambil.
    - **Kuning Amber**: Porsi sisa / siswa absen (tersedia untuk klaim susulan).
    - **Abu-abu Slate**: Menunggu proses distribusi.
  - Legenda interaktif dengan rincian angka riil (contoh: `165 / 193 Porsi`).

- [x] **2. Bar Chart Horisontal Komparatif: Serapan per Jurusan & Tingkat**
  - Perbandingan tingkat serapan antar jurusan sekolah (RPL, TKJ, DKV, Akuntansi, dll.) dan tingkat (X, XI, XII).
  - Menampilkan progress bar bertingkat dengan persentase dan jumlah siswa hadir vs kuota.
  - Membantu Guru/Kepala Sekolah mengetahui jurusan mana yang sudah selesai 100% dan yang belum mengambil porsi.

- [x] **3. Timeline Histogram: Puncak Jam Pengambilan (Peak Hours)**
  - Histogram distribusi waktu pengambilan per interval 15 menit (09:30–09:45, 09:45–10:00, 10:00–10:15, >10:15 WIB).
  - Menunjukkan puncak kepadatan antrean di meja transit dan waktu klaim susulan.

- [x] **4. Mini Health Bar: Integritas Wadah & Ompreng**
  - Stacked bar visual rasio Ompreng Utuh, Rusak, dan Hilang untuk akuntabilitas aset SPPG.

---

## 3. Modul Visualisasi Menu "Laporan" (`src/app/laporan/page.tsx`)

### Komponen Grafik yang Dibuat:
- [x] **1. Multi-Bar Comparison Chart: Serapan Porsi per Kelas (Komparasi Harian)**
  - Bar vertikal komparatif untuk setiap kelas yang menampilkan:
    - Batang Porsi Diterima (Hadir) berwarna Hijau.
    - Batang Porsi Tidak Hadir (Absen) berwarna Amber.
  - Rata-rata persentase serapan sekolah ditampilkan sebagai garis benchmark visual (*dashed target line*).

- [x] **2. Donut / Breakdown Chart: Evaluasi Kelayakan QC Organoleptik & Food Waste**
  - Visualisasi ringkas hasil uji kelayakan (Layak Edar vs Retur/Catatan).
  - Breakdown status sisa porsi dan estimasi *food waste* harian.

- [x] **3. Visual Ringkasan Kepatuhan Waktu Tiba SPPG**
  - Gauge / indikator grafis waktu tiba: Tepat Waktu (sebelum 10:30 WIB) vs Terlambat.
  - Rata-rata waktu kedatangan SPPG dalam rentang filter laporan.

- [x] **4. Integrasi Tampilan Cetak (Print Stylesheet Isolation)**
  - Saat mode cetak PDF aktif (`@media print`), grafik disederhanakan ke bentuk ringkasan tabel dan metrik hitam-putih formal agar hemat tinta dan rapi.

---

## 4. Checklist File yang Dibuat & Dimodifikasi

- [x] **File Baru**: `src/components/dashboard/DashboardCharts.tsx` (Komponen visualisasi grafik untuk Dashboard Monitor).
- [x] **File Baru**: `src/components/laporan/LaporanCharts.tsx` (Komponen visualisasi grafik untuk Laporan).
- [x] **Update**: `src/app/dashboard/page.tsx` (Integrasi visualisasi grafik di bawah summary stat cards).
- [x] **Update**: `src/app/laporan/page.tsx` (Integrasi visualisasi grafik di bawah filter bar dan sebelum tabel rincian).
- [x] **Update**: `src/lib/services.ts` (Helper fungsi agregasi data grafik per jurusan, kelas, dan rentang waktu).

---

## 5. Rencana Verifikasi
- [x] Jalankan `npx tsc --noEmit` untuk memastikan tidak ada kesalahan tipe TypeScript.
- [x] Jalankan `npm run build` untuk memverifikasi kompilasi produksi Next.js.
- [x] Cek responsivitas tampilan grafik pada layar smartphone (360px–420px) dan desktop (>1024px).
- [x] Pastikan tampilan fallback rapi saat data masih kosong (*empty state*).
