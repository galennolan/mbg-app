# MBG Tracker - Sistem Monitoring Makan Bergizi Gratis

Aplikasi monitoring kedatangan dan penerimaan Makan Bergizi Gratis (MBG) berbasis **Next.js 14 (App Router)** dan **Supabase (PostgreSQL)**, dibangun berdasarkan spesifikasi dokumen **PRD MBG Tracker Versi 1.1**.

---

## 🚀 Fitur Utama Sesuai PRD

### 1. Portal Siswa Mandiri (Akses Publik / QR Code)
- **Status Distribusi Real-Time**:
  - Saat MBG belum tiba (`menunggu`), halaman menampilkan informasi "MBG Belum Tiba", instruksi menunggu guru, dan tombol refresh status. Form pencarian dan konfirmasi dinonaktifkan demi integritas.
  - Saat MBG tiba (`tiba`), form pencarian aktif.
  - Saat distribusi ditutup (`ditutup`), transaksi baru ditolak.
- **Pencarian Cepat & Filter Privasi**:
  - Siswa mencari berdasarkan nama lengkap.
  - Tersedia filter kelas dan jurusan untuk membedakan nama yang mirip.
  - **Privasi Terjamin**: NISN, email, dan no HP siswa tidak ditampilkan ke publik.
- **Konfirmasi Satu Klik & Anti-Duplikasi (BR-01, BR-03)**:
  - Tombol **"Saya Sudah Menerima MBG"** dengan waktu server Asia/Jakarta (WIB).
  - Validasi database mencegah transaksi ganda (duplikat ditolak & menampilkan waktu transaksi awal).

### 2. Fitur Guru & Petugas MBG
- **Dashboard Operasional**:
  - Statistik utama: Total siswa aktif, sudah menerima, belum tercatat, persentase capaian.
  - Status kedatangan, jam tiba aktual, waktu penerimaan pertama dan terakhir.
  - Rekap otomatis per kelas dan per jurusan.
  - Daftar aktivitas konfirmasi terbaru.
- **Kedatangan MBG**:
  - Mencatat jam kedatangan aktual makanan di sekolah (dapat diedit bila guru terlambat menginput) dan waktu input server.
  - Opsi penutupan distribusi harian.
- **Konfirmasi Individu**:
  - Pencarian siswa manual untuk mencatat status: `diterima`, `tidak_hadir`, atau `tidak_mengambil`.
- **Konfirmasi Massal Per Kelas (FR-12, FR-13, FR-14)**:
  - Guru memilih kelas; seluruh siswa aktif yang belum tercatat otomatis terpilih.
  - Guru dapat meng-uncheck/unselect siswa yang tidak hadir.
  - Pratinjau daftar nama sebelum disimpan secara atomik.

### 3. Fitur Administrator
- **Data Siswa & Excel Import**:
  - CRUD data siswa dan toggle status aktif.
  - Import massal dari file Excel (`.xlsx`) atau `.csv`.
  - Tombol unduh template format Excel.
  - Tombol generate contoh data uji coba (10 siswa & kelas).
- **Manajemen Kelas & Jurusan**:
  - CRUD kelas (Tingkat X, XI, XII dan Jurusan).
- **Manajemen Akun Guru / Petugas**:
  - Pengelolaan akun guru dan administrator.
- **Poster & Pengaturan QR Code**:
  - Generate QR Code statis yang mengarah ke portal siswa.
  - Template poster siap cetak (Print / PDF) dengan panduan 3 langkah mudah siswa.
- **Audit Log (Riwayat Aktivitas)**:
  - Jejak digital seluruh perubahan penting dengan perbandingan JSON data sebelum dan sesudah.
- **Modul Laporan & Export**:
  - Laporan Harian, Laporan Per Siswa, dan Laporan Per Kelas.
  - Filter pencarian siswa, kelas, status, dan sumber konfirmasi.
  - Export langsung ke file Excel (`.xlsx`), file CSV, dan Cetak PDF.

---

## 🛠️ Menjalankan Aplikasi

### 1. Menjalankan Server Pengembangan (Dev)
```bash
npm run dev
```
Buka browser di `http://localhost:3000`.

### 2. Membangun untuk Produksi (Production Build)
```bash
npm run build
npm start
```

---

## 🗄️ Konfigurasi Supabase Database

File environment telah disiapkan di `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://gycsuicoresilralvgol.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_al9-J47ypKLsTUZ5kSYI3A_RosL_nwh
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_al9-J47ypKLsTUZ5kSYI3A_RosL_nwh
```

Skrip migrasi database lengkap tersedia di:
```
supabase/schema.sql
```
Skrip ini mencakup:
- 6 Tabel Inti (`pengguna`, `kelas`, `siswa`, `distribusi_mbg`, `penerimaan_mbg`, `riwayat_aktivitas`)
- Hak akses (Grants) untuk anon & authenticated
- Kebijakan Row Level Security (RLS)
- Stored Functions / RPC (`cari_siswa`, `konfirmasi_penerimaan_siswa`, `konfirmasi_massal_kelas`, dll.)
- Indeks kinerja pada tabel siswa dan transaksi.

---

## 🔑 Login Default & Akun Inisiasi

Pada halaman login (`/login`), terdapat tombol cepat inisiasi akun:
- **Akun Admin Percobaan**: `admin@mbg.sekolah.id`
- **Akun Guru Percobaan**: `guru@mbg.sekolah.id`
- **Password Default**: `Password123!`

