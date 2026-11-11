-- ============================================================
-- Nutri Kampus Hub - Supabase SQL Schema v1.2 (Final Release)
-- Sesuai PRD v1.2: Anti-Fraud, Food Safety, Offline-First & CRM
-- ============================================================

-- 1. Ekstensi
create extension if not exists pgcrypto;

-- ============================================================
-- CLEANUP TABEL LAMA (jika ada) - Jalankan sekali saja
-- ============================================================
drop table if exists public.riwayat_aktivitas cascade;
drop table if exists public.penerimaan_mbg cascade;
drop table if exists public.distribusi_mbg cascade;
drop table if exists public.siswa cascade;
drop table if exists public.kelas cascade;
drop table if exists public.pengguna cascade;

-- ============================================================
-- SKEMA BARU v1.2
-- ============================================================

-- 2. Tabel Sekolah (Multi-tenant support)
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  npsn varchar(20) unique not null,
  nama_sekolah varchar(255) not null,
  nama_kepala_sekolah varchar(255),
  nip_kepala_sekolah varchar(50),
  nama_sppg_mitra varchar(255),
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

-- 3. Tabel Pengguna (RBAC: Super Admin, Guru, Kepala Sekolah)
create table if not exists public.pengguna (
  id uuid primary key references auth.users(id) on delete cascade,
  id_sekolah uuid references public.schools(id),
  nama varchar(150) not null,
  email varchar(150) not null,
  peran text not null check (peran in ('super_admin', 'guru_piket', 'kepala_sekolah')),
  status_aktif boolean not null default true,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

-- 4. Tabel Kelas
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  id_sekolah uuid not null references public.schools(id) on delete cascade,
  nama_kelas varchar(50) not null,
  tingkat varchar(10) not null,
  jurusan text check (jurusan in ('IPA', 'IPS', 'RPL', 'TKJ', 'AKUNTANSI', 'UMUM')),
  total_siswa_dapodik integer not null default 0,
  status_aktif boolean not null default true,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

-- 5. Tabel Siswa (Basis Presensi MBG & CRM)
create table if not exists public.students (
  nisn varchar(10) primary key,
  id_kelas uuid not null references public.classes(id) on delete restrict,
  nama_lengkap varchar(255) not null,
  no_hp varchar(20) not null, -- format 628xxx
  email varchar(255),
  jurusan text,
  alergi_makanan text,
  is_perwakilan_kelas boolean default false,
  lead_score integer default 0,
  lead_status text default 'COLD' check (lead_status in ('COLD', 'WARM', 'HOT')),
  status_aktif boolean not null default true,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

-- 6. Tabel Uji Organoleptik & Sesi Harian (Bagian A)
create table if not exists public.organoleptic_tests (
  id uuid primary key default gen_random_uuid(),
  id_sekolah uuid not null references public.schools(id),
  id_guru_piket uuid not null references public.pengguna(id),
  tanggal date not null default current_date,
  jam_tiba time not null,
  master_qr_token text not null,
  kode_pin_harian varchar(4) not null,
  status_ketepatan text check (status_ketepatan in ('TEPAT_WAKTU', 'TERLAMBAT')),
  status_aroma text,
  status_rasa text,
  status_tekstur text,
  status_wadah text,
  foto_sampel_url text,
  is_sampel_disimpan boolean default true,
  catatan_kelayakan text,
  kesimpulan text check (kesimpulan in ('LAYAK_EDAR', 'TOLAK_RETUR')),
  catatan_kejadian_khusus text,
  nama_sppg_aktual text,
  dibuat_pada timestamptz not null default now()
);

-- 7. Tabel Rekapitulasi Distribusi Kelas (Bagian B)
create table if not exists public.daily_attendances (
  id uuid primary key default gen_random_uuid(),
  id_kelas uuid not null references public.classes(id),
  id_uji uuid not null references public.organoleptic_tests(id),
  tanggal date not null default current_date,
  jumlah_hadir integer not null default 0,
  jumlah_absen integer not null default 0,
  status_ambil text default 'MENUNGGU' check (status_ambil in ('MENUNGGU', 'SUDAH_TERIMA_MBG', 'OMPRENG_KEMBALI')),
  ompreng_utuh integer default 0,
  ompreng_rusak integer default 0,
  ompreng_hilang integer default 0,
  ttd_perwakilan_siswa text, -- Base64 atau URL
  waktu_terima_kelas timestamptz,
  waktu_kembali_ompreng timestamptz,
  dibuat_pada timestamptz not null default now()
);

-- 8. Tabel Detail Penerimaan per Siswa (Anti-Fraud)
create table if not exists public.student_mbg_logs (
  id uuid primary key default gen_random_uuid(),
  id_log uuid not null references public.daily_attendances(id),
  nisn varchar(10) not null references public.students(nisn),
  nama_siswa_snapshot varchar(255),
  tipe_klaim text check (tipe_klaim in ('KOLEKTIF_KELAS', 'MANDIRI', 'SUSULAN')),
  status_terima text check (status_terima in ('SUDAH_AMBIL', 'ABSEN_TIDAK_AMBIL')),
  waktu_ambil timestamptz default now()
);

-- 9. Tabel CRM Campaigns & Klik
create table if not exists public.crm_campaigns (
  id uuid primary key default gen_random_uuid(),
  judul_promo text not null,
  banner_image_url text,
  target_tingkat varchar(10) default 'XII',
  target_jurusan text[],
  rekomendasi_fakultas_ubsi text,
  cta_url_template text,
  poin_interaksi integer default 1,
  status_aktif boolean not null default true
);

create table if not exists public.crm_click_logs (
  id uuid primary key default gen_random_uuid(),
  nisn varchar(10) references public.students(nisn),
  id_campaign uuid references public.crm_campaigns(id),
  waktu_klik timestamptz default now()
);

-- 10. Tabel Riwayat Aktivitas (Audit Log)
create table if not exists public.riwayat_aktivitas (
  id uuid primary key default gen_random_uuid(),
  pengguna_id uuid references public.pengguna(id) on delete set null,
  aktivitas varchar(100) not null,
  tabel_terkait varchar(50) not null,
  data_id uuid,
  data_sebelum jsonb,
  data_sesudah jsonb,
  waktu_aktivitas timestamptz not null default now()
);

-- 11. Tabel Kejadian Khusus (Incident Reports)
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

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_students_nama on public.students (nama_lengkap);
create index if not exists idx_students_kelas on public.students (id_kelas);
create index if not exists idx_students_nisn on public.students (nisn);
create index if not exists idx_daily_attendances_kelas on public.daily_attendances (id_kelas);
create index if not exists idx_daily_attendances_tanggal on public.daily_attendances (tanggal);
create index if not exists idx_organoleptic_tanggal on public.organoleptic_tests (tanggal);
create index if not exists idx_student_mbg_logs_log on public.student_mbg_logs (id_log);
create index if not exists idx_incidents_sekolah_tanggal on public.incident_reports(id_sekolah, tanggal);
create index if not exists idx_incidents_kategori on public.incident_reports(kategori);
create index if not exists idx_incidents_tingkat on public.incident_reports(tingkat_keparahan);

-- ============================================================
-- RLS (Row Level Security) - Multi-Tenant SaaS Isolation
-- ============================================================
alter table public.schools enable row level security;
alter table public.pengguna enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.organoleptic_tests enable row level security;
alter table public.daily_attendances enable row level security;
alter table public.student_mbg_logs enable row level security;
alter table public.riwayat_aktivitas enable row level security;
alter table public.crm_campaigns enable row level security;
alter table public.crm_click_logs enable row level security;
alter table public.incident_reports enable row level security;

-- Schools: Public read, Super Admin manage
drop policy if exists "Public read schools" on public.schools;
create policy "Public read schools" on public.schools for select using (true);
drop policy if exists "Admin manage schools" on public.schools;
create policy "Admin manage schools" on public.schools for all to authenticated using (
  (auth.jwt() ->> 'peran') = 'super_admin' or
  exists (select 1 from public.pengguna where id = auth.uid() and peran = 'super_admin')
);

-- Pengguna: User read own, Super Admin manage all
drop policy if exists "User read own profile" on public.pengguna;
create policy "User read own profile" on public.pengguna for select using (id = auth.uid());
drop policy if exists "Super admin manage pengguna" on public.pengguna;
create policy "Super admin manage pengguna" on public.pengguna for all to authenticated using (
  (auth.jwt() ->> 'peran') = 'super_admin' or
  exists (select 1 from public.pengguna where id = auth.uid() and peran = 'super_admin')
);

-- Classes: Public read for student portal, Guru/Kepsek manage own school, Super Admin manage all
drop policy if exists "Public read classes" on public.classes;
create policy "Public read classes" on public.classes for select using (true);
drop policy if exists "Guru read school classes" on public.classes;
drop policy if exists "Guru manage school classes" on public.classes;
create policy "Guru manage school classes" on public.classes for all to authenticated using (
  id_sekolah = nullif(auth.jwt() ->> 'id_sekolah', '')::uuid or
  exists (select 1 from public.pengguna where id = auth.uid() and (id_sekolah = public.classes.id_sekolah or peran = 'super_admin'))
);
drop policy if exists "Super admin manage classes" on public.classes;

-- Students: Public read for student verification, Guru/Kepsek manage own school, Super Admin manage all
drop policy if exists "Public read students" on public.students;
create policy "Public read students" on public.students for select using (true);
drop policy if exists "Guru read school students" on public.students;
drop policy if exists "Guru manage school students" on public.students;
create policy "Guru manage school students" on public.students for all to authenticated using (
  exists (
    select 1 from public.classes c
    where c.id = public.students.id_kelas
      and (
        c.id_sekolah = nullif(auth.jwt() ->> 'id_sekolah', '')::uuid or
        exists (
          select 1 from public.pengguna p
          where p.id = auth.uid() and (p.id_sekolah = c.id_sekolah or p.peran = 'super_admin')
        )
      )
  )
);
drop policy if exists "Super admin manage students" on public.students;

-- Organoleptic Tests: Public read for QR/PIN verification, Guru piket/Kepsek manage their school tests
drop policy if exists "Public read organoleptic tests" on public.organoleptic_tests;
create policy "Public read organoleptic tests" on public.organoleptic_tests for select using (true);
drop policy if exists "Guru manage organoleptic tests" on public.organoleptic_tests;
create policy "Guru manage organoleptic tests" on public.organoleptic_tests for all to authenticated using (
  id_guru_piket = auth.uid() or
  id_sekolah = nullif(auth.jwt() ->> 'id_sekolah', '')::uuid or
  exists (select 1 from public.pengguna where id = auth.uid() and (id_sekolah = public.organoleptic_tests.id_sekolah or peran = 'super_admin'))
);
drop policy if exists "Read organoleptic tests" on public.organoleptic_tests;

-- Daily Attendances: Public read, Guru piket/Kepsek manage their school
drop policy if exists "Public read daily attendances" on public.daily_attendances;
create policy "Public read daily attendances" on public.daily_attendances for select using (true);
drop policy if exists "Guru manage daily attendances" on public.daily_attendances;
create policy "Guru manage daily attendances" on public.daily_attendances for all to authenticated using (
  exists (
    select 1 from public.organoleptic_tests o
    where o.id = public.daily_attendances.id_uji
      and (
        o.id_sekolah = nullif(auth.jwt() ->> 'id_sekolah', '')::uuid or
        exists (
          select 1 from public.pengguna p
          where p.id = auth.uid() and (p.id_sekolah = o.id_sekolah or p.peran = 'super_admin')
        )
      )
  )
);

-- Student MBG Logs: Public read, Guru piket/Kepsek manage
drop policy if exists "Public read student mbg logs" on public.student_mbg_logs;
create policy "Public read student mbg logs" on public.student_mbg_logs for select using (true);
drop policy if exists "Guru manage student mbg logs" on public.student_mbg_logs;
create policy "Guru manage student mbg logs" on public.student_mbg_logs for all to authenticated using (
  exists (
    select 1 from public.daily_attendances d
    join public.organoleptic_tests o on o.id = d.id_uji
    where d.id = public.student_mbg_logs.id_log
      and (
        o.id_sekolah = nullif(auth.jwt() ->> 'id_sekolah', '')::uuid or
        exists (
          select 1 from public.pengguna p
          where p.id = auth.uid() and (p.id_sekolah = o.id_sekolah or p.peran = 'super_admin')
        )
      )
  )
);

-- Riwayat Aktivitas: Admin/Guru read
drop policy if exists "Staff read riwayat" on public.riwayat_aktivitas;
create policy "Staff read riwayat" on public.riwayat_aktivitas for select to authenticated using (
  exists (select 1 from public.pengguna where id = auth.uid() and peran in ('super_admin', 'guru_piket', 'kepala_sekolah'))
);
drop policy if exists "System insert riwayat" on public.riwayat_aktivitas;
create policy "System insert riwayat" on public.riwayat_aktivitas for insert with check (true);

-- CRM Campaigns: Public read for targeting, Admin manage
drop policy if exists "Public read campaigns" on public.crm_campaigns;
create policy "Public read campaigns" on public.crm_campaigns for select using (true);
drop policy if exists "Super admin manage campaigns" on public.crm_campaigns;
create policy "Super admin manage campaigns" on public.crm_campaigns for all to authenticated using (
  exists (select 1 from public.pengguna where id = auth.uid() and peran = 'super_admin')
);

-- CRM Click Logs: Insert by students, Read by Admin
drop policy if exists "Students insert clicks" on public.crm_click_logs;
create policy "Students insert clicks" on public.crm_click_logs for insert with check (true);
drop policy if exists "Admin read clicks" on public.crm_click_logs;
create policy "Admin read clicks" on public.crm_click_logs for select to authenticated using (
  exists (select 1 from public.pengguna where id = auth.uid() and peran = 'super_admin')
);

-- Incident Reports: Public read, Staff manage for their school, Super Admin manage all
drop policy if exists "Public read incident reports" on public.incident_reports;
create policy "Public read incident reports" on public.incident_reports for select using (true);
drop policy if exists "Staff manage incident reports" on public.incident_reports;
create policy "Staff manage incident reports" on public.incident_reports for all to authenticated using (
  id_sekolah = nullif(auth.jwt() ->> 'id_sekolah', '')::uuid or
  exists (select 1 from public.pengguna where id = auth.uid() and (id_sekolah = public.incident_reports.id_sekolah or peran = 'super_admin'))
);

-- ============================================================
-- RPC FUNCTIONS (Server-side Logic)
-- ============================================================

-- 1. Status Distribusi Hari Ini
drop function if exists public.status_distribusi_hari_ini(date);
drop function if exists public.status_distribusi_hari_ini();
create or replace function public.status_distribusi_hari_ini(p_tanggal date default (now() at time zone 'Asia/Jakarta')::date)
returns table (
  id uuid,
  id_kelas uuid,
  id_uji uuid,
  tanggal date,
  jumlah_hadir integer,
  jumlah_absen integer,
  status_ambil text,
  waktu_terima_kelas timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, id_kelas, id_uji, tanggal, jumlah_hadir, jumlah_absen, status_ambil, waktu_terima_kelas
  from public.daily_attendances
  where tanggal = p_tanggal;
$$;

-- 2. Cari Siswa untuk Konfirmasi (mengembalikan info minimal)
drop function if exists public.cari_siswa_konfirmasi(text, uuid, text);
drop function if exists public.cari_siswa_konfirmasi();
create or replace function public.cari_siswa_konfirmasi(
  p_nama text default null,
  p_kelas_id uuid default null,
  p_jurusan text default null
)
returns table (
  nisn varchar(10),
  nama_lengkap varchar(255),
  nama_kelas varchar(50),
  jurusan text,
  sudah_menerima boolean,
  waktu_penerimaan timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
  v_uji_id uuid;
begin
  -- Cari uji organoleptik hari ini yang LAYAK_EDAR
  select id into v_uji_id
  from public.organoleptic_tests
  where tanggal = v_hari_ini and kesimpulan = 'LAYAK_EDAR'
  limit 1;

  return query
  select 
    s.nisn,
    s.nama_lengkap,
    c.nama_kelas,
    c.jurusan,
    (dl.id is not null) as sudah_menerima,
    dl.waktu_terima_kelas as waktu_penerimaan
  from public.students s
  join public.classes c on s.id_kelas = c.id
  left join public.daily_attendances da on da.id_kelas = c.id and da.id_uji = v_uji_id
  left join public.student_mbg_logs dl on dl.id_log = da.id and dl.nisn = s.nisn and dl.status_terima = 'SUDAH_AMBIL'
  where s.status_aktif = true
    and (p_nama is null or s.nama_lengkap ilike '%' || p_nama || '%')
    and (p_kelas_id is null or s.id_kelas = p_kelas_id)
    and (p_jurusan is null or p_jurusan = '' or c.jurusan = p_jurusan)
    and v_uji_id is not null
  order by s.nama_lengkap asc
  limit 50;
end;
$$;

-- 3. Konfirmasi Penerimaan oleh Siswa (Anti-Fraud + Idempotency)
drop function if exists public.konfirmasi_penerimaan_siswa(varchar);
drop function if exists public.konfirmasi_penerimaan_siswa(uuid);
create or replace function public.konfirmasi_penerimaan_siswa(p_nisn varchar(10))
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
  v_uji record;
  v_kelas_id uuid;
  v_da_id uuid;
  v_siswa record;
  v_waktu_sekarang timestamptz := clock_timestamp();
  v_log_id uuid;
  v_existing boolean;
begin
  -- 1. Cek uji organoleptik hari ini yang LAYAK_EDAR
  select * into v_uji
  from public.organoleptic_tests
  where tanggal = v_hari_ini and kesimpulan = 'LAYAK_EDAR'
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'message', 'MBG hari ini belum tiba atau tidak layak edar.');
  end if;

  -- 2. Cek siswa aktif
  select s.*, c.id as kelas_id into v_siswa
  from public.students s
  join public.classes c on s.id_kelas = c.id
  where s.nisn = p_nisn and s.status_aktif = true;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Data siswa tidak ditemukan atau tidak aktif.');
  end if;

  v_kelas_id := v_siswa.kelas_id;

  -- 3. Cek/Buat daily_attendance untuk kelas ini
  select id into v_da_id
  from public.daily_attendances
  where id_uji = v_uji.id and id_kelas = v_kelas_id
  limit 1;

  if not found then
    insert into public.daily_attendances (id_kelas, id_uji, tanggal, status_ambil)
    values (v_kelas_id, v_uji.id, v_hari_ini, 'MENUNGGU')
    returning id into v_da_id;
  end if;

  -- 4. Cek idempotency - sudah pernah ambil?
  select true into v_existing
  from public.student_mbg_logs
  where id_log = v_da_id and nisn = p_nisn and status_terima = 'SUDAH_AMBIL';

  if v_existing then
    return jsonb_build_object(
      'success', false, 
      'already_received', true,
      'message', 'Anda sudah tercatat menerima MBG hari ini.',
      'waktu_penerimaan', (select waktu_ambil from public.student_mbg_logs where id_log = v_da_id and nisn = p_nisn limit 1)
    );
  end if;

  -- 5. Insert log penerimaan (KOLEKTIF_KELAS default, bisa diubah di frontend)
  insert into public.student_mbg_logs (id_log, nisn, nama_siswa_snapshot, tipe_klaim, status_terima, waktu_ambil)
  values (v_da_id, v_siswa.nisn, v_siswa.nama_lengkap, 'KOLEKTIF_KELAS', 'SUDAH_AMBIL', v_waktu_sekarang)
  returning id into v_log_id;

  -- 6. Update counters di daily_attendances
  update public.daily_attendances
  set 
    jumlah_hadir = (select count(*) from public.student_mbg_logs where id_log = v_da_id and status_terima = 'SUDAH_AMBIL'),
    jumlah_absen = (
      select total_siswa_dapodik - (select count(*) from public.student_mbg_logs where id_log = v_da_id and status_terima = 'SUDAH_AMBIL')
      from public.classes where id = v_kelas_id
    ),
    status_ambil = 'SUDAH_TERIMA_MBG',
    waktu_terima_kelas = coalesce(waktu_terima_kelas, v_waktu_sekarang)
  where id = v_da_id;

  -- 7. Audit log
  insert into public.riwayat_aktivitas (aktivitas, tabel_terkait, data_id, data_sesudah, waktu_aktivitas)
  values ('konfirmasi_mandiri_siswa', 'student_mbg_logs', v_log_id, 
    jsonb_build_object('nisn', v_siswa.nisn, 'nama', v_siswa.nama_lengkap, 'waktu', v_waktu_sekarang), v_waktu_sekarang);

  return jsonb_build_object(
    'success', true,
    'message', 'Penerimaan MBG berhasil dicatat.',
    'nama_siswa', v_siswa.nama_lengkap,
    'kelas', (select nama_kelas from public.classes where id = v_kelas_id),
    'waktu_penerimaan', v_waktu_sekarang
  );
end;
$$;

-- 4. Konfirmasi Massal oleh Guru Piket (Checklist Kelas)
drop function if exists public.konfirmasi_massal_kelas(uuid, uuid, varchar[], text, uuid);
drop function if exists public.konfirmasi_massal_kelas(uuid, uuid, varchar[], uuid, text);
drop function if exists public.konfirmasi_massal_kelas(uuid, uuid, varchar[], uuid);
drop function if exists public.konfirmasi_massal_kelas(uuid, uuid[]);
drop function if exists public.konfirmasi_massal_kelas;
create or replace function public.konfirmasi_massal_kelas(
  p_id_uji uuid,
  p_id_kelas uuid,
  p_nisn_list varchar(10)[],      -- NISN yang hadir
  p_petugas_id uuid default null,
  p_tipe_klaim text default 'KOLEKTIF_KELAS'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
  v_da_id uuid;
  v_siswa record;
  v_success_count int := 0;
  v_skip_count int := 0;
  v_now timestamptz := clock_timestamp();
  v_total_kelas int;
begin
  -- 1. Validasi uji organoleptik
  if not exists (select 1 from public.organoleptic_tests where id = p_id_uji and kesimpulan = 'LAYAK_EDAR') then
    return jsonb_build_object('success', false, 'message', 'Sesi MBG tidak valid atau tidak layak edar.');
  end if;

  -- 2. Cek/Buat daily_attendance
  select id into v_da_id
  from public.daily_attendances
  where id_uji = p_id_uji and id_kelas = p_id_kelas
  limit 1;

  if not found then
    insert into public.daily_attendances (id_kelas, id_uji, tanggal, status_ambil)
    values (p_id_kelas, p_id_uji, v_hari_ini, 'MENUNGGU')
    returning id into v_da_id;
  end if;

  -- 3. Total siswa di kelas
  select total_siswa_dapodik into v_total_kelas from public.classes where id = p_id_kelas;

  -- 4. Loop siswa yang hadir
  for v_siswa in 
    select nisn, nama_lengkap from public.students 
    where id_kelas = p_id_kelas and nisn = any(p_nisn_list) and status_aktif = true
  loop
    -- Cek existing
    if exists (select 1 from public.student_mbg_logs where id_log = v_da_id and nisn = v_siswa.nisn and status_terima = 'SUDAH_AMBIL') then
      v_skip_count := v_skip_count + 1;
    else
      insert into public.student_mbg_logs (id_log, nisn, nama_siswa_snapshot, tipe_klaim, status_terima, waktu_ambil)
      values (v_da_id, v_siswa.nisn, v_siswa.nama_lengkap, p_tipe_klaim, 'SUDAH_AMBIL', v_now);
      v_success_count := v_success_count + 1;
    end if;
  end loop;

  -- 5. Update counters
  update public.daily_attendances
  set 
    jumlah_hadir = v_success_count + (select count(*) from public.student_mbg_logs where id_log = v_da_id and status_terima = 'SUDAH_AMBIL') - v_success_count,
    jumlah_absen = greatest(v_total_kelas - v_success_count, 0),
    status_ambil = 'SUDAH_TERIMA_MBG',
    waktu_terima_kelas = coalesce(waktu_terima_kelas, v_now)
  where id = v_da_id;

  -- 6. Audit log
  insert into public.riwayat_aktivitas (aktivitas, tabel_terkait, data_id, data_sesudah, pengguna_id, waktu_aktivitas)
  values ('konfirmasi_massal_kelas', 'daily_attendances', v_da_id, 
    jsonb_build_object('berhasil', v_success_count, 'dilewati', v_skip_count), p_petugas_id, v_now);

  return jsonb_build_object(
    'success', true,
    'berhasil', v_success_count,
    'dilewati', v_skip_count
  );
end;
$$;

-- ============================================================
-- TRIGGER LEAD SCORING CRM
-- ============================================================
drop trigger if exists tr_crm_click_score on public.crm_click_logs;
drop function if exists update_student_lead_score() cascade;

create or replace function update_student_lead_score()
returns trigger as $$
begin
  update public.students 
  set lead_score = lead_score + (select poin_interaksi from public.crm_campaigns where id = new.id_campaign)
  where nisn = new.nisn;
  
  -- Update Status
  update public.students
  set lead_status = case 
    when lead_score >= 3 then 'HOT'
    when lead_score >= 1 then 'WARM'
    else 'COLD'
  end
  where nisn = new.nisn;
  
  return new;
end;
$$ language plpgsql;

create trigger tr_crm_click_score
after insert on public.crm_click_logs
for each row execute function update_student_lead_score();

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- ============================================================
-- SEED MULTI-SEKOLAH DUMMY (MULTI-TENANT TESTING)
-- ============================================================
insert into public.schools (id, npsn, nama_sekolah, nama_kepala_sekolah, nip_kepala_sekolah, nama_sppg_mitra)
values
  ('11111111-1111-1111-1111-111111111111', '20220101', 'SMK Bina Sarana Informatika (UBSI Center)', 'Dr. Mochamad Wahyudi, M.M', '197508122005011002', 'SPPG Sehat Barokah Surakarta'),
  ('11111111-1111-1111-1111-111111111112', '20327971', 'SMAN 1 Surakarta', 'Drs. Harminingsih, M.Pd', '196804151993032008', 'SPPG Nusantara Mandiri'),
  ('11111111-1111-1111-1111-111111111113', '20327986', 'SMKN 2 Surakarta', 'Sugiyarso, S.Pd, M.Pd', '197011201995121003', 'SPPG Gizi Prima Solo'),
  ('11111111-1111-1111-1111-111111111114', '20327974', 'SMAN 4 Surakarta', 'Drs. Yusmar Setyobudi, M.M', '196909101994031005', 'SPPG Berkah Mulia')
on conflict (id) do nothing;

insert into public.classes (id, id_sekolah, nama_kelas, tingkat, jurusan, total_siswa_dapodik, status_aktif)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'XII RPL 1', 'XII', 'RPL', 25, true),
  ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'XII RPL 2', 'XII', 'RPL', 25, true),
  ('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'XII TKJ 1', 'XII', 'TKJ', 17, true),
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111112', 'XII IPA 1', 'XII', 'IPA', 32, true),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111112', 'XII IPS 1', 'XII', 'IPS', 30, true),
  ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111113', 'XII TKJ A', 'XII', 'TKJ', 34, true),
  ('77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111114', 'XII IPA A', 'XII', 'IPA', 30, true)
on conflict (id) do nothing;

insert into public.students (nisn, id_kelas, nama_lengkap, no_hp, jurusan, alergi_makanan, is_perwakilan_kelas, status_aktif)
values
  ('1000000001', '22222222-2222-2222-2222-222222222222', 'Alroy Theola Ardanta', '6281234567890', 'RPL', 'Alergi Kacang & Seafood', true, true),
  ('1000000002', '22222222-2222-2222-2222-222222222222', 'Annisa Rahmawati', '6281234567891', 'RPL', null, false, true),
  ('1000000003', '22222222-2222-2222-2222-222222222222', 'Bagas Pratama', '6281234567892', 'RPL', 'Alergi Telur', false, true),
  ('1000000026', '33333333-3333-3333-3333-333333333333', 'Joko Prabowo', '6281234567896', 'RPL', null, true, true),
  ('1000000051', '44444444-4444-4444-4444-444444444444', 'Olivia Zahra', '6281234567898', 'TKJ', null, true, true),
  ('2000000001', '55555555-5555-5555-5555-555555555551', 'Rizky Aditya Saputra', '6281399001101', 'IPA', null, true, true),
  ('3000000001', '66666666-6666-6666-6666-666666666661', 'Fajar Nugroho', '6281399002201', 'TKJ', 'Alergi Udang', true, true)
on conflict (nisn) do nothing;

