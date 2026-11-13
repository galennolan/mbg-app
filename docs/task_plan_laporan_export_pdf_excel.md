# TASK PLAN: OPTIMALISASI MENU LAPORAN, PRINT ISOLATION PDF & EKSPOR MULTI-FORMAT (EXCEL/CSV)

Dokumen ini merinci rencana implementasi perbaikan menyeluruh pada menu **Laporan (`/laporan`)** agar fitur **Cetak PDF, Ekspor Excel (`.xlsx`), dan Ekspor CSV** menghasilkan output dokumen yang rapi, profesional, terstruktur, informatif, dan sesuai dengan tab/filter yang sedang dipilih oleh pengguna.

---

## 1. Analisis Akar Masalah (Root Cause Analysis)

### Masalah 1: "Cetak PDF Mencetak Seluruh Halaman Web, Bukan Dokumen Laporan"
1. **Navigasi Global Tidak Terisolasi Saat Cetak:**
   - Komponen `<Sidebar />`, `<Navbar />`, `<BottomNavigation />`, dan wrapper utama di `src/app/layout.tsx` belum memiliki kelas `no-print`. Saat `window.print()` dipanggil, elemen navigasi web ikut tampil dan merusak tata letak cetak.
2. **Tidak Ada Layout Dokumen Khusus Cetak (Print Sheet):**
   - Halaman `/laporan` saat ini mencetak langsung kartu-kartu dashboard web (grid UI, tombol filter, tabs, form input) alih-alih merender formulir lembar kertas formal standar A4 (Kop Sekolah, Identitas Pelaksanaan, Tabel Bergaris Hitam, Kolom Tanda Tangan).
3. **Cetak Tidak Memperhatikan Tab yang Sedang Aktif (Tab-Aware):**
   - Saat pengguna membuka tab **Laporan Per Siswa**, **Laporan Per Kelas**, atau **Kejadian Khusus**, menekan tombol cetak tetap berusaha mencetak konten web biasa tanpa format dokumen cetak resmi yang sesuai dengan konteks tab tersebut.

### Masalah 2: "Ekspor Excel dan CSV Belum Spesifik per Tab & Kurang Rapi"
1. **Excel Export Tidak Tab-Aware:**
   - `handleExportExcel` selalu mengekspor satu file umum berisi 3 sheet statis tanpa memperhatikan tab yang sedang dilihat pengguna dan tanpa header keterangan sekolah yang rapi.
   - Lebar kolom (`!cols`) belum diset secara proporsional sehingga teks panjang di Excel sering terpotong atau bertumpuk.
2. **CSV Export Terbatas & Tidak Konsisten:**
   - `handleExportCSV` hanya memiliki percabangan untuk tab `kejadian`, sedangkan tab `harian` dan `kelas` tidak memiliki format CSV khusus (otomatis dialihkan ke data siswa).
   - Karakter UTF-8 BOM (`\uFEFF`) belum disematkan pada seluruh output CSV, menyebabkan karakter beraksen atau angka ID di Excel/Spreadsheet rentan rusak formatnya.

---

## 2. Solusi Desain & Standar Dokumen Laporan Resmi

### A. Print Isolation Architecture (CSS & Layout)
1. **Global Isolation (`src/app/layout.tsx` & `src/app/globals.css`):**
   - Tambahkan kelas `no-print` pada `<Sidebar />`, `<Navbar />`, `<BottomNavigation />`, dan `<SplashScreen />`.
   - Konfigurasi `@media print` ketat:
     ```css
     @media print {
       @page {
         size: A4 portrait;
         margin: 12mm 15mm 15mm 15mm;
       }
       body {
         background: #ffffff !important;
         color: #000000 !important;
         font-family: 'Times New Roman', Times, serif, system-ui;
       }
       .no-print {
         display: none !important;
       }
       .print-document-container {
         display: block !important;
       }
       tr, .print-avoid-break {
         break-inside: avoid !important;
         page-break-inside: avoid !important;
       }
     }
     ```
2. **Dedicated Print Document Component (`src/components/laporan/PrintReportDocument.tsx`):**
   - Layar web interaktif disembunyikan total saat cetak (`no-print`).
   - Dokumen formal hitam-putih hanya muncul saat mode print aktif (`hidden print:block`).
   - Desain formal mengikuti standar administrasi sekolah / instansi pemerintah:
     - **Kop Dokumen Resmi**: Logo/Nama Sekolah, NPSN, Alamat, Kontak, dan Tanggal Laporan.
     - **Garis Pembatas Ganda (Double Rule)** di bawah Kop Dokumen.
     - **Blok Identitas Pelaksanaan**: Hari/Tanggal, Waktu Kedatangan MBG, Mitra Penyedia SPPG, Status Kelayakan QC.
     - **Tabel Data Bergaris Solid** (`border-collapse`, `border-black`, background selang-seling abu-abu tipis untuk thead).
     - **Bagian Pengesahan (Signature Block)**: Dua kolom tanda tangan di bagian bawah halaman terakhir (Kiri: Kepala Sekolah / NIP, Kanan: Guru Piket / Koordinator MBG).

### B. Spesifikasi Template Dokumen Cetak Berdasarkan 4 Tabs
1. **Template Tab 1: Laporan Harian (Formulir Resmi MBG Sesuai PRD Bagian A, B, C):**
   - Ringkasan Kuota Sekolah (Total Siswa, Porsi Diterima, Porsi Belum Tercatat, % Penyerapan).
   - **Bagian A**: Uji Organoleptik & Waktu Kedatangan SPPG.
   - **Bagian B**: Rekapitulasi Rombel Kelas (Nama Kelas, Kuota, Diterima, Sisa, Status Wadah Ompreng).
   - **Bagian C**: Catatan Kejadian Khusus MBG pada tanggal terpilih (atau status "Nihil").
   - **Kolom Pengesahan**: Tanda tangan Kepala Sekolah & Guru Piket.
2. **Template Tab 2: Laporan Per Siswa:**
   - Judul: "DAFTAR PENERIMAAN MAKAN BERGIZI GRATIS (MBG) TINGKAT SISWA".
   - Keterangan filter aktif (contoh: *Semua Kelas* atau *Kelas: XII RPL 1*).
   - Tabel Rinci: No, Nama Lengkap Siswa, NISN (jika izin role aktif), Kelas, Jurusan, Status Penerimaan, Waktu Terima (WIB), Sumber Konfirmasi (Scan Mandiri / Guru Piket), Petugas Pencatat.
   - Baris Total Ringkasan: Total Siswa Hadir, Siswa Absen/Tidak Ambil, Total Kuota.
   - Kolom Tanda Tangan Pengesahan.
3. **Template Tab 3: Laporan Per Kelas:**
   - Judul: "REKAPITULASI PENYERAPAN MBG TINGKAT KELAS / ROMBEL".
   - Tabel Rinci: No, Nama Kelas, Tingkat, Jurusan, Total Kuota Siswa, Jumlah Diterima, Jumlah Sisa/Belum Ambil, Persentase Penyerapan (%), Status Rombel.
   - Baris Total Akumulasi Sekolah di bagian bawah tabel.
   - Kolom Tanda Tangan Pengesahan.
4. **Template Tab 4: Kejadian Khusus (Berita Acara Kejadian):**
   - Judul: "BERITA ACARA & LOG REKAPITULASI KEJADIAN KHUSUS MBG".
   - Keterangan rentang waktu dan filter kategori/keparahan yang diterapkan.
   - Tabel Rinci: No, Tanggal & Jam (WIB), Kategori Insiden, Tingkat Keparahan, Judul & Deskripsi Lengkap, Tindak Lanjut yang Dilakukan, Petugas Pelapor, Status Penyelesaian.
   - Kolom Tanda Tangan Penanggung Jawab MBG & Kepala Sekolah.

### C. Spesifikasi Ekspor Excel (`.xlsx`) Tab-Aware & Terstruktur
1. **Tata Letak Lembar Excel:**
   - Baris 1–4: Header Judul Laporan, Nama Sekolah, Tanggal/Rentang Waktu, Keterangan Filter.
   - Baris 5: Baris kosong pemisah.
   - Baris 6: Header Kolom Tabel.
   - Baris 7+: Data baris record.
   - Baris Terakhir: Baris ringkasan TOTAL dengan teks bold.
   - Properti `!cols` diatur dengan lebar karakter yang proporsional agar teks tidak terpotong saat dibuka.
2. **Behavior Ekspor Berdasarkan Tab:**
   - **Di Tab Harian**: Menghasilkan workbook multi-sheet terorganisir (Sheet 1: `Ringkasan Harian`, Sheet 2: `Rekap Kelas`, Sheet 3: `Daftar Siswa`, Sheet 4: `Kejadian Khusus`).
   - **Di Tab Siswa**: Menghasilkan file Excel khusus `Laporan_Siswa_MBG_[Kelas]_[Tanggal].xlsx` sesuai filter kelas & pencarian yang aktif.
   - **Di Tab Kelas**: Menghasilkan file Excel khusus `Laporan_Rekap_Kelas_MBG_[Tanggal].xlsx` berisi rincian kuota dan serapan per rombel.
   - **Di Tab Kejadian Khusus**: Menghasilkan file Excel khusus `Laporan_Kejadian_Khusus_MBG_[Filter]_[Tanggal].xlsx` berisi seluruh log insiden terfilter.

### D. Spesifikasi Ekspor CSV (`.csv`) Tab-Aware
1. **Encoding Standar**: Disertakan UTF-8 BOM (`\uFEFF`) agar seluruh karakter Indonesia dan angka numerik terbaca presisi tanpa error encoding di Excel.
2. **Data Sesuai Tab Aktif**:
   - Tab Harian: Export CSV ringkasan distribusi dan status porsi harian.
   - Tab Siswa: Export CSV daftar penerimaan siswa yang difilter.
   - Tab Kelas: Export CSV rekapitulasi kuota dan serapan per kelas.
   - Tab Kejadian: Export CSV catatan kejadian khusus sesuai filter aktif.
3. **Penamaan File Dinamis**:
   - `Laporan_Harian_MBG_DD-MM-YYYY.csv`
   - `Laporan_Siswa_MBG_DD-MM-YYYY.csv`
   - `Laporan_Kelas_MBG_DD-MM-YYYY.csv`
   - `Laporan_Kejadian_Khusus_DD-MM-YYYY.csv`

---

## 3. Checklist Rencana Kerja Implementasi (Task Breakdown)

### Tahap 1: Isolasi Cetak Global & CSS Print
- [ ] **Modifikasi `src/app/layout.tsx`**
  - Pasang kelas `no-print` pada `<Sidebar />`, `<Navbar />`, `<BottomNavigation />`, dan `<SplashScreen />`.
- [ ] **Modifikasi `src/app/globals.css`**
  - Sempurnakan aturan `@media print`:
    - Atur margin halaman A4 (`@page { size: A4 portrait; margin: 12mm 15mm; }`).
    - Pastikan seluruh bayangan (`box-shadow`), gradien latar belakang, dan border glassmorphism dinonaktifkan saat cetak.
    - Tambahkan kelas utilitas cetak: `.print-avoid-break`, `.print-table-header`, `.print-only-block`.

### Tahap 2: Pembuatan Komponen Lembar Cetak Resmi Tab-Aware
- [ ] **Buat Komponen `src/components/laporan/PrintReportDocument.tsx`**
  - Komponen menerima props data lengkap: `activeTab`, `selectedDate`, `distribusi`, `schoolInfo`, `kelasList`, `filteredReceipts`, `filteredIncidents`, `totalStats`, `filtersApplied`.
  - Merender sub-template berdasarkan `activeTab`:
    - `PrintHarianTemplate` (Formulir MBG Resmi Bagian A, B, C + Pengesahan).
    - `PrintSiswaTemplate` (Daftar Penerimaan Siswa + Pengesahan).
    - `PrintKelasTemplate` (Rekapitulasi Penyerapan Kelas + Pengesahan).
    - `PrintKejadianTemplate` (Berita Acara Kejadian Khusus + Pengesahan).
  - Sertakan Kop Sekolah Resmi yang mengambil nama sekolah, NPSN, dan nama kepala sekolah dari data sesi aktif (`SEED_SCHOOL` / Supabase).
  - Sertakan blok tanda tangan formal 2 kolom di bagian bawah dokumen.

### Tahap 3: Pembaruan Logika Ekspor Tab-Aware (Excel & CSV)
- [ ] **Refaktor `handleExportExcel` di `src/app/laporan/page.tsx`**
  - Percabangan pembuatan file Excel berdasarkan `activeTab`.
  - Format tabel dengan baris header keterangan instansi sekolah, tanggal, dan metadata filter.
  - Set kolom proporsional (`ws['!cols'] = [...]`) agar mudah dibaca di Microsoft Excel / LibreOffice.
  - Pemberian nama file dinamis sesuai tab dan tanggal.
- [ ] **Refaktor `handleExportCSV` di `src/app/laporan/page.tsx`**
  - Implementasikan pembuatan CSV khusus untuk ke-4 tabs: `harian`, `siswa`, `kelas`, dan `kejadian`.
  - Tambahkan UTF-8 BOM (`\uFEFF`) sebelum pembuatan blob data CSV.
  - Unduh otomatis dengan nama file deskriptif.

### Tahap 4: Integrasi & Penyempurnaan Tampilan Menu Laporan
- [ ] **Update `src/app/laporan/page.tsx`**
  - Bungkus seluruh antarmuka web interaktif (PageHeader, DatePicker, Tabs, Summary Cards, LaporanCharts, Filter Bar, dan Tabel Web) di dalam wrapper `<div className="no-print space-y-6 pb-12">`.
  - Sisipkan `<PrintReportDocument ... />` dengan kelas `hidden print:block`.
  - Update teks tombol aksi ekspor agar dinamis atau informatif (misal: "Export Excel (Tab Ini)", "Export CSV (Tab Ini)", "Cetak PDF (Tab Ini)").
  - Hubungkan fungsi cetak `handlePrint` dengan validasi kesiapan data sebelum memicu `window.print()`.

### Tahap 5: Verifikasi & Uji Kualitas
- [ ] **Type Check**: Jalankan `npx tsc --noEmit` untuk memastikan nol error TypeScript.
- [ ] **Build Validation**: Jalankan `npm run build` dan pastikan kompilasi Next.js lulus 100%.
- [ ] **Uji Print Preview Browser (Ctrl+P)** pada ke-4 tabs:
  - Uji tab *Laporan Harian*: Hanya formulir resmi Bagian A, B, C dan tanda tangan yang tercetak.
  - Uji tab *Laporan Per Siswa*: Hanya tabel rekap presensi siswa yang tercetak tanpa search box atau tombol web.
  - Uji tab *Laporan Per Kelas*: Hanya tabel serapan kelas yang tercetak.
  - Uji tab *Kejadian Khusus*: Hanya lembar berita acara insiden yang tercetak.
- [ ] **Uji Unduhan Excel & CSV** pada ke-4 tabs:
  - Buka file `.xlsx` dan periksa kelengkapan sheet serta kerapian kolom.
  - Buka file `.csv` dan pastikan format pemisah koma serta aksara Indonesia valid.
