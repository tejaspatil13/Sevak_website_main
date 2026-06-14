'use client';

// v2: bumped so issues that got stuck as "voted" by the pre-fix bug (which marked
// an issue as voted even when the upvote RPC failed) become votable again.
const VOTED_KEY = 'sevak_voted_issues_v2';

function readVotedIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(VOTED_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function hasVoted(issueId: string): boolean {
  return readVotedIds().includes(issueId);
}

export function markVoted(issueId: string) {
  if (typeof window === 'undefined') return;
  const ids = readVotedIds();
  if (!ids.includes(issueId)) {
    window.localStorage.setItem(VOTED_KEY, JSON.stringify([...ids, issueId]));
  }
}
