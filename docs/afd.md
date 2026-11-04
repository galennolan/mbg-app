APPLICATION FLOW DOCUMENT (AFD)
Nama Produk: Nutri Kampus Hub (MBG & Smart EdTech CRM)

Versi Dokumen: 1.0 (AFD Final)

Fokus: Modular Screen Navigation & State Transitions

Modul 1: Autentikasi & Multi-Role Routing (/login)
Alur percabangan akses berdasarkan peran (Role-Based Access Control) setelah proses verifikasi kredensial.

Code snippet
graph TD
    A[Buka App / PWA] --> B{Sudah Login?}
    B -- Belum --> C[Halaman Login / Auth]
    C --> D{Pilih Peran / Input Kredensial}
    D --> E[Validasi Server / Hash Password]
    E --> F{Cek Role User}
    
    F -- SUPER_ADMIN --> G[Dashboard Admin /admin/dashboard]
    F -- GURU_PIKET --> H[Dashboard Piket /piket/scan]
    F -- KETUA_KELAS --> I[Dashboard Siswa /student/dashboard]
    F -- KEPALA_SEKOLAH --> J[Dashboard Eksekutif /principal/analytics]
    
    B -- Sudah (Session Valid) --> F
Modul 2: Skenario Harian Guru Piket (/piket/*)
Alur operasional harian mulai dari penerimaan makanan, uji organoleptik, hingga rekonsiliasi ompreng.

Code snippet
graph TD
    A[Guru Piket Login] --> B[Menu Utama: Input Uji Organoleptik]
    B --> C[Isi Form Bagian A: Waktu Tiba & Checklist Parameter]
    C --> D{Kesimpulan Uji?}
    
    D -- TIDAK LAYAK / RETUR --> E[Blokir Distribusi & Kirim Peringatan ke Kepala Sekolah]
    D -- LAYAK EDAR --> F[Klik Tombol: MBG Datang & Buka Distribusi]
    
    F --> G[Sistem Generate Master QR Code & Push Notification ke Siswa]
    G --> H[Siaga di Meja Transit / Area Pengambilan]
    
    H --> I[Siswa Scan Master QR Guru / Input PIN 4-Digit]
    I --> J[Siswa Selesaikan Checklist & Guru Pantau Live Feed]
    J --> K[Buka Modal Rekonsiliasi Bagian B (Ompreng & Sisa)]
    
    K --> L[Input Ompreng: Utuh, Rusak, Hilang & Catat Food Waste]
    L --> M[Perwakilan Siswa Bubuhkan Tanda Tangan Digital]
    M --> N[Klik Selesaikan Distribusi Kelas]
    N --> O[Data Masuk Log & Siap Export Laporan Resmi PDF/Excel]
Modul 3: Skenario Harian Siswa / Ketua Kelas (/student/*)
Alur interaksi siswa mulai dari notifikasi kedatangan, presensi, hingga klaim makanan dan akses Smart Banner UBSI.

Code snippet
graph TD
    A[Siswa Buka PWA / Terima Push Notification] --> B[Dashboard Siswa / Halaman Utama]
    B --> C{Status Porsi Hari Ini?}
    
    C -- MENUNGGU --> D[Tampilkan Banner Promo UBSI Sesuai Jurusan / Lead Scoring]
    C -- READY FOR PICKUP --> E[Perwakilan Kelas Menuju Meja Transit]
    
    E --> F[Klik Scan QR Guru Piket / Masukkan PIN Harian]
    F --> G[Sistem Muat Daftar Nama Siswa 1 Kelas - Auto Select All]
    
    G --> H[Ketua Kelas Unselect Nama Siswa yang Absen/Sakit]
    H --> I[Klik Tombol: Sudah Terima MBG]
    
    I --> J[Validasi Idempotency (Cek Anti Double-Claim)]
    J --> K[Status Kelas Berubah: DIDISTRIBUSIKAN / SELESAI]
    K --> L[Tampil Log Naratif di HP: Joko, Prabowo, Tania Sudah Ambil Pukul XX:XX]
Modul 4: State Machine Distribusi Kelas (Siklus Status Harian)
Representasi perubahan status data pada tabel DailyAttendance sepanjang hari operasional sekolah.

Code snippet
stateDiagram-v2
    [*] --> DRAFT : Guru Input Absen Pagi (07:15)
    DRAFT --> QUOTA_LOCKED : Kuota Porsi Terkunci Otomatis (07:30)
    QUOTA_LOCKED --> READY_FOR_PICKUP : Uji Organoleptik Guru Piket: LAYAK EDAR (09:30)
    
    READY_FOR_PICKUP --> DISTRIBUTED : Siswa Scan QR & Checklist Nama (09:40)
    DISTRIBUTED --> COMPLETED : Ompreng Dikembalikan, Input Sisa & TTD (10:30)
    
    COMPLETED --> [*] : Laporan Harian Tersimpan & Siap Export
Modul 5: Alur Smart EdTech CRM & UBSI Lead Generation
Mekanisme penargetan iklan dan pengumpulan leads pendaftaran mahasiswa baru secara otomatis.

Code snippet
graph TD
    A[Siswa Akses PWA Dashboard] --> B[Sistem Cek Atribut `jurusan` & `tingkat` di DB]
    B --> C{Apakah Siswa Kelas XII?}
    
    C -- Tidak --> D[Tampilkan Widget Informasi Sekolah & Menu MBG Standar]
    C -- Ya --> E[Cocokkan Jurusan dengan Tabel CrmCampaign]
    
    E --> F[Render Smart Banner Interaktif (Contoh: Fakultas Teknik & Informatika UBSI)]
    F --> G[Siswa Klik Banner CTA]
    
    G --> H[Sistem Catat `lead_score` += 1 di Tabel Student]
    H --> I[Redirect ke WhatsApp Gateway PMB UBSI dengan Pesan Otomatis]
    I --> J[Tim Marketing UBSI Terima Leads Terverifikasi]
