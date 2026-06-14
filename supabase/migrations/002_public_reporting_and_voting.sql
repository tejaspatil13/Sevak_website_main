-- Enables the new public-web flows added to the SEVAK site:
--   - Anonymous citizens can submit a new issue from /report (no login yet)
--   - Anonymous citizens can upvote an issue from /feed, /map, /escalated, /issue/[id]
--   - Anonymous photo upload to the existing "issue-photos" storage bucket
--
-- This does NOT change the existing status/category model or add new columns/tables —
-- it only adds the policies + one RPC needed for the anon (public) key to write safely.
-- Run this once in the Supabase SQL editor for the project this site points at.

-- 1. Allow anonymous issue reports (citizen_id left null until phone-auth is added).
drop policy if exists "Anonymous citizens can create issues" on issues;
create policy "Anonymous citizens can create issues"
  on issues for insert
  to anon
  with check (citizen_id is null and status = 'pending');

-- 2. Vote counter RPC — runs as the table owner so anon can safely increment
--    upvotes by exactly 1 without being granted raw UPDATE access.
create or replace function increment_issue_upvote(p_issue_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  update issues
  set upvotes = upvotes + 1
  where id = p_issue_id
  returning upvotes into new_count;

  return new_count;
end;
$$;

grant execute on function increment_issue_upvote(uuid) to anon, authenticated;

-- 3. Storage: allow anonymous uploads of report photos into the public "issue-photos" bucket.
drop policy if exists "Anonymous uploads to issue-photos" on storage.objects;
create policy "Anonymous uploads to issue-photos"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'issue-photos');

-- 4. Fallback "Unassigned" ward so issue.ward_id (not null) has a valid value
--    when a citizen reports without GPS/ward detection. Harmless if wards is unused.
insert into wards (id, name, city, state)
values ('00000000-0000-0000-0000-000000000000', 'Unassigned', '-', '-')
on conflict (id) do nothing;
