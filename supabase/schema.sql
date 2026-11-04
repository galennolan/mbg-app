-- ============================================================
-- MBG Tracker - Supabase SQL Schema & RLS Setup
-- Sesuai PRD MBG Tracker Versi 1.1
-- ============================================================

-- 1. Ekstensi
create extension if not exists pgcrypto;

-- 2. Tabel Pengguna (Profil Guru & Administrator)
create table if not exists public.pengguna (
  id uuid primary key references auth.users(id) on delete cascade,
  nama varchar(150) not null,
  email varchar(150) not null,
  peran text not null check (peran in ('admin', 'guru')),
  status_aktif boolean not null default true,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

-- 3. Tabel Kelas
create table if not exists public.kelas (
  id uuid primary key default gen_random_uuid(),
  nama_kelas varchar(50) not null unique,
  tingkat varchar(10) not null check (tingkat in ('X', 'XI', 'XII')),
  jurusan varchar(100) not null,
  status_aktif boolean not null default true,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

-- 4. Tabel Siswa
create table if not exists public.siswa (
  id uuid primary key default gen_random_uuid(),
  nisn varchar(20) unique,
  nama varchar(150) not null,
  kelas_id uuid not null references public.kelas(id) on delete restrict,
  email varchar(150),
  no_hp varchar(20),
  status_aktif boolean not null default true,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

-- 5. Tabel Distribusi MBG
create table if not exists public.distribusi_mbg (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null unique,
  status text not null default 'menunggu'
    check (status in ('menunggu', 'tiba', 'ditutup')),
  waktu_kedatangan timestamptz,
  waktu_input timestamptz,
  petugas_id uuid references public.pengguna(id) on delete restrict,
  keterangan text,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

-- 6. Tabel Penerimaan MBG
create table if not exists public.penerimaan_mbg (
  id uuid primary key default gen_random_uuid(),
  distribusi_id uuid not null references public.distribusi_mbg(id) on delete restrict,
  siswa_id uuid not null references public.siswa(id) on delete restrict,
  nama_siswa varchar(150) not null,
  nisn varchar(20),
  kelas varchar(50) not null,
  jurusan varchar(100) not null,
  status_penerimaan text not null
    check (status_penerimaan in ('diterima', 'tidak_hadir', 'tidak_mengambil')),
  waktu_penerimaan timestamptz,
  sumber_pencatatan text not null
    check (sumber_pencatatan in ('siswa', 'guru')),
  petugas_id uuid references public.pengguna(id) on delete restrict,
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now(),
  unique (distribusi_id, siswa_id),
  check (
    (status_penerimaan = 'diterima' and waktu_penerimaan is not null)
    or
    (status_penerimaan <> 'diterima' and waktu_penerimaan is null)
  )
);

-- 7. Tabel Riwayat Aktivitas (Audit Log)
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

-- Indeks Kinerja
create index if not exists idx_siswa_nama on public.siswa (nama);
create index if not exists idx_siswa_kelas on public.siswa (kelas_id);
create index if not exists idx_penerimaan_distribusi on public.penerimaan_mbg (distribusi_id);
create index if not exists idx_penerimaan_siswa on public.penerimaan_mbg (siswa_id);
create index if not exists idx_distribusi_tanggal on public.distribusi_mbg (tanggal);

-- ============================================================
-- HAK AKSES DASAR (GRANT PRIVILEGES)
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
alter table public.pengguna enable row level security;
alter table public.kelas enable row level security;
alter table public.siswa enable row level security;
alter table public.distribusi_mbg enable row level security;
alter table public.penerimaan_mbg enable row level security;
alter table public.riwayat_aktivitas enable row level security;

-- Policy Pengguna
drop policy if exists "Authenticated read pengguna" on public.pengguna;
create policy "Authenticated read pengguna" on public.pengguna
  for select to authenticated using (true);

drop policy if exists "Users update own profile or admin" on public.pengguna;
create policy "Users update own profile or admin" on public.pengguna
  for update to authenticated using (
    id = auth.uid() or 
    exists (select 1 from public.pengguna where id = auth.uid() and peran = 'admin')
  );

drop policy if exists "Admin insert pengguna" on public.pengguna;
create policy "Admin insert pengguna" on public.pengguna
  for insert to authenticated with check (
    id = auth.uid() or
    exists (select 1 from public.pengguna where id = auth.uid() and peran = 'admin')
  );

-- Policy Kelas: Publik/Anonim dan Auth bisa baca kelas aktif
drop policy if exists "Read active kelas" on public.kelas;
create policy "Read active kelas" on public.kelas
  for select to anon, authenticated using (status_aktif = true);

drop policy if exists "Admin manage kelas" on public.kelas;
create policy "Admin manage kelas" on public.kelas
  for all to authenticated using (
    exists (select 1 from public.pengguna where id = auth.uid() and peran = 'admin')
  );

-- Policy Siswa: Guru & Admin baca siswa, Admin kelola siswa
drop policy if exists "Guru and Admin read siswa" on public.siswa;
create policy "Guru and Admin read siswa" on public.siswa
  for select to authenticated using (true);

drop policy if exists "Admin manage siswa" on public.siswa;
create policy "Admin manage siswa" on public.siswa
  for all to authenticated using (
    exists (select 1 from public.pengguna where id = auth.uid() and peran = 'admin')
  );

-- Policy Distribusi MBG: Siapapun (termasuk anon) bisa baca info status distribusi
drop policy if exists "Read distribusi" on public.distribusi_mbg;
create policy "Read distribusi" on public.distribusi_mbg
  for select to anon, authenticated using (true);

drop policy if exists "Staff manage distribusi" on public.distribusi_mbg;
create policy "Staff manage distribusi" on public.distribusi_mbg
  for all to authenticated using (
    exists (select 1 from public.pengguna where id = auth.uid() and status_aktif = true)
  );

-- Policy Penerimaan MBG:
drop policy if exists "Staff read all penerimaan" on public.penerimaan_mbg;
create policy "Staff read all penerimaan" on public.penerimaan_mbg
  for select to authenticated using (true);

drop policy if exists "Staff insert/update penerimaan" on public.penerimaan_mbg;
create policy "Staff insert/update penerimaan" on public.penerimaan_mbg
  for all to authenticated using (
    exists (select 1 from public.pengguna where id = auth.uid() and status_aktif = true)
  );

-- Policy Riwayat Aktivitas:
drop policy if exists "Admin read riwayat" on public.riwayat_aktivitas;
create policy "Admin read riwayat" on public.riwayat_aktivitas
  for select to authenticated using (
    exists (select 1 from public.pengguna where id = auth.uid() and peran in ('admin', 'guru'))
  );

drop policy if exists "Staff insert riwayat" on public.riwayat_aktivitas;
create policy "Staff insert riwayat" on public.riwayat_aktivitas
  for insert to anon, authenticated with check (true);

-- ============================================================
-- STORED FUNCTIONS / RPC FOR PUBLIC STUDENT WORKFLOW
-- Security Definer ensures safe access without leaking private NISN/email/phone
-- ============================================================

-- 1. Status Distribusi Hari Ini
create or replace function public.status_distribusi_hari_ini(p_tanggal date default (now() at time zone 'Asia/Jakarta')::date)
returns table (
  id uuid,
  tanggal date,
  status text,
  waktu_kedatangan timestamptz,
  waktu_input timestamptz,
  keterangan text
)
language sql
security definer
set search_path = public
as $$
  select id, tanggal, status, waktu_kedatangan, waktu_input, keterangan
  from public.distribusi_mbg
  where tanggal = p_tanggal
  limit 1;
$$;

-- 2. Pencarian Siswa (Hanya mengembalikan id, nama, kelas, jurusan untuk verifikasi siswa)
create or replace function public.cari_siswa(
  p_nama text,
  p_kelas_id uuid default null,
  p_jurusan text default null
)
returns table (
  id uuid,
  nama varchar(150),
  nama_kelas varchar(50),
  jurusan varchar(100),
  sudah_menerima boolean,
  waktu_penerimaan timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
  v_distribusi_id uuid;
begin
  select d.id into v_distribusi_id
  from public.distribusi_mbg d
  where d.tanggal = v_hari_ini
  limit 1;

  return query
  select 
    s.id,
    s.nama,
    k.nama_kelas,
    k.jurusan,
    (p.id is not null and p.status_penerimaan = 'diterima') as sudah_menerima,
    p.waktu_penerimaan
  from public.siswa s
  join public.kelas k on s.kelas_id = k.id
  left join public.penerimaan_mbg p on p.siswa_id = s.id and p.distribusi_id = v_distribusi_id
  where s.status_aktif = true
    and (p_nama is null or s.nama ilike '%' || p_nama || '%')
    and (p_kelas_id is null or s.kelas_id = p_kelas_id)
    and (p_jurusan is null or p_jurusan = '' or k.jurusan = p_jurusan)
  order by s.nama asc
  limit 30;
end;
$$;

-- 3. Konfirmasi Penerimaan oleh Siswa (Atomic & Secure)
create or replace function public.konfirmasi_penerimaan_siswa(p_siswa_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hari_ini date := (now() at time zone 'Asia/Jakarta')::date;
  v_distribusi record;
  v_siswa record;
  v_waktu_sekarang timestamptz := clock_timestamp();
  v_penerimaan_id uuid;
begin
  -- 1. Cek distribusi hari ini
  select * into v_distribusi
  from public.distribusi_mbg
  where tanggal = v_hari_ini;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Distribusi hari ini belum dibuat oleh guru/admin.');
  end if;

  if v_distribusi.status = 'menunggu' then
    return jsonb_build_object('success', false, 'message', 'MBG Belum Tiba. Konfirmasi belum dibuka.');
  end if;

  if v_distribusi.status = 'ditutup' then
    return jsonb_build_object('success', false, 'message', 'Distribusi hari ini sudah ditutup.');
  end if;

  -- 2. Cek siswa aktif & snapshot data
  select s.id, s.nama, s.nisn, k.nama_kelas, k.jurusan
  into v_siswa
  from public.siswa s
  join public.kelas k on s.kelas_id = k.id
  where s.id = p_siswa_id and s.status_aktif = true;

  if not found then
    return jsonb_build_object('success', false, 'message', 'Data siswa tidak ditemukan atau tidak aktif.');
  end if;

  -- 3. Cek apakah sudah pernah menerima
  if exists (
    select 1 from public.penerimaan_mbg
    where distribusi_id = v_distribusi.id and siswa_id = p_siswa_id
  ) then
    declare
      v_existing record;
    begin
      select waktu_penerimaan into v_existing
      from public.penerimaan_mbg
      where distribusi_id = v_distribusi.id and siswa_id = p_siswa_id;
      
      return jsonb_build_object(
        'success', false, 
        'already_received', true,
        'message', 'Anda sudah tercatat menerima MBG.',
        'waktu_penerimaan', v_existing.waktu_penerimaan
      );
    end;
  end if;

  -- 4. Insert penerimaan
  insert into public.penerimaan_mbg (
    distribusi_id,
    siswa_id,
    nama_siswa,
    nisn,
    kelas,
    jurusan,
    status_penerimaan,
    waktu_penerimaan,
    sumber_pencatatan,
    petugas_id
  ) values (
    v_distribusi.id,
    v_siswa.id,
    v_siswa.nama,
    v_siswa.nisn,
    v_siswa.nama_kelas,
    v_siswa.jurusan,
    'diterima',
    v_waktu_sekarang,
    'siswa',
    null
  ) returning id into v_penerimaan_id;

  -- 5. Catat audit log
  insert into public.riwayat_aktivitas (
    aktivitas, tabel_terkait, data_id, data_sesudah
  ) values (
    'konfirmasi_mandiri_siswa', 'penerimaan_mbg', v_penerimaan_id,
    jsonb_build_object('siswa_id', v_siswa.id, 'nama', v_siswa.nama, 'waktu', v_waktu_sekarang)
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Penerimaan MBG berhasil dicatat.',
    'nama_siswa', v_siswa.nama,
    'kelas', v_siswa.nama_kelas,
    'waktu_penerimaan', v_waktu_sekarang
  );
end;
$$;

-- 4. Konfirmasi Massal oleh Guru
create or replace function public.konfirmasi_massal_kelas(
  p_distribusi_id uuid,
  p_siswa_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_siswa record;
  v_success_count int := 0;
  v_skip_count int := 0;
  v_now timestamptz := clock_timestamp();
begin
  for v_siswa in 
    select s.id, s.nama, s.nisn, k.nama_kelas, k.jurusan
    from public.siswa s
    join public.kelas k on s.kelas_id = k.id
    where s.id = any(p_siswa_ids) and s.status_aktif = true
  loop
    -- Check if already exists
    if exists (
      select 1 from public.penerimaan_mbg
      where distribusi_id = p_distribusi_id and siswa_id = v_siswa.id
    ) then
      v_skip_count := v_skip_count + 1;
    else
      insert into public.penerimaan_mbg (
        distribusi_id, siswa_id, nama_siswa, nisn, kelas, jurusan,
        status_penerimaan, waktu_penerimaan, sumber_pencatatan, petugas_id
      ) values (
        p_distribusi_id, v_siswa.id, v_siswa.nama, v_siswa.nisn, v_siswa.nama_kelas, v_siswa.jurusan,
        'diterima', v_now, 'guru', v_user_id
      );
      v_success_count := v_success_count + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'berhasil', v_success_count,
    'dilewati', v_skip_count
  );
end;
$$;

