-- ============================================================
-- FIX RLS POLICIES FOR NUTRI KAMPUS HUB / MBG TRACKER
-- Jalankan skrip ini di Supabase SQL Editor untuk memberikan
-- izin akses ke role 'anon' dan 'authenticated'.
-- ============================================================

-- 1. Berikan kelonggaran agar id_guru_piket boleh bernilai NULL & set default id_sekolah
alter table public.organoleptic_tests alter column id_guru_piket drop not null;
alter table public.organoleptic_tests alter column id_sekolah set default '11111111-1111-1111-1111-111111111111';
alter table public.pengguna alter column id_sekolah set default '11111111-1111-1111-1111-111111111111';
update public.pengguna set id_sekolah = '11111111-1111-1111-1111-111111111111' where id_sekolah is null;

-- 2. Kebijakan RLS untuk organoleptic_tests (Uji Organoleptik & Sesi Kedatangan MBG)
drop policy if exists "Guru manage organoleptic tests" on public.organoleptic_tests;
drop policy if exists "Read organoleptic tests" on public.organoleptic_tests;
drop policy if exists "Allow select organoleptic_tests" on public.organoleptic_tests;
drop policy if exists "Allow insert organoleptic_tests" on public.organoleptic_tests;
drop policy if exists "Allow update organoleptic_tests" on public.organoleptic_tests;

create policy "Allow select organoleptic_tests" on public.organoleptic_tests
  for select using (true);

create policy "Allow insert organoleptic_tests" on public.organoleptic_tests
  for insert with check (true);

create policy "Allow update organoleptic_tests" on public.organoleptic_tests
  for update using (true);

-- 3. Kebijakan RLS untuk daily_attendances (Rekapitulasi Kelas Harian)
drop policy if exists "Guru manage daily attendances" on public.daily_attendances;
drop policy if exists "Allow select daily_attendances" on public.daily_attendances;
drop policy if exists "Allow insert daily_attendances" on public.daily_attendances;
drop policy if exists "Allow update daily_attendances" on public.daily_attendances;

create policy "Allow select daily_attendances" on public.daily_attendances
  for select using (true);

create policy "Allow insert daily_attendances" on public.daily_attendances
  for insert with check (true);

create policy "Allow update daily_attendances" on public.daily_attendances
  for update using (true);

-- 4. Kebijakan RLS untuk student_mbg_logs (Log Penerimaan Siswa)
drop policy if exists "Guru manage student mbg logs" on public.student_mbg_logs;
drop policy if exists "Allow select student_mbg_logs" on public.student_mbg_logs;
drop policy if exists "Allow insert student_mbg_logs" on public.student_mbg_logs;
drop policy if exists "Allow update student_mbg_logs" on public.student_mbg_logs;

create policy "Allow select student_mbg_logs" on public.student_mbg_logs
  for select using (true);

create policy "Allow insert student_mbg_logs" on public.student_mbg_logs
  for insert with check (true);

create policy "Allow update student_mbg_logs" on public.student_mbg_logs
  for update using (true);

-- 5. Kebijakan RLS untuk classes & students (Agar terbaca oleh portal siswa)
drop policy if exists "Guru read school classes" on public.classes;
drop policy if exists "Allow select classes" on public.classes;
create policy "Allow select classes" on public.classes
  for select using (true);

drop policy if exists "Guru read school students" on public.students;
drop policy if exists "Allow select students" on public.students;
create policy "Allow select students" on public.students
  for select using (true);

-- 6. Kebijakan RLS untuk riwayat_aktivitas (Audit Log)
drop policy if exists "Staff read riwayat" on public.riwayat_aktivitas;
drop policy if exists "System insert riwayat" on public.riwayat_aktivitas;
drop policy if exists "Allow select riwayat" on public.riwayat_aktivitas;
drop policy if exists "Allow insert riwayat" on public.riwayat_aktivitas;

create policy "Allow select riwayat" on public.riwayat_aktivitas
  for select using (true);

create policy "Allow insert riwayat" on public.riwayat_aktivitas
  for insert with check (true);

-- 7. Kolom status_aktif & RLS untuk crm_campaigns (Tahap 3 RBAC Campaign Manager)
alter table public.crm_campaigns add column if not exists status_aktif boolean not null default true;

drop policy if exists "Super admin manage campaigns" on public.crm_campaigns;
drop policy if exists "Allow all crm_campaigns" on public.crm_campaigns;
create policy "Allow all crm_campaigns" on public.crm_campaigns
  for all using (true) with check (true);

drop policy if exists "Super admin manage students" on public.students;
drop policy if exists "Allow all students" on public.students;
create policy "Allow all students" on public.students
  for all using (true) with check (true);

-- 8. Buka Foreign Key & RLS untuk tabel public.pengguna + Seed 3 Akun Role Utama
alter table public.pengguna drop constraint if exists pengguna_id_fkey;
alter table public.organoleptic_tests drop constraint if exists organoleptic_tests_id_guru_piket_fkey;
alter table public.riwayat_aktivitas drop constraint if exists riwayat_aktivitas_pengguna_id_fkey;

drop policy if exists "User read own profile" on public.pengguna;
drop policy if exists "Super admin manage pengguna" on public.pengguna;
drop policy if exists "Allow all pengguna" on public.pengguna;

create policy "Allow all pengguna" on public.pengguna
  for all using (true) with check (true);

insert into public.pengguna (id, id_sekolah, nama, email, peran, status_aktif)
values
  ('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Super Administrator (Marcomm UBSI)', 'admin@mbg.sekolah.id', 'super_admin', true),
  ('00000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Budi Santoso (Guru Piket)', 'guru@mbg.sekolah.id', 'guru_piket', true),
  ('00000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Dr. Mochamad Wahyudi, M.M (Kepala Sekolah)', 'kepsek@mbg.sekolah.id', 'kepala_sekolah', true)
on conflict (id) do update set
  nama = excluded.nama,
  email = excluded.email,
  peran = excluded.peran,
  status_aktif = excluded.status_aktif,
  diperbarui_pada = now();
