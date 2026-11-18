-- Migration: Dukungan import data Dapodik (SMKN 5 Surakarta)
-- 1) Jurusan kelas SMK (TKP, TITL, DPIB, dst.) tidak lagi dibatasi enum SMA
-- 2) No. HP siswa boleh kosong (siswa tetap bisa menerima MBG lewat klaim perwakilan kelas)
-- 3) Data pribadi (NIK, alamat, orang tua) disimpan di tabel TERPISAH tanpa akses publik
-- 4) Sekolah SMKN 5 Surakarta (NPSN 20328109)

begin;

-- 1. Jurusan bebas (SMK punya banyak kompetensi keahlian)
alter table public.classes drop constraint if exists classes_jurusan_check;

-- 2. No. HP opsional
alter table public.students alter column no_hp drop not null;

-- 3. Tabel data pribadi siswa
create table if not exists public.student_private (
  nisn varchar(10) primary key references public.students(nisn) on delete cascade,
  nipd varchar(20),
  nik varchar(20),
  jenis_kelamin varchar(15),
  tempat_lahir varchar(100),
  tanggal_lahir date,
  agama varchar(30),
  alamat text,
  rt varchar(10),
  rw varchar(10),
  desa_kelurahan varchar(150),
  kode_pos varchar(10),
  nama_ayah varchar(255),
  nama_ibu varchar(255),
  dibuat_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now()
);

alter table public.student_private enable row level security;

-- Tidak ada policy untuk anon: data pribadi TIDAK bisa dibaca publik / aplikasi siswa.
revoke all on public.student_private from anon;

drop policy if exists "Staff manage student private" on public.student_private;
create policy "Staff manage student private" on public.student_private
  for all to authenticated
  using (
    exists (
      select 1
      from public.students s
      join public.classes c on c.id = s.id_kelas
      join public.pengguna p on p.id = auth.uid()
      where s.nisn = public.student_private.nisn
        and (p.peran = 'super_admin' or p.id_sekolah = c.id_sekolah)
    )
  )
  with check (
    exists (
      select 1
      from public.students s
      join public.classes c on c.id = s.id_kelas
      join public.pengguna p on p.id = auth.uid()
      where s.nisn = public.student_private.nisn
        and (p.peran = 'super_admin' or p.id_sekolah = c.id_sekolah)
    )
  );

-- 4. Sekolah SMKN 5 Surakarta
insert into public.schools (id, npsn, nama_sekolah, nama_sppg_mitra)
values (
  '88888888-8888-4888-8888-888888888881',
  '20328109',
  'SMKN 5 Surakarta',
  'SPPG Mitra Bergizi'
)
on conflict (npsn) do update
  set nama_sekolah = excluded.nama_sekolah,
      diperbarui_pada = now();

commit;
