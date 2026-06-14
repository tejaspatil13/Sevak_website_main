-- Single-tier escalation: an issue auto-escalates (status 'pending' -> 'escalated')
-- once its upvotes cross ESCALATION_THRESHOLD (50). From there, the developer portal
-- (/admin/issue/[id]) is used to move it to 'accepted' after corporators are contacted,
-- then 'in_progress' -> 'resolved'.

-- 1. Extend the vote RPC to auto-escalate on crossing the threshold.
create or replace function increment_issue_upvote(p_issue_id uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
  cur_status text;
begin
  update issues
  set upvotes = upvotes + 1
  where id = p_issue_id
  returning upvotes, status into new_count, cur_status;

  if cur_status = 'pending' and new_count >= 50 then
    update issues set status = 'escalated' where id = p_issue_id;
  end if;

  return new_count;
end;
$$;

grant execute on function increment_issue_upvote(uuid) to anon, authenticated;

-- 2. Backfill: any existing pending issue that already crossed 50 votes (e.g. the
--    demo issue from migration 006) should be escalated immediately.
update issues set status = 'escalated' where status = 'pending' and upvotes >= 50;
