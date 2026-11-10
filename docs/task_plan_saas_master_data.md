# TASK PLAN: SAAS MULTI-SCHOOL & MASTER DATA CRUD

Rencana kerja ini bertujuan untuk mentransformasi aplikasi menjadi platform SaaS (Multi-Sekolah) dan menyediakan fitur manajemen data (CRUD) yang lengkap bagi Guru dan Super Admin.

## 1. Tahap 1: SaaS Multi-Tenant Foundation
**Goal:** Memastikan semua data terisolasi berdasarkan `id_sekolah`.

- [x] **Data Filtering di Services (`src/lib/services.ts`)**
    - Update semua query Supabase (kelas, siswa, distribusi) agar selalu menyertakan filter `.eq('id_sekolah', user.id_sekolah)`.
    - Pastikan `super_admin` dapat melewati (*bypass*) filter ini untuk melihat data lintas sekolah.
- [x] **Super Admin: Manajemen Sekolah (`/admin/sekolah`)**
    - Buat halaman CRUD untuk tabel `schools`.
    - Hanya `super_admin` yang bisa menambah, mengedit, atau menghapus sekolah.
    - Setiap sekolah yang baru dibuat akan mendapatkan `id_sekolah` (UUID) yang unik.

## 2. Tahap 2: Manajemen Kelas (CRUD Kelas)
**Goal:** Guru dapat mengatur ruang kelas mereka sendiri.

- [x] **Halaman CRUD Kelas (`/admin/kelas`)**
    - **Tambah Manual:** Form untuk input Nama Kelas, Tingkat, dan Jurusan.
    - **Edit/Hapus:** Fitur untuk memperbarui informasi kelas.
    - **Akses:** Diizinkan untuk `guru_piket` dan `super_admin`.
- [x] **Sinkronisasi Otomatis:** Pastikan saat kelas dibuat, `id_sekolah` otomatis terisi dari profil guru yang sedang login.

## 3. Tahap 3: Manajemen Siswa (CRUD & Import Engine)
**Goal:** Fleksibilitas dalam memasukkan data ribuan siswa atau satu per satu.

- [x] **Halaman CRUD Siswa (`/siswa`)**
    - **Tambah Manual:** Form input Nama, NISN, No HP (Siswa/Wali), dan Alergi.
    - **Import Excel/CSV:**
        - Gunakan library `xlsx` untuk parsing.
        - **Auto-Sanitizer:** Ubah format HP `08...` menjadi `628...`.
        - **Auto-Account:** Tandai No HP sebagai identitas login siswa.
    - **Validasi:** Cek duplikasi NISN dalam satu sekolah sebelum insert.
- [x] **Akses:** Diizinkan untuk `guru_piket` dan `super_admin`.

## 4. Tahap 4: Dashboard Super Admin (Master Control)
**Goal:** Kendali penuh bagi tim Marcomm UBSI/Developer.

- [x] **Global Dashboard**
    - Statistik jumlah sekolah aktif, total siswa nasional, dan total porsi terserap hari ini.
- [x] **Switch School View**
    - Fitur khusus Super Admin untuk "menyamar" atau melihat dashboard sekolah spesifik tanpa harus logout.

## 5. Tahap 5: Refaktor Skema Database (Jika Perlu)
**Goal:** Menyesuaikan relasi tabel agar SaaS-ready.

- [x] **Fix RLS (Row Level Security)**
    - Pastikan kebijakan RLS di Supabase dikunci: `id_sekolah = auth.jwt() -> 'id_sekolah'`.

---

**Panduan Eksekusi AI Agent:**
1. Mulai dengan membuat halaman Manajemen Sekolah khusus Super Admin.
2. Lanjutkan dengan memperbaiki fitur Import di halaman Siswa agar mendukung `id_sekolah`.
3. Terakhir, terapkan filter global di `services.ts` agar Guru hanya melihat data sekolahnya sendiri.
