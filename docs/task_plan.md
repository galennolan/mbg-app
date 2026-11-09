# TASK PLAN IMPLEMENTATION - GURU PIKET FIRST

Berdasarkan keputusan untuk memprioritaskan **Dashboard Guru Piket** terlebih dahulu (Prinsip 2-Klik), rencana kerja ini telah diimplementasikan dan diverifikasi secara menyeluruh.

## 1. Tahap 1: Core MBG Arrival (Piket Dashboard)
Fokus pada halaman `/kedatangan` dan `/dashboard` untuk Guru Piket.

- [x] **Uji Organoleptik & QC Cepat (FR-2.2)**
  - Implementasi form checklist Aroma, Rasa, Tekstur, Wadah.
  - Default: "LAYAK EDAR" (1-klik selesai via tombol preset SOP).
  - Integrasi Kamera (1-Tap Photo) untuk dokumentasi fisik sampel makanan.
  - Checkbox konfirmasi penyimpanan 1 porsi sampel makanan (SOP keamanan pangan 2x24 jam).
- [x] **Trigger MBG Datang (FR-2.1)**
  - Tombol FAB (Floating Action Button) besar "🍽️ MBG Datang" untuk mobile & tombol aksi utama.
  - Backend/Service: Otomatis generate `master_qr_token` (dinamis harian) dan `kode_pin_harian` (4-digit acak).
  - Integrasi Push Notification ke siswa (Web Push API + Simulated In-App Broadcast Banner).
- [x] **Display Master QR & PIN**
  - Tampilan QR Code besar di layar Guru Piket dengan opsi tampilan layar penuh (Fullscreen).
  - Display PIN 4-digit besar sebagai fallback kamera rusak/buram dengan tombol 1-klik salin PIN.

## 2. Tahap 2: Live Monitoring (Anti-Fraud)
- [x] **Live Activity Feed (FR-4.1)**
  - Tampilan kronologis nama siswa/kelas yang sudah mengambil MBG secara real-time (auto-refresh interval).
  - Format Naratif: *"XII RPL 1 baru saja mengambil 30 porsi (10:02 WIB)"*, *"Ahmad Fathoni (XII RPL 1) klaim porsi mandiri (10:05 WIB)"*.
  - Label verifikasi anti-fraud dan tipe klaim (Kolektif Kelas, Mandiri, Susulan).
- [x] **Status Per Kelas**
  - Progress bar dinamis porsi yang sudah terserap vs sisa porsi per kelas.
  - Indikator status (`Belum Diambil`, `Terserap Sebagian`, `✓ Selesai 100%`).
  - Ringkasan metrik kuota: Total Siswa, Porsi Terserap, Sisa Porsi (Absen), dan Capaian Distribusi.

## 3. Tahap 3: Student Interaction (Halaman Siswa)
- [x] **Scanner & PIN Input (FR-3.1)**
  - Implementasi kamera scanner dengan viewfinder overlay di PWA Siswa (`/`).
  - Fallback input PIN 4-digit dengan 4 kotak digit otomatis beralih fokus.
  - Tombol simulasi 1-klik tes scan untuk kemudahan pengujian.
- [x] **Interactive Checklist (FR-3.2)**
  - "Select All" default hadir (semua siswa yang belum ambil otomatis tercentang demi kecepatan perwakilan kelas).
  - Indikator Alergi Makanan (`⚠️ Alergi Telur`, `⚠️ Alergi Kacang & Seafood`, dll.) beraksen amber.
  - Idempotency Lock: Mencegah klaim ganda — siswa yang sudah mengambil otomatis dikunci dengan badge hijau dan checkbox nonaktif.
  - Floating bar rekapitulasi bawah: `Hadir = X Siswa | Absen (Porsi Sisa) = Y Siswa`.
  - Konfirmasi 1-klik dengan modal perayaan & banner promosi Beasiswa UBSI (Smart EdTech CRM).

## 4. Tahap 4: Role Management & UI Polish
- [x] **RBAC (Role-Based Access Control)**
  - Batasi akses menu di Navbar dan BottomNavigation berdasarkan peran aktif (`guru_piket` vs `siswa`).
  - Guru Piket: Akses Kedatangan, Live Dashboard, Konfirmasi Kelas, dan Laporan.
  - Siswa: Fokus pada Portal Scan & Input PIN MBG.
  - Dilengkapi Role Switcher di Navbar untuk kemudahan beralih peran saat pengujian / demonstrasi.
- [x] **Glassmorphism UI Polish**
  - Penerapan menyeluruh Design Tokens dari `docs/dbd.md`:
    - Brand UBSI Royal Blue (`bg-blue-900`, `bg-blue-950/95`) & Light Cyan (`text-sky-200`, `text-cyan-300`).
    - Aksen Crimson Red (`bg-red-600`) untuk tombol aksi utama dan CTA Smart Banner.
    - Efek Glassmorphism: `backdrop-blur-xl`, `border-white/20`, bayangan lembut, dan kontras tinggi yang ramah aksesibilitas.
