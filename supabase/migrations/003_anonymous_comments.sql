-- Enables anonymous citizens to post comments on an issue from /issue/[id].
-- Run this once in the Supabase SQL editor for the project this site points at.

-- 1. citizen_id is optional for anonymous comments (no login yet).
alter table comments alter column citizen_id drop not null;

-- 2. Make sure RLS is on, then allow anyone to read comments and anonymous
--    citizens to post new ones (citizen_id left null until phone-auth is added).
alter table comments enable row level security;

drop policy if exists "Comments are public" on comments;
create policy "Comments are public"
  on comments for select
  using (true);

drop policy if exists "Anonymous citizens can post comments" on comments;
create policy "Anonymous citizens can post comments"
  on comments for insert
  to anon
  with check (citizen_id is null);
