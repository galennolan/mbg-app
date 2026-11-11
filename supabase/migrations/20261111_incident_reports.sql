-- ============================================================
-- MIGRATION: SPPG PARTNER EDIT & INCIDENT REPORTS (KEJADIAN KHUSUS)
-- ============================================================

-- 1. Tambah kolom nama_sppg_aktual pada organoleptic_tests (jika belum ada)
alter table if exists public.organoleptic_tests
  add column if not exists nama_sppg_aktual text;

-- 2. Buat tabel incident_reports untuk mencatat kejadian khusus terstruktur
create table if not exists public.incident_reports (
  id uuid primary key default gen_random_uuid(),
  id_sekolah uuid not null references public.schools(id) on delete cascade,
  id_uji uuid references public.organoleptic_tests(id) on delete set null,
  tanggal date not null default current_date,
  waktu_kejadian time not null default current_time,
  judul_kejadian varchar(200) not null,
  kategori varchar(50) not null check (kategori in ('keterlambatan', 'kualitas_makanan', 'kemasan_rusak', 'alergi_siswa', 'lainnya')),
  tingkat_keparahan varchar(20) not null default 'sedang' check (tingkat_keparahan in ('rendah', 'sedang', 'tinggi', 'kritis')),
  deskripsi text not null,
  tindak_lanjut text,
  petugas_pelapor_id uuid references public.pengguna(id) on delete set null,
  nama_petugas_pelapor varchar(150),
  status_penyelesaian varchar(20) not null default 'menunggu' check (status_penyelesaian in ('menunggu', 'diproses', 'selesai')),
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

-- Indexing
create index if not exists idx_incidents_sekolah_tanggal on public.incident_reports(id_sekolah, tanggal);
create index if not exists idx_incidents_kategori on public.incident_reports(kategori);
create index if not exists idx_incidents_tingkat on public.incident_reports(tingkat_keparahan);

-- Row Level Security (RLS)
alter table public.incident_reports enable row level security;

-- Public read for monitoring / staff
drop policy if exists "Public read incident reports" on public.incident_reports;
create policy "Public read incident reports" on public.incident_reports for select using (true);

-- Staff manage incident reports for their school, Super Admin manage all
drop policy if exists "Staff manage incident reports" on public.incident_reports;
create policy "Staff manage incident reports" on public.incident_reports for all to authenticated using (
  id_sekolah = nullif(auth.jwt() ->> 'id_sekolah', '')::uuid or
  exists (select 1 from public.pengguna where id = auth.uid() and (id_sekolah = public.incident_reports.id_sekolah or peran = 'super_admin'))
);

grant all on public.incident_reports to anon, authenticated, service_role;

