-- Migration 002 used "create policy if not exists", which is invalid Postgres syntax
-- (ERROR: 42601). The Supabase SQL editor runs a script as one transaction, so that
-- error rolled back the ENTIRE 002 script — meaning the increment_issue_upvote RPC,
-- the anon report/upload policies, and the "Unassigned" ward were never created.
-- This is why voting and reporting don't persist. This migration re-creates all of
-- that (idempotently, with correct syntax), plus the new admin "developer portal"
-- update/resolve policies. Safe to run even if 002 partially succeeded.

-- 1. Anonymous issue reports (citizen_id left null until phone-auth is added).
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

-- 3. Storage: allow anonymous uploads of report/update photos into "issue-photos".
drop policy if exists "Anonymous uploads to issue-photos" on storage.objects;
create policy "Anonymous uploads to issue-photos"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'issue-photos');

-- 4. Fallback "Unassigned" ward so issue.ward_id (not null) has a valid value
--    when a citizen reports without GPS/ward detection.
insert into wards (id, name, city, state)
values ('00000000-0000-0000-0000-000000000000', 'Unassigned', '-', '-')
on conflict (id) do nothing;

-- 5. Developer portal (/admin/issue/[id]): post progress updates and resolve issues.
--    No sevak auth exists yet, so updated_by stays null on these rows.
drop policy if exists "Anonymous can post issue updates" on issue_updates;
create policy "Anonymous can post issue updates"
  on issue_updates for insert
  to anon
  with check (updated_by is null);

--    Anonymous can update an issue's status/timestamps/after-photo from the admin
--    portal. The anon key is the only key available (no service role key), so this
--    is gated only by the /admin password in the UI — same caveat as migration 004's
--    anon delete policies.
drop policy if exists "Anonymous can update issue status" on issues;
create policy "Anonymous can update issue status"
  on issues for update
  to anon
  using (true)
  with check (true);
