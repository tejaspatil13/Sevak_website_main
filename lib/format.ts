const AVATAR_COLORS = ['#0EA5E9', '#003580', '#059669', '#7C3AED', '#F97316', '#EF4444'];

export function avatarColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** ward_id UUIDs encode the ward number in the last segment, e.g. ...000000000031 = Ward 31 */
export function wardNumber(wardId: string | null | undefined): number | null {
  if (!wardId) return null;
  const match = wardId.match(/(\d+)$/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  return n > 0 ? n : null;
}

export function wardLabel(wardId: string | null | undefined): string | null {
  const n = wardNumber(wardId);
  return n ? `Ward ${n}` : null;
}

/** "**Heading**\nDetail" -> { heading, detail } */
export function parseNote(note: string | null): { heading: string | null; detail: string } {
  if (!note) return { heading: null, detail: '' };
  const match = note.match(/^\*\*(.+?)\*\*\n?([\s\S]*)$/);
  if (match) return { heading: match[1], detail: match[2] };
  return { heading: null, detail: note };
}
