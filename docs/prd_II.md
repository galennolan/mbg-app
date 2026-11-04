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
| **Super Admin** (Tim Dev & Marcomm UBSI) | Desktop / Laptop | Manajemen multi-sekolah, sinkronisasi master data Dapodik (daftar nama siswa per kelas + data alergi), konfigurasi kampanye iklan/CTA PMB berbasis segmen jurusan, pemantauan *Lead Scoring* (Cold/Warm/Hot), dan ekspor *leads* ke gateway CRM WhatsApp/Email. |
| **Admin Guru Piket** (Koordinator MBG) | Smartphone / Tablet / Laptop | Klik tombol **"MBG Datang"** (otomatis *broadcast* notifikasi & *generate* Master QR Code + PIN Harian), input uji organoleptik + foto sampel makanan, pantau *live feed* nama siswa yang mengambil MBG, verifikasi pengembalian ompreng (Utuh/Rusak/Hilang), dan *export* data laporan SPPG (Excel/CSV/PDF). |
| **Perwakilan Siswa / Siswa** | Smartphone (PWA) | Menerima *Push Notification* saat MBG tiba, memindai (*scan*) QR Code Guru Piket (atau input PIN 4-Digit), melakukan *select/unselect* daftar nama teman sekelas yang hadir/absen, klik **"Sudah Terima MBG"**, dan berinteraksi dengan promo/beasiswa UBSI. |
| **Kepala Sekolah** (Monitoring/Viewer) | Desktop / Smartphone | Akses *read-only* ke *dashboard* eksekutif (grafik serapan porsi, ketepatan waktu SPPG, statistik *food waste*, akuntabilitas ompreng, dan pengesahan laporan harian). |

---

## 3. Tujuan Bisnis & Metrik Keberhasilan (Success Metrics / KPI)

### 3.1 Metrik Operasional Sekolah (MBG)

* **2-Click Simplicity:** Waktu interaksi di meja transit kurang dari **10 detik per kelas** berkat mekanisme *Siswa Scan QR Guru / PIN 4-Digit* dan *Auto-Select* daftar nama kelas.
* **Individual Traceability & Food Safety:** 100% porsi yang keluar tercatat hingga ke level nama individu siswa beserta jam pengambilannya (*timestamp* presisi) dan peringatan dini untuk siswa yang memiliki alergi makanan.
* **Zero Asset Discrepancy & Fast Export:** 100% akuntabilitas status wadah ompreng (Utuh, Rusak, Hilang) tercatat, serta rekapitulasi siap di-*export* ke format Excel/CSV/PDF untuk SPPG dalam waktu **< 1 menit**.

### 3.2 Metrik Strategis Kampus (CRM & PMB UBSI)

* **Validasi Database:** 100% nomor WhatsApp siswa terformat standar internasional (`628xxx`) dan terpetakan sesuai jurusan (IPA, IPS, RPL, TKJ, Akuntansi, dll.).
* **Click-Through Rate (CTR) & Lead Scoring:** Minimal **15% CTR** pada *Smart Banner* beasiswa/tryout UBSI di halaman PWA Siswa kelas XII, serta pengelompokan otomatis siswa ke dalam kategori *Hot/Warm/Cold Leads* berdasarkan frekuensi interaksi.
* **Lead Conversion:** Pertumbuhan jumlah siswa kelas XII yang terhubung langsung ke alur WhatsApp CRM PMB UBSI dari sekolah mitra pengguna aplikasi.

---

## 4. Alur Pengguna Utama (Core User Flows — Prinsip "2-Klik Beres")

### 4.1 Alur Sisi Guru Piket (Trigger, Food Safety QC & Broadcast)

1. **Tahap Kedatangan & QC Cepat:** Makanan tiba dari SPPG ke area transit sekolah. Guru piket mengecek kelayakan makanan (Uji Organoleptik default tercentang *Layak Edar* untuk mempercepat proses), memotret sampel makanan hari itu (1-Tap Photo), dan mencentang konfirmasi bahwa *1 Porsi Sampel Bank Makanan telah disimpan*.
2. **Klik 1 (`MBG Datang`):** Guru Piket menekan tombol utama **"🍽️ MBG Datang & Buka Distribusi"**.
3. **Klik 2 (`Tampilkan QR & Kirim Notifikasi`):**
   * Sistem otomatis menembakkan **Web Push Notification** ke seluruh smartphone siswa/perwakilan kelas: *"🔔 Info Guru Piket: MBG hari ini sudah tiba dan siap dibagikan! Silakan perwakilan kelas menuju area transit."*
   * Layar perangkat Guru Piket langsung menampilkan **Dynamic Master QR Code** berukuran besar beserta **Kode PIN 4-Digit** (sebagai alternatif jika kamera HP siswa bermasalah).

### 4.2 Alur Sisi Siswa / Perwakilan Kelas (Scan, Anti-Fraud & Checklist Nama)

Sistem mendukung dua mode pengambilan yang sama-sama selesai dalam **2 langkah praktis** serta dilengkapi pencegahan klaim ganda (*Idempotency Lock*):

* **Skenario A: Perwakilan Kelas Mengambil untuk Satu Kelas (Mode Utama / Kolektif)**
  1. **Scan QR / Input PIN:** Perwakilan siswa (4–5 orang) tiba di meja transit, membuka aplikasi PWA, dan melakukan **Scan QR Code** Guru Piket (atau mengetik 4-Digit PIN meja transit). Sistem otomatis membuka daftar kelasnya (misal: *XII RPL 1*).
  2. **Klik 1 (Select / Unselect Nama Siswa):** Layar menampilkan daftar seluruh nama teman sekelasnya (sesuai Dapodik) dalam keadaan **otomatis terpilih semua (*Select All = Hadir*)**.
     * Perwakilan siswa cukup mengetuk (*unselect*) nama siswa yang **tidak hadir/absen** hari itu.
     * Jika ada teman yang memiliki riwayat alergi, muncul *badge* merah di samping namanya (Contoh: `Joko ⚠️ Alergi Udang`) agar porsinya bisa disesuaikan.
     * Jika ada siswa yang sudah mengambil mandiri sebelumnya, namanya otomatis terkunci (`Tania 🔒 Sudah Ambil Mandiri 09:38`).
  3. **Klik 2 (`Sudah Terima MBG`):** Perwakilan siswa menekan tombol **"✅ Sudah Terima MBG"**.

* **Skenario B: Siswa Mengambil Mandiri / Klaim Susulan (Mode Individu)**
  1. Siswa melakukan **Scan QR Code / Input PIN** Guru Piket.
  2. **Klik 1 (Pilih Nama):** Siswa mengeklik namanya sendiri dari *list* nama teman sekelasnya (termasuk bagi siswa yang baru keluar dari UKS/dispensasi sebagai *Klaim Susulan*).
  3. **Klik 2 (`Sudah Terima MBG`):** Siswa menekan tombol **"✅ Sudah Terima MBG"**.

### 4.3 Output Real-Time Notification & Rekonsiliasi Ompreng

1. **Live Feed & Catatan Notifikasi:** Begitu tombol *"Sudah Terima MBG"* ditekan, sistem langsung memunculkan catatan info notifikasi dan memperbarui rekap data *real-time* di layar Guru Piket maupun riwayat kelas dengan format naratif yang jelas:
   > 📢 **Info Rekap Kelas XII RPL 1 (10:02 WIB):**
   >
   > *"Joko, Prabowo, Tania, dan 27 siswa lainnya sudah ambil MBG pada jam 10:02 WIB. (Total Terima: 30 Porsi | Absen/Sisa: 2 Porsi - Budi, Sari)."*
2. **Pengembalian Ompreng & Auto-Reminder (Close Loop):** Selesai makan bersama, perwakilan kelas mengembalikan ikatan ompreng ke meja transit. Guru Piket / Perwakilan Kelas mengonfirmasi rincian wadah (**Utuh**, **Rusak**, atau **Hilang**), mencatat sisa makanan (*food waste*), dan membubuhkan tanda tangan digital di layar. *(Jika 15 menit setelah jam makan berakhir kelas belum mengembalikan ompreng, sistem otomatis mengirim Push Notification pengingat ke Ketua Kelas).*

---

## 5. Kebutuhan Fungsional (Functional Requirements)

### Modul 1: Otentikasi & Manajemen Master Data Dapodik (Super Admin)

* **FR-1.1 (Import & Validasi Dapodik):** Fitur unggah massal (CSV/Excel) untuk data siswa per kelas dengan validasi ketat:
  * `nisn`: Wajib 10 digit angka unik (Primary Key). Tolak otomatis jika terdeteksi duplikasi lintas sekolah.
  * `nama_lengkap`: Ditampilkan sebagai daftar *checklist* interaktif saat pengambilan MBG per kelas.
  * `no_hp`: Auto-sanitizer yang mengubah awalan `08...` atau `+628...` menjadi `628...` sebagai gateway komunikasi CRM.
  * `alergi_makanan`: Data opsional alergi/pantangan medis siswa untuk ditampilkan sebagai peringatan visual saat distribusi.
* **FR-1.2 (Manajemen Kelas & Kuota):** Pengelompokan daftar siswa berdasarkan `id_kelas` dan sinkronisasi `total_siswa_dapodik`.

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

## 6. Kebutuhan Non-Fungsional & Panduan UI/UX (Non-Functional Requirements)

### 6.1 Desain Visual: Modern Glassmorphism & Zero-Friction UX

* **Aesthetic Direction:** Gaya **Glassmorphism** yang segar dan *techy* untuk Gen Milenial, Gen Z, dan Gen Alpha (latar *mesh gradient* lembut dengan kartu konten `backdrop-filter: blur(16px)` dan *border* semi-transparan).
* **2-Click Ergonomics:** Tombol utama (**"MBG Datang"** di layar Guru dan **"Sudah Terima MBG"** di layar Siswa) dirancang sebagai *Floating Action Button* (FAB) berukuran besar dengan warna kontras tinggi agar mudah dijangkau dengan satu ibu jari.
* **Print Stylesheet Isolation:** Saat mencetak laporan PDF (`@media print`), antarmuka Glassmorphism otomatis bertransformasi menjadi tabel dokumen resmi hitam-putih standar pemerintah/sekolah.

### 6.2 Performa, Offline-First Resilience & Keandalan PWA

* **Offline-First Queue (IndexedDB & Background Sync):** Mengantisipasi sinyal internet yang tidak stabil di koridor sekolah, transaksi klik *"Sudah Terima MBG"* tetap dapat disimpan secara lokal di memori PWA siswa dan otomatis disinkronkan ke server begitu perangkat mendapatkan kembali koneksi internet.
* **Web Push Notification Ready:** Menggunakan *Service Worker* dan *Web Push API* agar notifikasi *"MBG Datang"* dan pengingat pengembalian ompreng tetap muncul di layar kunci (*lockscreen*) smartphone siswa.
* **Optimistic UI Updates:** Pemilihan *select/unselect* daftar nama siswa berjalan instan di sisi klien (*client-side state*) tanpa *lag*, dan proses simpan ke server berlangsung kurang dari **1 detik**.

---

## 7. Spesifikasi Skema Database (Data Model v1.2 Final)

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
   * `id_campaign` (PK), `judul_promo`, `banner_image_url`, `target_tingkat` (Default: `XII`), `target_jurusan` (Array/Enum), `rekomendasi_fakultas_ubsi`, `cta_url_template`, `poin_interaksi` (Int — penambah `lead_score` siswa saat diklik).

---

## 8. Roadmap Pengembangan (Phasing / Milestones)

* **Fase 1 — MVP "2-Click MBG Loop" & Anti-Fraud (Minggu 1–2):**
  * Setup database v1.2, fitur Guru klik **"MBG Datang"** (Master QR Generator + PIN 4-Digit + Push Notification), fitur Siswa Scan QR/PIN + Checklist *Select/Unselect* nama siswa sekelas (dengan indikator alergi & *idempotency lock*), serta *Live Log Feed* nama penerima MBG.
* **Fase 2 — Asset Accountability, Multi-Format Export (SPPG) & Official Form Print (Minggu 3):**
  * Pembuatan fitur *Export* Excel/CSV rincian siswa untuk SPPG, pembuatan *layout* cetak PDF **Formulir Pencatatan Harian MBG** (Bagian A, B, C), verifikasi pengembalian ompreng 3-status (Utuh/Rusak/Hilang), dan *dashboard* Kepala Sekolah.
* **Fase 3 — Smart CRM UBSI, Lead Scoring & Offline-First PWA Polish (Minggu 4):**
  * Integrasi modul *Import Dapodik* (auto-format WA `628xxx`), mesin penargetan *Smart Banner* PMB UBSI untuk kelas XII berdasarkan jurusan beserta *Automated Lead Scoring* (Cold/Warm/Hot), serta optimalisasi *Service Worker* & *IndexedDB* untuk ketahanan *offline*.