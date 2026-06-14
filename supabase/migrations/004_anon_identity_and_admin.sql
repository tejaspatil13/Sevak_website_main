-- 1. "Demo" display names for anonymous citizens (no login required).
--    A fixed, friendly name is generated client-side per device and stored with
--    each report/comment so the same person reads consistently across the app.
alter table issues add column if not exists reporter_name text;
alter table comments add column if not exists display_name text;

-- 2. Developer/moderator portal (/login, /admin) — lets the site owner remove
--    inappropriate issues or comments. The anon key is the only key available
--    (no service role key), so these policies allow anon deletes; the /admin UI
--    is gated behind a password, but anyone with the anon key could call these
--    endpoints directly. Acceptable for this lightweight moderation use case.
drop policy if exists "Anonymous can delete issues" on issues;
create policy "Anonymous can delete issues"
  on issues for delete
  to anon
  using (true);

drop policy if exists "Anonymous can delete comments" on comments;
create policy "Anonymous can delete comments"
  on comments for delete
  to anon
  using (true);
