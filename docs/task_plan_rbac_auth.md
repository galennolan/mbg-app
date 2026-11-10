# TASK PLAN: AUTHENTICATION REFACTOR & ADVANCED RBAC

Rencana kerja ini bertujuan untuk mengimplementasikan sistem autentikasi ganda (Staff vs Siswa) dan manajemen hak akses (RBAC) sesuai dengan spesifikasi PRD terbaru.

## 1. Tahap 1: Refaktor Autentikasi (Dual-Mode Login)
**Goal:** Memisahkan alur login antara Staff (Email) dan Siswa (Nama + HP).

- [x] **Modifikasi `src/lib/auth-context.tsx`**
    - Tambahkan state `student` dan `isStudent` ke dalam Context.
    - Buat fungsi `signInStudent(nama: string, no_hp: string)` yang melakukan query ke tabel `students`.
    - Simpan session siswa ke `localStorage` agar persisten (Offline-First).
- [x] **Halaman Login Baru (`/login`)**
    - Buat Tab Switcher: "Login Petugas" (Email/Pass) vs "Login Siswa" (Nama/HP).
    - Implementasi validasi format nomor HP (`628xxx`) saat input.

## 2. Tahap 2: Implementasi RBAC Middleware & Menu Guarding
**Goal:** Memastikan user hanya bisa melihat menu yang diizinkan.

- [x] **Update `src/components/navigation/BottomNavigation.tsx`**
    - Buat mapping array menu dengan properti `allowedRoles`.
    - Filter menu yang tampil berdasarkan `role` dari session (Staff) atau kategori `siswa`.
- [x] **Route Guarding (HOC/Middleware)**
    - Buat wrapper component `ProtectedRoute` untuk memproteksi halaman sensitif.
    - Contoh: Hanya `super_admin` yang bisa akses `/admin/pengguna`.
    - Contoh: `siswa` otomatis dilempar ke `/` jika mencoba akses `/kedatangan`.

## 3. Tahap 3: Master Menu & Campaign Manager (Super Admin)
**Goal:** Memberikan kontrol penuh bagi tim Marcomm UBSI.

- [x] **Modul Campaign Management (`/admin/campaign`)**
    - Buat tabel `crm_campaigns` (jika belum ada) dengan field `status_aktif` (Boolean).
    - Halaman CRUD Campaign: Judul, Banner Image, Link WhatsApp, Targeting Jurusan.
    - Fitur Toggle On/Off untuk mengaktifkan/menonaktifkan iklan yang muncul di HP siswa.
- [x] **Master Data Pulling Tool**
    - Tombol "Sync Master Data" di dashboard Super Admin untuk simulasi penarikan data Dapodik terbaru.

## 4. Tahap 4: Correction Mode (Kepala Sekolah)
**Goal:** Hak koreksi data pasca-operasional.

- [x] **Update UI Dashboard Analytics**
    - Tambahkan tombol "Edit Data" pada tabel rekapitulasi hanya jika user adalah `kepala_sekolah` atau `super_admin`.
    - Implementasi Modal Koreksi: Edit jumlah hadir/absen jika ada kekeliruan input oleh Guru Piket.
    - Catat setiap koreksi ke dalam `audit_logs` dengan label "CORRECTION_BY_KEPSEK".

## 5. Tahap 5: Auto-Account Generation (Import Engine)
**Goal:** Otomatisasi pendaftaran akun siswa.

- [x] **Update Import Service (`src/lib/services.ts`)**
    - Perbarui logika `insert` pada tabel `students` agar nomor HP yang masuk otomatis menjadi kunci akses login.
    - Pastikan tidak ada duplikasi No. HP + Nama di satu sekolah.

---

**Panduan Eksekusi AI Agent:**
1. Mulai dari `auth-context.tsx` untuk menyiapkan pondasi data user.
2. Lanjutkan ke filter UI di `BottomNavigation.tsx`.
3. Selesaikan fitur Campaign Manager sebagai Master Menu utama Super Admin.
