-- Cached comment_count on issues, kept in sync via triggers, so the feed and
-- issue cards can show comment counts without an extra query per issue.

alter table issues add column if not exists comment_count integer not null default 0;

update issues set comment_count = (
  select count(*) from comments where comments.issue_id = issues.id
);

create or replace function increment_issue_comment_count() returns trigger as $$
begin
  update issues set comment_count = comment_count + 1 where id = new.issue_id;
  return new;
end;
$$ language plpgsql security definer;

create or replace function decrement_issue_comment_count() returns trigger as $$
begin
  update issues set comment_count = greatest(comment_count - 1, 0) where id = old.issue_id;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists comments_increment_issue_comment_count on comments;
create trigger comments_increment_issue_comment_count
  after insert on comments
  for each row execute function increment_issue_comment_count();

drop trigger if exists comments_decrement_issue_comment_count on comments;
create trigger comments_decrement_issue_comment_count
  after delete on comments
  for each row execute function decrement_issue_comment_count();
