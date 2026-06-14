-- 1. Threaded comment replies: a comment can reply to another comment on the
--    same issue. NULL parent_id = top-level comment.
alter table comments add column if not exists parent_id uuid references comments(id) on delete cascade;

-- 2. Demo issues seeding the three community-escalation tiers (Trending 10-24,
--    Community Priority 25-49, Escalated 50+) so the /escalated page has content
--    to show. status stays 'pending' so they remain in the open-issue queries.
insert into issues (
  citizen_id, reporter_name, ward_id, title, description, category, status,
  before_photo_url, latitude, longitude, location_address, upvotes
) values
  (
    null, 'Curious Falcon 3920', '00000000-0000-0000-0000-000000000012',
    'Large pothole near Dwarka Signal causing accidents',
    'Deep pothole has formed on the main road right after the signal, two-wheelers keep skidding here especially at night.',
    'pothole', 'pending',
    'https://picsum.photos/seed/sevak-demo-pothole/800/450',
    19.993368, 73.768070, 'Dwarka Signal, Ward 12, Nashik', 15
  ),
  (
    null, 'Bold Heron 7142', '00000000-0000-0000-0000-000000000020',
    'Garbage piling up near New Nashik market',
    'Garbage has not been collected for over a week near the market entrance, causing a bad smell and attracting stray animals.',
    'garbage', 'pending',
    'https://picsum.photos/seed/sevak-demo-garbage/800/450',
    19.961089, 73.832852, 'New Nashik Market, Ward 20, Nashik', 32
  ),
  (
    null, 'Wise Otter 5063', '00000000-0000-0000-0000-000000000005',
    'Streetlights not working on Gangapur Road stretch',
    'An entire stretch of streetlights along Gangapur Road has been non-functional for over a month, making it unsafe to walk at night.',
    'streetlight', 'pending',
    'https://picsum.photos/seed/sevak-demo-streetlight/800/450',
    20.013448, 73.792792, 'Gangapur Road, Ward 5, Nashik', 55
  );
