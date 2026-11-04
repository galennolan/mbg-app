# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Nama Produk:** Nutri Kampus Hub (Sistem Manajemen MBG Sekolah & Smart EdTech CRM)  
**Platform:** Progressive Web App (PWA) — Responsive Mobile & Desktop  
**Versi Dokumen:** 1.0  
**Status:** Ready for Architecture & Development  
**Inisiator Produk:** Tim Pengembang & Marketing Komunikasi UBSI  

---

## 1. Ringkasan Eksekutif & Visi Produk

### 1.1 Latar Belakang Masalah
1. **Inefisiensi Operasional MBG di Sekolah:** Proses pencatatan kehadiran siswa untuk kuota porsi makan, uji kelayakan makanan (organoleptik) dari Satuan Pelayanan Pemenuhan Gizi (SPPG), hingga rekonsiliasi pengembalian wadah (ompreng) masih dilakukan secara manual di atas kertas. Hal ini rawan selisih data, keterlambatan rekapitulasi, kehilangan ompreng, dan sulitnya memantau limbah pangan (*food waste*).
2. **Tantangan Akuisisi Data Calon Mahasiswa (PMB):** Tim pemasaran kampus membutuhkan saluran komunikasi yang organik, tervalidasi sesuai data Dapodik, dan relevan dengan jurusan siswa (khususnya kelas XII SMA/SMK) tanpa terlihat seperti iklan *spam* konvensional.

### 1.2 Solusi & Visi Produk
Membangun **Progressive Web App (PWA)** berdesain modern (*Glassmorphism*) yang mengotomatiskan 100% siklus harian Program Makan Bergizi Gratis (MBG) di sekolah menggunakan sistem *Double-Scan QR Code*, sekaligus mengintegrasikan mesin rekomendasi cerdas (*Smart Banner CTA*) yang menghubungkan siswa dengan program beasiswa, *tryout*, dan pendaftaran mahasiswa baru di Universitas Bina Sarana Informatika (UBSI) berdasarkan pemetaan jurusan mereka.

---

## 2. Target Pengguna & Matriks Hak Akses (RBAC)

| Role Pengguna | Perangkat Utama | Fokus Utama & Hak Akses |
| :--- | :--- | :--- |
| **Super Admin** (Tim Dev & Marcomm UBSI) | Desktop / Laptop | Manajemen multi-sekolah, sinkronisasi master data Dapodik, konfigurasi kampanye iklan/CTA PMB berbasis segmen jurusan, dan ekspor *leads* ke gateway CRM WhatsApp/Email. |
| **Admin Guru Piket** (Koordinator MBG) | Smartphone / Tablet | Input hasil uji organoleptik, pemindaian QR Code distribusi (*check-out* porsi & *check-in* ompreng), input *food waste*/kejadian khusus, dan cetak laporan resmi PDF. |
| **Perwakilan Siswa** (Ketua Kelas) | Smartphone (PWA) | Input presensi harian kelas sebelum *cut-off time*, menampilkan QR Code dinamis kelas, tanda tangan digital serah terima, dan interaksi dengan fitur promo/beasiswa UBSI. |
| **Kepala Sekolah** (Monitoring/Viewer) | Desktop / Smartphone | Akses *read-only* ke *dashboard* eksekutif (grafik serapan porsi, ketepatan waktu SPPG, statistik *food waste*, dan pengesahan laporan harian). |

---

## 3. Tujuan Bisnis & Metrik Keberhasilan (Success Metrics / KPI)

### 3.1 Metrik Operasional Sekolah (MBG)
* **Zero Discrepancy:** 100% kecocokan antara jumlah ompreng yang didistribusikan ke kelas dengan yang dikembalikan ke area transit.
* **Kecepatan Administrasi:** Waktu rekapitulasi laporan harian MBG turun dari $>45$ menit (manual kertas) menjadi **$< 2$ menit** (otomatis terbit PDF setelah kelas terakhir mengembalikan ompreng).
* **Food Waste Tracking:** 100% porsi sisa tercatat beserta alasannya untuk evaluasi berkala bersama pihak SPPG.

### 3.2 Metrik Strategis Kampus (CRM & PMB UBSI)
* **Validasi Database:** 100% nomor WhatsApp siswa terformat standar internasional (`628xxx`) dan terpetakan sesuai jurusan (IPA, IPS, RPL, TKJ, Akuntansi, dll.).
* **Click-Through Rate (CTR):** Minimal **15% CTR** pada *Smart Banner* beasiswa/tryout UBSI yang tampil di halaman Ketua Kelas/Siswa kelas XII.
* **Lead Conversion:** Pertumbuhan jumlah siswa kelas XII yang terhubung langsung ke alur WhatsApp CRM PMB UBSI dari sekolah mitra pengguna aplikasi.

---

## 4. Alur Pengguna Utama (Core User Flows & State Machine)

### 4.1 Siklus Harian Status Distribusi Kelas (State Machine)
Setiap kelas memiliki status harian yang bergerak secara sekuensial:
1. **`DRAFT` (06:30 – 07:30 WIB):** Ketua kelas menginput jumlah siswa hadir dan absen.
2. **`QUOTA_LOCKED` (07:30 WIB):** Kuota porsi kelas terkunci otomatis atau lewat konfirmasi Guru Piket. Data total porsi terkirim ke layar pantau SPPG/Sekolah. QR Code Kelas diterbitkan dengan status *Menunggu Makanan*.
3. **`READY_FOR_PICKUP` (Saat Makanan Tiba, misal 09:30 WIB):** Guru Piket menyelesaikan **Form Uji Organoleptik** dengan hasil **"LAYAK EDAR"**. Status QR Code siswa berubah menjadi *Siap Diambil* (Hijau). *(Catatan: Jika hasil uji "TIDAK LAYAK EDAR / TOLAK", alur distribusi otomatis diblokir oleh sistem).*
4. **`DISTRIBUTED` (Jam Makan, misal 09:40 WIB):** Perwakilan siswa (4–5 orang) ke meja transit. Guru Piket melakukan **Scan QR ke-1 (Check-Out)**. Porsi diserahkan untuk disantap di kelas (didahului CTPS & doa bersama).
5. **`COMPLETED` (Selesai Makan, misal 10:30 WIB):** Perwakilan siswa mengembalikan ikatan ompreng ke meja transit. Guru Piket melakukan **Scan QR ke-2 (Check-In)**, menginput jumlah ompreng kembali, mencatat porsi sisa (*food waste*), dan perwakilan siswa membubuhkan tanda tangan digital di layar perangkat Guru Piket.

---

## 5. Kebutuhan Fungsional (Functional Requirements)

### Modul 1: Otentikasi & Manajemen Master Data (Super Admin)
* **FR-1.1 (Import & Validasi Dapodik):** Sistem menyediakan fitur unggah massal (CSV/Excel) untuk data siswa dengan validasi ketat:
  * `nisn`: Wajib 10 digit angka unik (Primary Key). Tolak otomatis jika terdeteksi duplikasi lintas sekolah.
  * `no_hp`: Auto-sanitizer yang mengubah awalan `08...` atau `+628...` menjadi `628...` saat data disimpan.
* **FR-1.2 (Manajemen Kelas & Kuota):** Sinkronisasi jumlah total siswa terdaftar per kelas (`total_siswa_dapodik`) sebagai batas atas (*ceiling limit*) saat input kehadiran harian.

### Modul 2: Presensi Pagi & QR Pass (Perwakilan Siswa / Ketua Kelas)
* **FR-2.1 (Input Kehadiran Harian):** Form input jumlah siswa hadir. Sistem otomatis menghitung $\text{Siswa Absen} = \text{Total Siswa Dapodik} - \text{Siswa Hadir}$. Input tidak boleh melebihi total siswa terdaftar.
* **FR-2.2 (Dynamic QR Code Generator):** Menghasilkan QR Code terenkripsi yang memuat payload `{id_log, id_kelas, tanggal, kuota_porsi, current_status}`.

### Modul 3: Quality Control / Uji Organoleptik (Admin Guru Piket)
* **FR-3.1 (Form Bagian A - Uji Kelayakan):** Form digital wajib isi sebelum fitur *Scan QR Distribusi* terbuka, meliputi:
  * Nama SPPG Mitra & Waktu Tiba (`HH:MM` WIB) beserta indikator otomatis *Tepat Waktu / Terlambat*.
  * Parameter Ceklis Radio Button:
    * **Aroma Makanan:** `[Segar/Normal]` atau `[Asam/Aneh]`
    * **Rasa Makanan:** `[Layak Konsumsi]` atau `[Kurang Layak]`
    * **Tekstur Makanan:** `[Matang Sempurna]` atau `[Basi/Mentah]`
    * **Kebersihan Wadah:** `[Bersih & Tertutup]` atau `[Kotor/Terbuka]`
  * Catatan Keterangan per parameter.
  * Keputusan Final: **`LAYAK EDAR`** (Membuka kunci distribusi) atau **`TIDAK LAYAK EDAR / RETUR`** (Mengirim peringatan ke Kepala Sekolah & mengunci distribusi).

### Modul 4: Pemindaian QR, Rekonsiliasi Ompreng & Tanda Tangan (Admin Guru Piket)
* **FR-4.1 (Web-Based Camera Scanner):** Pemindai QR langsung melalui browser menggunakan kamera smartphone/tablet Guru Piket tanpa perlu menginstal aplikasi pihak ketiga.
* **FR-4.2 (Rekonsiliasi Bagian B & Digital Signature):** Saat Scan QR ke-2 (Pengembalian), muncul *modal pop-up* berisi:
  * Input jumlah ompreng kembali (sistem memberi *warning* merah jika $\text{Ompreng Kembali} < \text{Porsi Diberikan}$).
  * Input jumlah porsi makanan yang tidak habis (*food waste*) dan alasannya (misal: siswa sakit di UKS, porsi berlebih).
  * Kanvas **Tanda Tangan Digital** (*touch signature pad*) untuk ditandatangani perwakilan siswa secara langsung.
* **FR-4.3 (Form Bagian C - Catatan Kejadian Khusus):** Textarea untuk mencatat insiden harian (alergi siswa, keterlambatan ekstrim, kendala teknis).

### Modul 5: Generator Laporan Resmi & Dashboard (Guru Piket & Kepala Sekolah)
* **FR-5.1 (Auto-Generate Formulir Pencatatan Harian MBG):** Tombol cetak PDF/Print yang menyusun data harian ke dalam tata letak dokumen resmi **Formulir Pencatatan Harian Program Makan Bergizi Gratis (MBG)** lengkap dengan:
  * Header Identitas Pelaksanaan (Nama Sekolah, Hari/Tanggal, Nama Guru Piket, Nama SPPG Mitra).
  * Tabel **Bagian A** (Hasil Uji Organoleptik).
  * Tabel **Bagian B** (Data Rekapitulasi Distribusi per Kelas beserta *render* tanda tangan digital siswa dan baris TOTAL otomatis).
  * Kolom **Bagian C** (Catatan Kejadian Khusus & Tindak Lanjut).
  * Footer **Pengesahan Laporan** (Kolom tanda tangan Kepala Sekolah & Guru Piket/Koordinator MBG).
* **FR-5.2 (Executive Analytics):** Grafik visual untuk Kepala Sekolah yang menampilkan tren kehadiran, persentase *food waste* mingguan/bulanan, dan skor ketepatan waktu pengiriman SPPG.

### Modul 6: Smart EdTech CRM & PMB Targeting Engine (Super Admin & Siswa)
* **FR-6.1 (Rule-Based Major Matching):** Mesin pencocokan otomatis yang menampilkan *banner* interaktif di layar PWA Siswa (khususnya tingkat kelas XII) berdasarkan atribut `jurusan`:
  * `RPL / TKJ / Multimedia / IPA` $\rightarrow$ Kampanye **Fakultas Teknik & Informatika UBSI** (Beasiswa Talenta Digital, Tryout Koding/UTBK).
  * `Akuntansi / Perkantoran / Pemasaran / IPS` $\rightarrow$ Kampanye **Fakultas Ekonomi & Bisnis UBSI**.
  * `Bahasa / Lainnya` $\rightarrow$ Kampanye **Fakultas Komunikasi & Bahasa UBSI**.
* **FR-6.2 (One-Tap WhatsApp CRM CTA):** Saat siswa mengeklik tombol CTA pada *banner*, sistem mencatat *log klik* (`lead_captured`) dan mengarahkan ke API WhatsApp PMB UBSI dengan teks pesan yang sudah dipersonalisasi otomatis menggunakan variabel `nama_lengkap`, `kelas`, dan `asal_sekolah`.

---

## 6. Kebutuhan Non-Fungsional & Panduan UI/UX (Non-Functional Requirements)

### 6.1 Desain Visual: Modern Glassmorphism
* **Aesthetic Direction:** Dirancang agar disukai oleh Gen Milenial (Guru muda), Gen Z (Siswa SMA/SMK), dan Gen Alpha.
* **Komponen Glassmorphism:**
  * Latar belakang utama menggunakan *animated mesh gradient* lembut (kombinasi warna *Electric Blue*, *Cyber Purple*, dan *Mint Green*).
  * Kartu konten (*Card*) menggunakan latar semi-transparan (`background: rgba(255, 255, 255, 0.25)`), efek buram (`backdrop-filter: blur(16px)`), dan garis tepi halus (`border: 1px solid rgba(255, 255, 255, 0.4)`).
* **Kontras & Aksesibilitas:** Teks utama tetap menggunakan warna kontras tinggi (*Deep Slate* `#0F172A` pada mode terang atau *Pure White* pada area gelap) agar mudah dibaca di bawah cahaya matahari saat di koridor sekolah.
* **Print Stylesheet Isolation:** Saat mencetak laporan resmi PDF (`@media print`), seluruh gaya *Glassmorphism* otomatis dinonaktifkan dan berubah menjadi format dokumen formal hitam-putih/grayscale yang bersih dan hemat tinta.

### 6.2 Performa & Keandalan PWA
* **Installable PWA:** Dilengkapi `manifest.json` dan *Service Worker* sehingga siswa dan guru dapat menambahkan ikon aplikasi langsung ke *Home Screen* HP tanpa melalui Play Store / App Store.
* **Kecepatan Scan QR:** Proses dekode kamera dan respons validasi API tidak boleh lebih dari **1,5 detik** dalam kondisi jaringan 4G standar.
* **Keamanan Data (Data Privacy):** Kata sandi dienkripsi dengan `bcrypt`, endpoint API dilindungi autentikasi berbasis token (JWT/Session), dan data sensitif siswa (NISN, No. HP) hanya dapat diakses oleh *role* berwenang (Super Admin).

---

## 7. Spesifikasi Skema Database (Data Model)

Berikut adalah rancangan entitas relasional utama yang wajib diimplementasikan di sisi *backend*:

1. **`schools` (Master Sekolah):**
   * `id_sekolah` (PK), `npsn`, `nama_sekolah`, `nama_kepala_sekolah`, `nip_kepala_sekolah`, `nama_sppg_mitra`.
2. **`classes` (Tabel Kelas):**
   * `id_kelas` (PK), `id_sekolah` (FK), `nama_kelas` (Contoh: "XII RPL 1", "VII-A"), `tingkat` (Enum: `X`, `XI`, `XII`, `VII`, `VIII`, `IX`), `jurusan` (Enum: `IPA`, `IPS`, `RPL`, `TKJ`, `AKUNTANSI`, `UMUM`), `total_siswa_dapodik` (Int).
3. **`students` (Tabel Siswa per Kelas - Basis CRM UBSI):**
   * `nisn` (String(10), PK, Unique), `id_kelas` (FK), `nama_lengkap` (Varchar), `no_hp` (Varchar — tervalidasi format `628xxx`), `email` (Varchar), `jurusan` (Enum), `kelas` (Varchar), `is_ketua_kelas` (Boolean).
4. **`organoleptic_tests` (Tabel Uji Organoleptik - Bagian A):**
   * `id_uji` (PK), `id_sekolah` (FK), `id_guru_piket` (FK), `tanggal` (Date), `jam_tiba` (Time), `status_ketepatan` (Enum: `TEPAT_WAKTU`, `TERLAMBAT`), `status_aroma` (Enum: `SEGAR_NORMAL`, `ASAM_ANEH`), `status_rasa` (Enum: `LAYAK_KONSUMSI`, `KURANG_LAYAK`), `status_tekstur` (Enum: `MATANG_SEMPURNA`, `BASI_MENTAH`), `status_wadah` (Enum: `BERSIH_TERTUTUP`, `KOTOR_TERBUKA`), `catatan_kelayakan` (Text), `kesimpulan` (Enum: `LAYAK_EDAR`, `TOLAK_RETUR`), `catatan_kejadian_khusus` (Text - Bagian C).
5. **`daily_attendances` (Tabel Kehadiran & Distribusi Harian - Bagian B):**
   * `id_log` (PK), `id_kelas` (FK), `id_uji` (FK), `tanggal` (Date), `jumlah_hadir` (Int), `jumlah_absen` (Int), `status_ambil` (Enum: `MENUNGGU`, `DIDISTRIBUSIKAN`, `SELESAI`), `jumlah_ompreng_kembali` (Int), `ttd_perwakilan_siswa` (Text/Base64), `waktu_ambil` (Timestamp), `waktu_kembali` (Timestamp).
6. **`food_waste_evaluations` (Tabel Evaluasi Sisa):**
   * `id_evaluasi` (PK), `id_log` (FK), `id_kelas` (FK), `porsi_sisa_habis` (Int), `keterangan_sisa` (Text).
7. **`crm_campaigns` & `crm_click_logs` (Tabel Iklan PMB UBSI):**
   * `id_campaign` (PK), `judul_promo`, `banner_image_url`, `target_tingkat` (Default: `XII`), `target_jurusan` (Array/Enum), `rekomendasi_fakultas_ubsi`, `cta_url_template`.

---

## 8. Roadmap Pengembangan (Phasing / Milestones)

* **Fase 1 — MVP Core Loop MBG (Minggu 1–2):**
  * Setup struktur database, autentikasi RBAC, halaman Input Presensi Ketua Kelas + QR Generator, halaman Uji Organoleptik Guru Piket, dan fitur Scan QR Check-out/Check-in beserta kanvas tanda tangan.
* **Fase 2 — Official Reporting & Glassmorphism Polish (Minggu 3):**
  * Penyempurnaan UI *Glassmorphism*, pembuatan template cetak PDF **Formulir Pencatatan Harian MBG** (Bagian A, B, C), dan *dashboard* grafik Kepala Sekolah.
* **Fase 3 — Smart CRM UBSI & PWA Deployment (Minggu 4):**
  * Integrasi modul *Import Dapodik*, *auto-formatter* nomor WhatsApp `628xxx`, mesin penargetan *Smart Banner* PMB UBSI berdasarkan jurusan, serta konfigurasi *Service Worker* untuk instalasi PWA.