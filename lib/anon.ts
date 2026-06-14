// Generates a fixed, friendly "demo" identity for anonymous citizens (no login required).
// Persisted in localStorage so the same device always shows the same name.

const STORAGE_KEY = 'sevak_anon_identity';

const ADJECTIVES = ['Quiet', 'Brave', 'Curious', 'Swift', 'Calm', 'Bold', 'Cheerful', 'Gentle', 'Lively', 'Wise'];
const NOUNS = ['Tiger', 'Sparrow', 'Falcon', 'Otter', 'Panther', 'Eagle', 'Dolphin', 'Fox', 'Heron', 'Lynx'];

function generateName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adjective} ${noun} ${num}`;
}

export function getAnonIdentity(): { name: string } {
  if (typeof window === 'undefined') return { name: generateName() };

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore — fall through and generate a fresh identity
  }

  const identity = { name: generateName() };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // best-effort persistence
  }
  return identity;
}
