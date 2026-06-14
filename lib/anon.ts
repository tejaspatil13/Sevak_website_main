// Generates a fixed, friendly "demo" identity for anonymous citizens (no login required).
// Persisted in localStorage so the same device always shows the same name.

const STORAGE_KEY = 'sevak_anon_identity';

// Two distinct adjectives are combined with "Cockroach" — 33 * 32 = 1056 possible names.
const ADJECTIVES = [
  'Lazy', 'Unemployed', 'Jobless', 'Idle', 'Useless', 'Worthless', 'Freeloading',
  'Good-for-Nothing', 'Habitual', 'Professional', 'Activist', 'Chronic', 'Permanent',
  'Full-Time', 'Part-Time', 'Certified', 'Official', 'Senior', 'Junior', 'Retired',
  'Aspiring', 'World-Class', 'Award-Winning', 'Self-Proclaimed', 'Card-Carrying',
  'Couch', 'Sofa', 'Armchair', 'Keyboard', 'Weekend', 'Holiday', 'Tea-Break', 'Sleepy',
];
const NOUN = 'Cockroach';

function generateName(): string {
  const i = Math.floor(Math.random() * ADJECTIVES.length);
  let j = Math.floor(Math.random() * (ADJECTIVES.length - 1));
  if (j >= i) j += 1;
  return `${ADJECTIVES[i]} ${ADJECTIVES[j]} ${NOUN}`;
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
