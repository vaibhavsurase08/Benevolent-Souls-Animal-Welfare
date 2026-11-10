-- Benevolent Souls Foundation — Team Members migration
-- Run this SQL in the Supabase SQL Editor (https://app.supabase.com/project/_/sql)
--
-- This creates:
--   1. A `team_members` table to persist team member records.
--   2. RLS policies for public read and authenticated write.
--   3. Seed rows for the five existing team members (idempotent).
--   4. Storage policies for the `team-images` bucket.
--
-- After running this SQL, you MUST also create the `team-images` bucket in the
-- Supabase Dashboard (Storage → Buckets → New bucket) and set it to Public.
-- See Section 6 below for details.

-- ============================================================
-- 1. Create the team_members table
-- ============================================================

create table if not exists public.team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  responsibility text,
  image_url text,
  created_at timestamptz default now()
);

-- Add a unique constraint on name so the seed statement's ON CONFLICT (name)
-- works reliably. This block is safe to rerun.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'team_members_name_unique'
      and conrelid = 'public.team_members'::regclass
  ) then
    alter table public.team_members
      add constraint team_members_name_unique unique (name);
  end if;
end $$;

-- ============================================================
-- 2. Enable Row Level Security (RLS)
-- ============================================================

-- RLS is enabled but NOT disabled. All access is governed by the policies below.
alter table public.team_members enable row level security;

-- ============================================================
-- 3. RLS policies (idempotent)
-- ============================================================

-- Public read access — needed so the public homepage can load team members.
drop policy if exists "Team members are publicly readable" on public.team_members;
create policy "Team members are publicly readable"
  on public.team_members
  for select
  using (true);

-- Authenticated write access — INSERT, UPDATE, DELETE.
--
-- AUTHENTICATION MODEL (matches existing project):
-- The existing project authenticates administrators solely via
-- supabase.auth.getSession(). Any user with a valid Supabase Auth session
-- (auth.role() = 'authenticated') is treated as an admin and can write to
-- admin tables (animals, donations, media, messages, etc.). This policy matches
-- that existing pattern.
--
-- SECURITY NOTE: This means ANY authenticated user can edit team members, not
-- just designated administrators. The project currently has no admin role/flag
-- system (no profiles table, no is_admin column). To harden this, add a proper
-- admin role check (e.g. via a profiles table) before granting write access to
-- all authenticated users. Do NOT expose the service-role key in client code.
drop policy if exists "Authenticated users can manage team members" on public.team_members;
create policy "Authenticated users can manage team members"
  on public.team_members
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 4. Seed the five existing team members (idempotent)
-- ============================================================

-- ON CONFLICT (name) requires the unique constraint created in Section 1.
-- Rerunning this will not create duplicate records.
insert into public.team_members (name, role, responsibility, image_url) values
  ('Chaitanya Kulkarni', 'Director', null, '/image/ngo/team/chaitanya-kulkarni.jpeg'),
  ('Padmini Khandekar', 'Core Team Member', null, '/image/ngo/team/padmini-khandekar.jpeg'),
  ('Rushabh Jangade', 'Director', null, '/image/ngo/team/rushabh-jangade.jpeg'),
  ('Sudhir Talwalkar', 'Core Team Member', 'Finance & Accounting', '/image/ngo/team/sudhir-talwalkar.jpeg'),
  ('Preeti Bawase', 'Core Team Member', 'Social Media & Fundraising Programs', '/image/ngo/team/preeti-bawase.jpeg')
on conflict (name) do nothing;

-- ============================================================
-- 5. Storage policies for the team-images bucket
-- ============================================================

-- The admin team page uploads profile photos via
--   supabase.storage.from("team-images").upload(...)
-- and the public site displays them via getPublicUrl().
-- These policies are required for those operations to work.

-- Public read access to team images (so the public website can display photos).
drop policy if exists "Public can view team images" on storage.objects;
create policy "Public can view team images"
  on storage.objects
  for select
  using (bucket_id = 'team-images');

-- Authenticated upload access to team images (so admins can upload photos).
drop policy if exists "Authenticated users can upload team images" on storage.objects;
create policy "Authenticated users can upload team images"
  on storage.objects
  for insert
  with check (bucket_id = 'team-images' and auth.role() = 'authenticated');

-- ============================================================
-- 6. Manual steps required in Supabase Dashboard
-- ============================================================
--
-- AFTER running this SQL, perform the following steps in the Supabase Dashboard:
--
-- A. Create the storage bucket (Storage → Buckets → New bucket):
--    - Name: team-images
--    - Public bucket: Yes (required so getPublicUrl() works for the public site)
--    - File size limit: 5242880 (5 MB)
--    - Allowed MIME types: image/jpeg, image/png, image/webp
--
--    Note: Creating a bucket via SQL requires the Supabase storage extension and
--    may not be available on all projects. The Dashboard UI is the recommended method.
--
-- B. Verify RLS is enabled on public.team_members:
--    - Table Editor → team_members → RLS → should show "Enabled"
--
-- C. Verify the five team members were seeded:
--    - Table Editor → team_members → should show 5 rows with the names above.
--
-- D. Do NOT expose the Supabase service-role key in browser code. All client-side
--    reads and writes use the public anon key (NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
--    with the RLS policies above.
