// Lightweight password gate for the /login + /admin moderation portal.
// Only the anon key is available (no service role key / server auth), so this
// just guards the UI — see supabase/migrations/004_anon_identity_and_admin.sql
// for the matching anon delete policies.
export const ADMIN_PASSWORD = 'Patil@8629';
export const ADMIN_AUTH_KEY = 'sevak_admin_auth';
