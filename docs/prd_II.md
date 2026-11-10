# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Nama Produk:** Nutri Kampus Hub (Sistem Manajemen MBG Sekolah & Smart EdTech CRM)

**Platform:** Progressive Web App (PWA) — Responsive Mobile & Desktop

**Versi Dokumen:** 1.2 (Final Release: Anti-Fraud, Food Safety Guard, Offline-First & CRM Lead Scoring)

**Status:** Ready for Architecture & Development

**Inisiator Produk:** Tim Pengembang & Marketing Komunikasi UBSI

---

## 1. Ringkasan Eksekutif & Visi Produk

### 1.1 Latar Belakang Masalah

1. **Inefisiensi & Celah Operasional MBG di Sekolah:** Proses pencatatan kehadiran siswa untuk kuota porsi makan, uji kelayakan makanan (organoleptik) dari Satuan Pelayanan Pemenuhan Gizi (SPPG), peringatan alergi siswa, hingga rekonsiliasi pengembalian wadah (ompreng) masih dilakukan secara manual di atas kertas. Selain rawan selisih data dan kehilangan/kerusakan ompreng, alur antrean di meja piket sering menghambat waktu istirahat siswa jika aplikasi terlalu rumit digunakan atau terkendala sinyal internet.
2. **Tantangan Akuisisi Data Calon Mahasiswa (PMB):** Tim pemasaran kampus membutuhkan saluran komunikasi yang organik, tervalidasi sesuai data Dapodik, dan relevan dengan jurusan siswa (khususnya kelas XII SMA/SMK) lengkap dengan pelacakan tingkat ketertarikan (*lead scoring*) siswa.

### 1.2 Solusi & Visi Produk

Membangun **Progressive Web App (PWA)** berdesain modern (*Glassmorphism*) dengan filosofi **"Prinsip 2-Klik Beres"** baik bagi Guru Piket maupun Siswa. Sistem ini mengotomatiskan 100% siklus harian Program Makan Bergizi Gratis (MBG) melalui notifikasi *real-time*, *Master QR Code* (dilengkapi PIN 4-Digit *fallback*), dan *checklist* kehadiran berbasis daftar nama siswa per kelas yang dilengkapi indikator alergi. Di saat yang sama, aplikasi ini mengintegrasikan mesin rekomendasi cerdas (*Smart Banner CTA* & *Lead Scoring*) yang menghubungkan siswa dengan program beasiswa, *tryout*, dan PMB Universitas Bina Sarana Informatika (UBSI) sesuai jurusan mereka.

---

## 2. Target Pengguna & Matriks Hak Akses (RBAC)

| Role Pengguna | Perangkat Utama | Fokus Utama & Hak Akses |
| :--- | :--- | :--- |
| **Super Admin** (UBSI Dev/Marcomm) | Desktop / Laptop | **Master Access.** Akses penuh ke seluruh menu sistem, manajemen multi-sekolah, audit log global, manajemen kampanye iklan/ads (On/Off), dan fitur "Tarik Data Master" (Dapodik/Student Data). |
| **Admin Guru Piket** (Koordinator MBG) | Smartphone / Tablet | **Operational Access.** Input uji organoleptik, scan QR distribusi, kelola data siswa (Import/Edit), dan cetak laporan. Menginisiasi sesi harian. |
| **Kepala Sekolah** (Monitoring & Correction) | Desktop / Smartphone | **Auditor Access.** Dashboard analitik, cetak laporan, dan memiliki hak khusus untuk **mengedit/koreksi data** jika terdapat kesalahan input operasional oleh Guru Piket. |
| **Perwakilan Siswa / Siswa** | Smartphone (PWA) | **Claim Portal.** Menerima notifikasi push, monitoring status MBG, scan QR/PIN untuk pengambilan. **Login bersifat opsional** (tidak wajib) — siswa tetap bisa melakukan klaim tanpa login, namun login (Nama + No. HP) memberikan akses ke riwayat pribadi & fitur CRM. |

---

## 3. Sistem Autentikasi & Keamanan (Dual-Mode Auth + Guest Access)

Sistem menggunakan dua metode autentikasi yang berbeda berdasarkan kategori pengguna, **dengan akses tamu (guest) untuk siswa**:

1. **Staff Auth (Staff & Admin):**
   - Menggunakan **Supabase Auth** (Email & Password).
   - Meliputi Role: Super Admin, Guru Piket, Kepala Sekolah.
   - **Wajib Login** untuk mengakses fitur operasional.
2. **Student Auth (Siswa) — Opsional:**
   - Menggunakan **Custom Identity Verification** (Nama + No. HP).
   - Akun siswa di-generate otomatis saat data diimpor oleh Admin/Guru ke tabel `students`.
   - **Tidak wajib login** untuk fungsi utama: klaim MBG, menerima notifikasi push, monitoring status.
   - Jika login: Akses tambahan ke Riwayat Pribadi, Smart Banner CRM (Lead Scoring), & Personalisasi.
   - Jika tidak login (Guest Mode): Tetap bisa scan QR/PIN & klaim porsi via verifikasi identitas ad-hoc (Nama + No. HP) saat proses klaim.

---

## 4. Tujuan Bisnis & Metrik Keberhasilan (Success Metrics / KPI)

### 4.1 Metrik Operasional Sekolah (MBG)

* **2-Click Simplicity:** Waktu interaksi di meja transit kurang dari **10 detik per kelas** berkat mekanisme *Siswa Scan QR Guru / PIN 4-Digit* dan *Auto-Select* daftar nama kelas.
* **Individual Traceability & Food Safety:** 100% porsi yang keluar tercatat hingga ke level nama individu siswa beserta jam pengambilannya (*timestamp* presisi) dan peringatan dini untuk siswa yang memiliki alergi makanan.
* **Zero Asset Discrepancy & Fast Export:** 100% akuntabilitas status wadah ompreng (Utuh, Rusak, Hilang) tercatat, serta rekapitulasi siap di-*export* ke format Excel/CSV/PDF untuk SPPG dalam waktu **< 1 menit**.

### 4.2 Metrik Strategis Kampus (CRM & PMB UBSI)

* **Validasi Database:** 100% nomor WhatsApp siswa terformat standar internasional (`628xxx`) dan terpetakan sesuai jurusan (IPA, IPS, RPL, TKJ, Akuntansi, dll.).
* **Click-Through Rate (CTR) & Lead Scoring:** Minimal **15% CTR** pada *Smart Banner* beasiswa/tryout UBSI di halaman PWA Siswa kelas XII, serta pengelompokan otomatis siswa ke dalam kategori *Hot/Warm/Cold Leads* berdasarkan frekuensi interaksi.
* **Lead Conversion:** Pertumbuhan jumlah siswa kelas XII yang terhubung langsung ke alur WhatsApp CRM PMB UBSI dari sekolah mitra pengguna aplikasi.

---

## 5. Alur Pengguna Utama (Core User Flows — Prinsip "2-Klik Beres")

### 5.1 Alur Sisi Guru Piket (Trigger, Food Safety QC & Broadcast)

1. **Tahap Kedatangan & QC Cepat:** Makanan tiba dari SPPG ke area transit sekolah. Guru piket mengecek kelayakan makanan (Uji Organoleptik default tercentang *Layak Edar* untuk mempercepat proses), memotret sampel makanan hari itu (1-Tap Photo), dan mencentang konfirmasi bahwa *1 Porsi Sampel Bank Makanan telah disimpan*.
2. **Klik 1 (`MBG Datang`):** Guru Piket menekan tombol utama **"🍽️ MBG Datang & Buka Distribusi"**.
3. **Klik 2 (`Tampilkan QR & Kirim Notifikasi`):**
   * Sistem otomatis menembakkan **Web Push Notification** ke seluruh smartphone siswa/perwakilan kelas: *"🔔 Info Guru Piket: MBG hari ini sudah tiba dan siap dibagikan! Silakan perwakilan kelas menuju area transit."*
   * Layar perangkat Guru Piket langsung menampilkan **Dynamic Master QR Code** berukuran besar beserta **Kode PIN 4-Digit** (sebagai alternatif jika kamera HP siswa bermasalah).

### 5.2 Alur Sisi Siswa / Perwakilan Kelas (Scan, Anti-Fraud & Checklist Nama)

Sistem mendukung **Login Opsional** (Guest Mode) untuk fleksibilitas akses. Dua mode pengambilan yang sama-sama selesai dalam **2 langkah praktis** serta dilengkapi pencegahan klaim ganda (*Idempotency Lock*):

* **Skenario A: Perwakilan Kelas Mengambil untuk Satu Kelas (Mode Utama / Kolektif)**
  1. **Scan QR / Input PIN:** Perwakilan siswa (4–5 orang) tiba di meja transit, membuka aplikasi PWA, dan melakukan **Scan QR Code** Guru Piket (atau mengetik 4-Digit PIN meja transit). Sistem otomatis membuka daftar kelasnya (misal: *XII RPL 1*).
  2. **Verifikasi Identitas (Opsional):** Jika belum login, sistem meminta input **Nama + No. HP** sekali untuk verifikasi ad-hoc. Jika sudah login, langkah ini dilewati.
  3. **Klik 1 (Select / Unselect Nama Siswa):** Layar menampilkan daftar seluruh nama teman sekelasnya (sesuai Dapodik) dalam keadaan **otomatis terpilih semua (*Select All = Hadir*)**.
     * Perwakilan siswa cukup mengetuk (*unselect*) nama siswa yang **tidak hadir/absen** hari itu.
     * Jika ada teman yang memiliki riwayat alergi, muncul *badge* merah di samping namanya (Contoh: `Joko ⚠️ Alergi Udang`) agar porsinya bisa disesuaikan.
     * Jika ada siswa yang sudah mengambil mandiri sebelumnya, namanya otomatis terkunci (`Tania 🔒 Sudah Ambil Mandiri 09:38`).
  4. **Klik 2 (`Sudah Terima MBG`):** Perwakilan siswa menekan tombol **"✅ Sudah Terima MBG"**.

* **Skenario B: Siswa Mengambil Mandiri / Klaim Susulan (Mode Individu)**
  1. Siswa melakukan **Scan QR Code / Input PIN** Guru Piket.
  2. **Verifikasi Identitas (Opsional):** Input **Nama + No. HP** jika mode Guest, atau otomatis terisi jika sudah Login.
  3. **Klik 1 (Pilih Nama):** Siswa mengeklik namanya sendiri dari *list* nama teman sekelasnya (termasuk bagi siswa yang baru keluar dari UKS/dispensasi sebagai *Klaim Susulan*).
  4. **Klik 2 (`Sudah Terima MBG`):** Siswa menekan tombol **"✅ Sudah Terima MBG"**.

### 5.3 Output Real-Time Notification & Rekonsiliasi Ompreng

1. **Live Feed & Catatan Notifikasi:** Begitu tombol *"Sudah Terima MBG"* ditekan, sistem langsung memunculkan catatan info notifikasi dan memperbarui rekap data *real-time* di layar Guru Piket maupun riwayat kelas dengan format naratif yang jelas:
   > 📢 **Info Rekap Kelas XII RPL 1 (10:02 WIB):**
   >
   > *"Joko, Prabowo, Tania, dan 27 siswa lainnya sudah ambil MBG pada jam 10:02 WIB. (Total Terima: 30 Porsi | Absen/Sisa: 2 Porsi - Budi, Sari)."*
2. **Pengembalian Ompreng & Auto-Reminder (Close Loop):** Selesai makan bersama, perwakilan kelas mengembalikan ikatan ompreng ke meja transit. Guru Piket / Perwakilan Kelas mengonfirmasi rincian wadah (**Utuh**, **Rusak**, atau **Hilang**), mencatat sisa makanan (*food waste*), dan membubuhkan tanda tangan digital di layar. *(Jika 15 menit setelah jam makan berakhir kelas belum mengembalikan ompreng, sistem otomatis mengirim Push Notification pengingat ke Ketua Kelas).*

---

## 6. Kebutuhan Fungsional (Functional Requirements)

### Modul 1: Otentikasi & Manajemen Master Data (RBAC & Master Menu)

* **FR-1.1 (Dual-Auth Engine + Guest Access):** 
    - Implementasi login Staff via Email/Password (Supabase Auth) — **Wajib**.
    - Implementasi login Siswa via Nama Lengkap & Nomor HP (Verification matching ke tabel `students`) — **Opsional**.
    - Implementasi **Guest Mode** untuk Siswa: Verifikasi identitas ad-hoc (Nama + No. HP) saat proses klaim tanpa perlu sesi login persisten.
* **FR-1.2 (Super Admin Master Menu):**
    - Menu **"Management Campaign"**: Fitur untuk membuat, mengedit, dan melakukan On/Off Toggle kampanye PMB UBSI.
    - Menu **"Data Pulling"**: Fitur master untuk menarik/sinkronisasi ulang data siswa dari source eksternal (Dapodik Simulation).
    - Akses penuh ke seluruh menu di bawah `/admin/*`.
* **FR-1.3 (Kepala Sekolah Correction Mode):**
    - Hak akses untuk melakukan override atau edit pada data `daily_attendances` dan `student_mbg_logs` jika terjadi kesalahan input operasional oleh Guru Piket, guna menjaga validitas laporan akhir.
* **FR-1.4 (Import & Auto-Generation Account):** 
    - Fitur unggah massal (CSV/Excel) oleh Super Admin/Guru Piket.
    - Sistem secara otomatis mendaftarkan No. HP siswa sebagai **identitas verifikasi unik** (digunakan untuk Login Opsional & Guest Mode).
    - Sanitasi otomatis format nomor telepon ke standar internasional (`628xxx`).

### Modul 2: Trigger "MBG Datang", Uji Organoleptik & Food Sample Guard (Admin Guru Piket)

* **FR-2.1 (One-Tap "MBG Datang" & Push Notification):** Tombol aksi cepat bagi Guru Piket yang memicu Web Push API untuk mengirimkan notifikasi instan ke perangkat siswa serta men-generate **Dynamic Master QR Code** dan **PIN 4-Digit Harian**.
* **FR-2.2 (Form Bagian A - Uji Kelayakan Organoleptik & Sampel Bank Makanan):**
  * Pemeriksaan waktu tiba SPPG (*Tepat Waktu / Terlambat*), parameter Aroma, Rasa, Tekstur, dan Kebersihan Wadah dengan *preset default* **"LAYAK EDAR"** (dapat diubah ke **"TIDAK LAYAK EDAR / RETUR"** yang otomatis memblokir distribusi jika makanan basi/bermasalah).
  * Fitur **1-Tap Photo Capture** untuk mendokumentasikan fisik menu makanan hari itu dan *checkbox* konfirmasi penyimpanan 1 porsi sampel makanan (SOP keamanan pangan 2x24 jam).

### Modul 3: Student QR/PIN Verification, Anti-Fraud & Interactive Checklist (Perwakilan Siswa)

* **FR-3.1 (Dual Verification — QR Scanner & 4-Digit PIN Fallback):** Kamera pemindai QR di dalam PWA siswa yang dilengkapi opsi input **PIN 4-Digit Harian** untuk mengantisipasi kamera HP siswa yang rusak/buram, serta mencegah *scan* palsu dari luar area transit.
* **FR-3.2 (Interactive Student Roster & Idempotency Lock):**
  * Menampilkan seluruh daftar nama siswa di kelas terkait beserta indikator peringatan alergi (`⚠️`).
  * Fitur *Toggle Select All* (Default: Tercentang semua untuk mempercepat perwakilan kelas) dan pencarian cepat nama siswa.
  * **Real-Time State Locking:** Mencegah *double-claim* antara pengambilan individu dan perwakilan kelas, serta mendukung **Klaim Susulan** bagi siswa yang terlambat hadir selama kuota kelas masih tersedia.
  * Penghitung otomatis di bagian bawah layar: $\text{Hadir (Terima MBG)} = X \text{ Siswa} \mid \text{Absen (Porsi Sisa)} = Y \text{ Siswa}$.
* **FR-3.3 (Konfirmasi "Sudah Terima MBG"):** Tombol *submit* yang mengunci daftar penerima, mencatat *timestamp* presisi, dan mengirimkan *toast notification* ke seluruh pemangku kepentingan.

### Modul 4: Rekonsiliasi Aset Ompreng, Log Detail & Multi-Format Export (Guru Piket & SPPG)

* **FR-4.1 (Real-Time Activity Log per Nama Siswa):** Tampilan *log* kronologis yang merinci nama-nama siswa yang sudah mengambil MBG per kelas beserta jam pengambilannya (Contoh: *"Joko, Prabowo, Tania sudah ambil MBG jam 09:45 WIB"*).
* **FR-4.2 (Rekonsiliasi Wadah 3-Status & Catatan Khusus):** Input pengembalian wadah dengan 3 kategori akuntabilitas aset SPPG (`Ompreng Utuh`, `Ompreng Rusak`, `Ompreng Hilang/Kurang`), input evaluasi sisa makanan (*food waste*), kanvas tanda tangan digital perwakilan siswa, dan kolom Catatan Kejadian Khusus (Bagian C).
* **FR-4.3 (Export Data Pelaporan SPPG & Sekolah):** Fitur unduh laporan sekali klik dalam 3 format:
  1. **Excel (`.xlsx`) / CSV:** Berisi rincian rekapitulasi per kelas dan lampiran daftar nama seluruh siswa (Status: *Sudah Terima MBG* + Jam Ambil vs *Tidak Hadir*) untuk audit SPPG.
  2. **PDF Resmi (Formulir Pencatatan Harian MBG):** Dokumen siap cetak yang memuat Identitas Pelaksanaan, **Bagian A** (Uji Organoleptik + Bukti Foto), **Bagian B** (Tabel Rekapitulasi Kelas + Status Ompreng + Tanda Tangan Perwakilan Siswa), **Bagian C** (Catatan Kejadian Khusus), dan **Pengesahan Kepala Sekolah & Guru Piket**.

### Modul 5: Smart EdTech CRM, PMB Targeting & Lead Scoring (Super Admin & Siswa)

* **FR-5.1 (Rule-Based Major Matching):** Menampilkan *banner* promosi PMB dan Beasiswa UBSI yang relevan di halaman utama PWA Siswa dan pada layar sukses setelah klik *"Sudah Terima MBG"*, difilter berdasarkan `jurusan`:
  * `RPL / TKJ / Multimedia / IPA` $\rightarrow$ Kampanye **Fakultas Teknik & Informatika UBSI**.
  * `Akuntansi / Perkantoran / Pemasaran / IPS` $\rightarrow$ Kampanye **Fakultas Ekonomi & Bisnis UBSI**.
  * `Bahasa / Lainnya` $\rightarrow$ Kampanye **Fakultas Komunikasi & Bahasa UBSI**.
* **FR-5.2 (One-Tap WhatsApp CRM CTA & Automated Lead Scoring):**
  * Mengarahkan langsung siswa yang mengeklik *banner* ke WhatsApp resmi PMB UBSI dengan pesan otomatis yang menyertakan `nama_lengkap`, `kelas`, dan `jurusan`.
  * **Automated Lead Scoring:** Setiap interaksi klik pada *banner* beasiswa/tryout otomatis menambah poin pada profil siswa (`lead_score`), mengelompokkan siswa ke dalam segmen **Cold** (0 klik), **Warm** (1–2 klik), atau **Hot Lead** ($\ge 3$ klik) di dashboard CRM Super Admin UBSI untuk prioritas *follow-up*.

---

## 7. Kebutuhan Non-Fungsional & Panduan UI/UX (Non-Functional Requirements)

### 7.1 Desain Visual: Modern Glassmorphism & Zero-Friction UX

* **Aesthetic Direction:** Gaya **Glassmorphism** yang segar dan *techy* untuk Gen Milenial, Gen Z, dan Gen Alpha (latar *mesh gradient* lembut dengan kartu konten `backdrop-filter: blur(16px)` and *border* semi-transparan).
* **2-Click Ergonomics:** Tombol utama (**"MBG Datang"** di layar Guru dan **"Sudah Terima MBG"** di layar Siswa) dirancang sebagai *Floating Action Button* (FAB) berukuran besar dengan warna kontras tinggi agar mudah dijangkau dengan satu ibu jari.
* **Print Stylesheet Isolation:** Saat mencetak laporan PDF (`@media print`), antarmuka Glassmorphism otomatis bertransformasi menjadi tabel dokumen resmi hitam-putih standar pemerintah/sekolah.

### 7.2 Performa, Offline-First Resilience & Keandalan PWA

* **Offline-First Queue (IndexedDB & Background Sync):** Mengantisipasi sinyal internet yang tidak stabil di koridor sekolah, transaksi klik *"Sudah Terima MBG"* tetap dapat disimpan secara lokal di memori PWA siswa dan otomatis disinkronkan ke server begitu perangkat mendapatkan kembali koneksi internet.
* **Web Push Notification Ready:** Menggunakan *Service Worker* and *Web Push API* agar notifikasi *"MBG Datang"* and pengingat pengembalian ompreng tetap muncul di layar kunci (*lockscreen*) smartphone siswa — **berfungsi tanpa login** (berbasis subscription browser).
* **Optimistic UI Updates:** Pemilihan *select/unselect* daftar nama siswa berjalan instan di sisi klien (*client-side state*) tanpa *lag*, dan proses simpan ke server berlangsung kurang dari **1 detik**.

---

## 8. Spesifikasi Skema Database (Data Model v1.2 Final)

Berikut adalah struktur tabel relasional yang telah dilengkapi dengan fitur keamanan pangan, anti-fraud, akuntabilitas aset ompreng, dan *lead scoring* CRM:

1. **`schools` (Master Sekolah):**
   * `id_sekolah` (PK), `npsn`, `nama_sekolah`, `nama_kepala_sekolah`, `nip_kepala_sekolah`, `nama_sppg_mitra`.
2. **`classes` (Tabel Kelas):**
   * `id_kelas` (PK), `id_sekolah` (FK), `nama_kelas` (Contoh: "XII RPL 1", "VII-A"), `tingkat`, `jurusan` (Enum: `IPA`, `IPS`, `RPL`, `TKJ`, `AKUNTANSI`, `UMUM`), `total_siswa_dapodik` (Int).
3. **`students` (Tabel Siswa per Kelas - Basis Presensi MBG & CRM UBSI):**
   * `nisn` (String(10), PK, Unique — tervalidasi anti-duplikasi), `id_kelas` (FK), `nama_lengkap` (Varchar — digunakan untuk *checklist* MBG & personalisasi blast CRM), `no_hp` (Varchar — wajib format `628xxx`), `email` (Varchar), `jurusan` (Enum), `kelas` (Varchar), `alergi_makanan` (Varchar/Nullable — indikator keamanan pangan), `is_perwakilan_kelas` (Boolean), `lead_score` (Int, Default: 0), `lead_status` (Enum: `COLD`, `WARM`, `HOT`).
4. **`organoleptic_tests` (Tabel Sesi Harian & Uji Organoleptik - Bagian A):**
   * `id_uji` (PK), `id_sekolah` (FK), `id_guru_piket` (FK), `tanggal` (Date), `jam_tiba` (Time), `master_qr_token` (Varchar — token unik untuk di-scan siswa), `kode_pin_harian` (String(4) — PIN alternatif 4 digit), `status_ketepatan` (Enum: `TEPAT_WAKTU`, `TERLAMBAT`), `status_aroma`, `status_rasa`, `status_tekstur`, `status_wadah`, `foto_sampel_url` (Varchar), `is_sampel_disimpan` (Boolean), `catatan_kelayakan` (Text), `kesimpulan` (Enum: `LAYAK_EDAR`, `TOLAK_RETUR`), `catatan_kejadian_khusus` (Text - Bagian C).
5. **`daily_attendances` (Tabel Rekapitulasi Distribusi Kelas - Bagian B):**
   * `id_log` (PK), `id_kelas` (FK), `id_uji` (FK), `tanggal` (Date), `jumlah_hadir` (Int — porsi diberikan), `jumlah_absen` (Int — porsi sisa), `status_ambil` (Enum: `MENUNGGU`, `SUDAH_TERIMA_MBG`, `OMPRENG_KEMBALI`), `ompreng_utuh` (Int), `ompreng_rusak` (Int), `ompreng_hilang` (Int), `ttd_perwakilan_siswa` (Text/Base64), `waktu_terima_kelas` (Timestamp), `waktu_kembali_ompreng` (Timestamp).
6. **`student_mbg_logs` (Tabel Detail Penerimaan per Nama Siswa):**
   * `id_detail_log` (PK), `id_log` (FK ke `daily_attendances`), `nisn` (FK ke `students`), `nama_siswa_snapshot` (Varchar), `tipe_klaim` (Enum: `KOLEKTIF_KELAS`, `MANDIRI`, `SUSULAN`), `status_terima` (Enum: `SUDAH_AMBIL`, `ABSEN_TIDAK_AMBIL`), `waktu_ambil` (Timestamp — menghasilkan log *"Joko, Prabowo, Tania sudah ambil MBG jam XX:XX"*).
7. **`food_waste_evaluations` (Tabel Evaluasi Sisa):**
   * `id_evaluasi` (PK), `id_log` (FK), `id_kelas` (FK), `porsi_sisa_habis` (Int), `keterangan_sisa` (Text).
8. **`crm_campaigns` & `crm_click_logs` (Tabel Iklan PMB UBSI):**
   * `id_campaign` (PK), `judul_promo`, `banner_image_url`, `target_tingkat` (Default: `XII`), `target_jurusan` (Array/Enum), `rekomendasi_fakultas_ubsi`, `cta_url_template`, `poin_interaksi` (Int — penambah `lead_score` siswa saat diklik), `status_aktif` (Boolean).

---

## 9. Roadmap Pengembangan (Phasing / Milestones)

* **Fase 1 — MVP "2-Click MBG Loop" & Anti-Fraud (Selesai):**
  * Setup database v1.2, fitur Guru klik **"MBG Datang"** (Master QR Generator + PIN 4-Digit + Push Notification), fitur Siswa Scan QR/PIN + Checklist *Select/Unselect* nama siswa sekelas (dengan indikator alergi & *idempotency lock*), serta *Live Log Feed* nama penerima MBG.
* **Fase 2 — RBAC, Dual-Auth & Master Menu (Sedang Berjalan):**
  * Implementasi Login Petugas (Supabase) vs Login Siswa (Nama/HP), Middleware RBAC, Campaign Manager (Ads Control), dan Data Correction mode untuk Kepala Sekolah.
* **Fase 3 — Official Reporting, Smart CRM & PWA Polish (Mendatang):**
  * Pembuatan layout cetak PDF resmi, verifikasi pengembalian ompreng, mesin penargetan Smart Banner UBSI, dan optimalisasi ketahanan offline.
