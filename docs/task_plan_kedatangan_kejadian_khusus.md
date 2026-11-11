# TASK PLAN: EDIT MITRA SPPG & CRUD KEJADIAN KHUSUS BESERTA LAPORAN

Dokumen ini merinci rencana implementasi terstruktur untuk:
1. **Card Mitra Penyedia MBG (SPPG) di menu Kedatangan dapat diedit secara dinamis**.
2. **Form Kejadian Khusus ditingkatkan menjadi modul CRUD penuh**.
3. **Integrasi data Kejadian Khusus ke menu Laporan dengan tab/filter khusus**.

---

## 1. Tahap Database & Migrasi SQL
**Goal:** Menyiapkan struktur tabel dan relasi untuk mendukung edit nama mitra SPPG serta pencatatan kejadian khusus yang terstruktur.

- [ ] **Skrip Migrasi Supabase (`supabase/migrations/xxxx_incident_reports.sql`)**
  - Pastikan kolom `nama_sppg_mitra` di tabel `public.schools` editable atau tambahkan kolom `nama_sppg_aktual` di tabel `public.organoleptic_tests` agar pencatatan nama mitra harian dapat disesuaikan per kedatangan tanpa mengubah nama default sekolah.
  - Buat tabel `public.incident_reports` / `public.kejadian_khusus`:
    ```sql
    CREATE TABLE IF NOT EXISTS public.incident_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      id_sekolah UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
      id_uji UUID REFERENCES public.organoleptic_tests(id) ON DELETE SET NULL,
      tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
      waktu_kejadian TIME NOT NULL DEFAULT CURRENT_TIME,
      judul_kejadian VARCHAR(200) NOT NULL,
      kategori VARCHAR(50) NOT NULL CHECK (kategori IN ('keterlambatan', 'kualitas_makanan', 'kemasan_rusak', 'alergi_siswa', 'lainnya')),
      tingkat_keparahan VARCHAR(20) NOT NULL DEFAULT 'sedang' CHECK (tingkat_keparahan IN ('rendah', 'sedang', 'tinggi', 'kritis')),
      deskripsi TEXT NOT NULL,
      tindak_lanjut TEXT,
      petugas_pelapor_id UUID REFERENCES public.pengguna(id) ON DELETE SET NULL,
      nama_petugas_pelapor VARCHAR(150),
      status_penyelesaian VARCHAR(20) NOT NULL DEFAULT 'menunggu' CHECK (status_penyelesaian IN ('menunggu', 'diproses', 'selesai')),
      dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
      diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ```
  - Buat index: `CREATE INDEX idx_incidents_sekolah_tanggal ON public.incident_reports(id_sekolah, tanggal);`
  - Konfigurasi Row Level Security (RLS) isolasi per `id_sekolah` untuk tabel `incident_reports`.

---

## 2. Tahap Type Definitions & Services
**Goal:** Menyediakan interface data dan helper functions untuk API Supabase + fallback LocalStorage (Offline-First).

- [ ] **Update TypeScript Types (`src/lib/types.ts`)**
  - Tambahkan type/interface `IncidentReport`:
    ```ts
    export type IncidentCategory = 'keterlambatan' | 'kualitas_makanan' | 'kemasan_rusak' | 'alergi_siswa' | 'lainnya';
    export type IncidentSeverity = 'rendah' | 'sedang' | 'tinggi' | 'kritis';
    export type IncidentStatus = 'menunggu' | 'diproses' | 'selesai';

    export interface IncidentReport {
      id: string;
      id_sekolah: string;
      id_uji?: string | null;
      tanggal: string;
      waktu_kejadian: string;
      judul_kejadian: string;
      kategori: IncidentCategory;
      tingkat_keparahan: IncidentSeverity;
      deskripsi: string;
      tindak_lanjut?: string | null;
      petugas_pelapor_id?: string | null;
      nama_petugas_pelapor?: string | null;
      status_penyelesaian: IncidentStatus;
      dibuat_pada: string;
      diperbarui_pada: string;
    }
    ```
  - Tambahkan field `nama_sppg_aktual?: string | null` ke interface `OrganolepticTest`.

- [ ] **Update Services (`src/lib/services.ts`)**
  - Fungsi update mitra SPPG: `updateSchoolSppg(schoolId: string, namaSppg: string)` atau `updateSessionSppg(sessionId: string, namaSppg: string)`.
  - Fungsi CRUD Kejadian Khusus:
    - `getIncidentReports(filters?: { schoolId?: string; startDate?: string; endDate?: string; kategori?: string }): Promise<IncidentReport[]>`
    - `createIncidentReport(payload: Omit<IncidentReport, 'id' | 'dibuat_pada' | 'diperbarui_pada'>): Promise<IncidentReport>`
    - `updateIncidentReport(id: string, payload: Partial<IncidentReport>): Promise<IncidentReport>`
    - `deleteIncidentReport(id: string): Promise<boolean>`
  - Implementasi caching offline di LocalStorage dengan prefix `mbg_incidents_*`.

---

## 3. Tahap UI Menu "Kedatangan" (`src/app/kedatangan/page.tsx`)
**Goal:** Membuat Card Mitra SPPG interaktif dan Form Kejadian Khusus memiliki kemampuan CRUD lengkap.

- [ ] **Edit Nama Mitra SPPG pada Card Kedatangan**
  - Ubah tampilan display nama SPPG yang statis menjadi editable (Inline Edit dengan tombol pensil/icon `Edit2` atau Modal Edit Cepat).
  - Validasi input nama mitra tidak boleh kosong.
  - Simpan perubahan langsung ke tabel `schools` / `organoleptic_tests` serta perbarui state lokal dan notifikasi toast (`notify.success`).

- [ ] **Refaktor Form Kejadian Khusus menjadi CRUD Komprehensif**
  - Ganti textarea sederhana dengan card daftar kejadian khusus hari ini + tombol **"+ Tambah Catatan Kejadian"**.
  - Modal Tambah/Edit Kejadian Khusus menggunakan komponen reusable `Modal`, `ModalInput`, `ModalSelect`, `ModalTextarea`, `ModalActions`.
  - Input field meliputi:
    - Judul Kejadian (contoh: "Ompreng Basah & Terlambat 15 Menit")
    - Kategori Kejadian (Dropdown)
    - Tingkat Keparahan (Badge status: Rendah, Sedang, Tinggi, Kritis)
    - Deskripsi Rinci
    - Tindak Lanjut yang Diambil
    - Status Penyelesaian (Menunggu, Diproses, Selesai)
  - Fitur Hapus Catatan dengan modal konfirmasi (`ConfirmModal`).
  - Sinkronisasi instan ke state sesi hari ini dan log aktivitas (`logActivity`).

---

## 4. Tahap UI Menu "Laporan" (`src/app/laporan/page.tsx`)
**Goal:** Menyajikan data kejadian khusus dalam laporan resmi dan filter analitik.

- [ ] **Tambahkan Filter/Tab Khusus "Laporan Kejadian Khusus"**
  - Tambahkan filter tipe laporan atau Tab Switcher di halaman Laporan:
    - Tab 1: Rekapitulasi Distribusi & Siswa (Default)
    - Tab 2: Laporan Uji Organoleptik & QC
    - Tab 3: Log Rekap Kejadian Khusus
- [ ] **Tabel & Filter Data Kejadian Khusus**
  - Filter rentang tanggal (Hari Ini, 7 Hari Terakhir, Bulan Ini, Custom Date).
  - Filter berdasarkan Kategori (Keterlambatan, Kualitas Makanan, Kemasan Rusak, Alergi, dll.).
  - Filter berdasarkan Tingkat Keparahan (Rendah, Sedang, Tinggi, Kritis) dan Status Penyelesaian.
  - Tampilan card/tabel yang mencakup: Tanggal & Waktu, Nama SPPG terkait, Kategori, Deskripsi, Tindak Lanjut, dan Pelapor.
- [ ] **Integrasi ke Template Cetak PDF & Export Excel**
  - Pada export PDF resmi (Bagian C Formulir Harian MBG), render seluruh rincian kejadian khusus hari tersebut secara otomatis.
  - Tambahkan sheet/opsi export Excel khusus "Rekap Kejadian Khusus MBG".

---

## 5. Tahap Verifikasi & Uji Kualitas
**Goal:** Memastikan fungsionalitas berjalan tanpa regresi dan sesuai standar kode.

- [ ] Type check `npx tsc --noEmit` lolos tanpa error.
- [ ] Build Next.js `npm run build` sukses dan menghasilkan bundle optimal.
- [ ] Verifikasi tampilan UI di perangkat mobile & desktop dengan standar kontras warna WCAG AA dan accessibility usia 40+.
