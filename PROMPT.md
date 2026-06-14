# Prompt: Build the "SEVAK" public web dashboard

Paste everything below into an AI website builder (v0.dev, Lovable, bolt.new, Claude, etc.) to
regenerate this site from scratch, or to extend it.

---

## Project brief

Build **SEVAK**, a public, read-only web dashboard for a civic issue-tracking platform
("transparent governance" — citizens report problems like potholes/garbage/streetlights/water
issues via a mobile app; elected "Nagar Sevaks" accept and resolve them; everything is publicly
trackable).

This website is the **public window** into that system — no login. It showcases:
1. A landing page with live stats and a hero pitch
2. A live, filterable feed of all reported issues
3. An issue detail page with a status timeline, location, assigned sevak, and comments
4. A leaderboard of Sevaks (representatives) ranked by issues resolved
5. A public profile page per Sevak with their stats and a photo grid of handled issues

## Tech stack

- **Next.js 14** App Router + TypeScript
- **Tailwind CSS**
- **Supabase** (Postgres) as the backend — **read-only**, using the anon/publishable key only
  (never expose the service role key in a public web app)
- **lucide-react** for icons
- Server Components for data fetching (no client-side fetching needed — it's read-only)

## Design tokens (civic saffron/navy theme)

```
Navy    #003580   → headers, hero sections, primary brand color
Sky     #0EA5E9   → primary CTA buttons, links, accents
Saffron #F97316   → secondary accent (Sevak / "for officials" sections)
BG      #F5F7FA   → page background
Card    #FFFFFF   → card surfaces
Ink     #1A1A2E   → primary text
Muted   #6B7280   → secondary text
Border  #E5E7EB   → dividers, card borders
```

### Status colors

```
pending      dot #F59E0B   badge bg #EFF6FF text #1D4ED8  label "Pending"/"Open"
accepted     dot #3B82F6   badge bg #EFF6FF text #1D4ED8  label "Accepted"
in_progress  dot #8B5CF6   badge bg #FFFBEB text #92400E  label "In Progress"
resolved     dot #10B981   badge bg #ECFDF5 text #065F46  label "Resolved"
rejected     dot #EF4444   badge bg #FEF2F2 text #991B1B  label "Rejected"
```

### Category colors & icons

```
pothole (Road)        icon Construction   color #D97706  bg #FEF3C7
garbage (Waste)       icon Trash2         color #059669  bg #D1FAE5
streetlight           icon Lightbulb      color #7C3AED  bg #EDE9FE
water                 icon Droplet        color #0EA5E9  bg #E0F2FE
other                 icon MoreHorizontal color #6B7280  bg #F3F4F6
```

### Party accent colors (for Sevak cards)

```
Shiv Sena / Shiv Sena (UBT)  #F97316
BJP                            #EF4444
Congress                       #3B82F6
NCP                             #1976D2
Independent                    #6B7280
```

## Data model (Supabase tables)

```sql
-- sevaks: elected representatives
sevaks (
  id uuid, user_id uuid, name text, photo_url text,
  ward_id uuid, ward_numbers int[], role text ('mla' | 'nagarsevak'),
  party text, phone text, is_active bool, subscription_end date,
  total_resolved int, avg_rating numeric, created_at timestamptz
)

-- citizens
citizens (id uuid, user_id uuid, name text, phone text, ward_id uuid, created_at timestamptz)

-- issues: the core entity
issues (
  id uuid, citizen_id uuid, ward_id uuid, sevak_id uuid (nullable),
  title text, description text,
  category text ('pothole'|'garbage'|'streetlight'|'water'|'other'),
  status text ('pending'|'accepted'|'in_progress'|'resolved'|'rejected'),
  before_photo_url text, after_photo_url text (nullable),
  latitude numeric, longitude numeric, location_address text,
  upvotes int, created_at, accepted_at, resolved_at timestamptz
)

-- issue_updates: timeline / work-diary entries
issue_updates (
  id uuid, issue_id uuid, updated_by uuid, status text,
  note text  -- format: "**Heading**\nDetail" or plain text
  photo_url text, created_at timestamptz
)

-- comments: citizen comments on an issue
comments (id uuid, issue_id uuid, citizen_id uuid, text text, created_at timestamptz)
```

> **IMPORTANT quirk:** the `wards` table is empty / unused. Ward numbers are encoded directly in
> the last segment of the `ward_id` UUID, e.g. `00000000-0000-0000-0000-000000000031` = **Ward 31**.
> Derive the ward label from `ward_id` with a regex (`/(\d+)$/`) — do not join to `wards`.

## Pages

### `/` — Landing page
- Navy hero: headline, tagline "Transparent Governance Platform", two CTAs (View Live Feed,
  Browse Sevaks)
- Live stat tiles: total issues reported, resolved count, active sevaks, ward count (31, static —
  NMC has 31 wards)
- "How it works" 3-step section: Report → Track → Resolve & Rate
- Category showcase tiles (Roads, Garbage, Streetlights, Water)
- "Recently reported" — 3 latest issues as cards
- "For Nagar Sevaks" pricing section (saffron accent on navy bg): ₹299/month or ₹2,499/year,
  feature list (verified badge, analytics, ratings)
- Footer with nav links

### `/feed` — Live issue feed
- Navy header band: "Live Issue Feed"
- Two rows of filter pills driven by URL search params (`?status=` and `?category=`):
  status: All / Pending / Accepted / In Progress / Resolved
  category: All / Road / Waste / Streetlight / Water / Other
- Issue count text
- Responsive grid of `IssueCard`s (1/2/3 columns)
- Empty state: icon box + "No complaints found" / "Try a different filter"

**IssueCard**: avatar (initials, colored by name hash) + reporter name + "Ward N · Xh ago" +
status badge (top); 16:9 photo; title (2-line clamp); category chip; if a sevak is
assigned and status is accepted/in_progress/resolved, a left-bordered strip showing
"{sevak name} handling this"; footer row with upvote count.

### `/issue/[id]` — Issue detail
- Full-width hero photo (240–360px) with dark gradient overlay and a status pill (dot + label)
  top-right
- Category chip, title, description
- Location card: address text, "Ward N" chip, "View on Map" / "Get Directions" buttons
  (Google Maps links built from lat/lng)
- Upvote count pill
- "Progress" card containing a **StatusTimeline**: 4 steps (Pending → Accepted → In Progress →
  Resolved) as a vertical dot-and-line timeline; each step shows its `issue_updates` entries
  (parsed as `**Heading**\nDetail`), date, and note text
- If `rejected`, append a 5th red step
- Assigned Sevak card (if any): photo/initials, name, "Actively Working" indicator, links to
  their public profile
- After photo (if resolved)
- Comments section: header with count badge, list of comments (avatar + name + timeago + text),
  empty state "No comments yet. Be the first!"

### `/sevaks` — Leaderboard
- Navy header band: "Sevaks"
- Role filter pills: All / MLA / Nagarsevak
- Count text "N active Sevaks"
- List of **SevakCard**s sorted by `total_resolved` desc
- Empty state: "No active Sevaks found"

**SevakCard**: top accent bar colored by party; photo or initials avatar (ring colored by
party); name; role subtitle ("MLA · Maharashtra Vidhan Sabha" or "Corporator · NMC"); badge row
(MLA star badge, party badge, ward badge, Active badge); stats row with two cells — Resolved
count (green) and Ward/Constituency (sky blue)

### `/sevaks/[id]` — Public Sevak profile
- Navy hero with thin party-accent top bar: photo/initials, name, role subtitle, badges (party,
  Active, avg rating with star)
- 4 stat tiles: Resolved, In Progress, Open (accepted), Total Handled
- Ward chip
- 3-column photo grid of all issues handled (`sevak_id` match): each cell shows the before
  photo, a small status-colored dot top-left, and — if resolved with an after photo — a small
  "after" thumbnail overlay bottom-right with a green border
- Empty state: "No issues handled yet"

## Helper functions to implement

```ts
// avatar color from name hash (6-color palette: sky, navy, green, purple, orange, red)
function avatarColor(str: string): string
// initials from name, max 2 chars
function initials(name: string | null): string
// "Xm ago" / "Xh ago" / "Xd ago" / "Xw ago" / "just now"
function timeAgo(dateStr: string): string
// parse "**Heading**\nDetail" -> { heading, detail }
function parseNote(note: string | null): { heading: string | null; detail: string }
// derive "Ward N" from ward_id UUID's trailing digits
function wardLabel(wardId: string | null): string | null
```

## Notes

- All photos come from Supabase Storage public URLs — use `next/image` with `unoptimized` (or
  configure `images.remotePatterns` for `**.supabase.co`)
- Use Server Components + `revalidate` (30–60s) for fresh-but-cached data; no client-side state
  needed since there's no auth or mutation
- Keep it read-only — citizens report and Sevaks manage issues only via the mobile app; this
  site is the public transparency layer
