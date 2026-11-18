-- Migration: Fix infinite recursion (42P17) in RLS policy for `public.pengguna`
-- Jalankan SQL ini di Supabase Dashboard -> SQL Editor.

begin;

-- 1. Helper SECURITY DEFINER agar pengecekan peran tidak memicu RLS rekursif di `pengguna`
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(auth.jwt() ->> 'peran', '') = 'super_admin'
    or exists (
      select 1
      from public.pengguna p
      where p.id = auth.uid()
        and p.peran = 'super_admin'
        and p.status_aktif = true
    );
$$;

create or replace function public.get_my_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() ->> 'id_sekolah', '')::uuid,
    (select p.id_sekolah from public.pengguna p where p.id = auth.uid() limit 1)
  );
$$;

grant execute on function public.is_super_admin() to authenticated, anon;
grant execute on function public.get_my_school_id() to authenticated, anon;

-- 2. Perbaiki policy `public.pengguna` agar tidak query ke dirinya sendiri secara langsung
drop policy if exists "User read own profile" on public.pengguna;
create policy "User read own profile"
  on public.pengguna
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "Super admin manage pengguna" on public.pengguna;
create policy "Super admin manage pengguna"
  on public.pengguna
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- 3. Perbaiki policy `public.schools` agar memakai helper `is_super_admin()`
drop policy if exists "Admin manage schools" on public.schools;
create policy "Admin manage schools"
  on public.schools
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

commit;
