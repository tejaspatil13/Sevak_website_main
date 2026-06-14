import { supabase } from './supabase';
import { Issue, IssueCategory, IssueStatus, IssueUpdate, Sevak, Comment } from '@/types';
import { wardLabel } from './format';

// Nashik Municipal Corporation has 31 wards — not stored in the (currently empty) wards table.
export const NMC_WARD_COUNT = 31;

export type MapIssue = Pick<
  Issue,
  'id' | 'title' | 'category' | 'status' | 'upvotes' | 'latitude' | 'longitude' | 'location_address' | 'ward_id'
>;

export async function getStats() {
  const [{ count: totalIssues }, { count: resolvedIssues }, { count: escalatedIssues }, { count: activeSevaks }] =
    await Promise.all([
      supabase.from('issues').select('*', { count: 'exact', head: true }),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      supabase.from('issues').select('*', { count: 'exact', head: true }).eq('status', 'escalated'),
      supabase.from('sevaks').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]);

  return {
    totalIssues: totalIssues ?? 0,
    resolvedIssues: resolvedIssues ?? 0,
    escalatedIssues: escalatedIssues ?? 0,
    activeSevaks: activeSevaks ?? 0,
    wards: NMC_WARD_COUNT,
  };
}

export async function getRecentIssues(limit = 6): Promise<Issue[]> {
  const { data } = await supabase
    .from('issues')
    .select('*, citizen:citizens(name), sevak:sevaks(id, name, photo_url)')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data as Issue[]) ?? [];
}

export async function getIssues({
  status,
  category,
  limit = 30,
}: {
  status?: IssueStatus;
  category?: IssueCategory;
  limit?: number;
}): Promise<Issue[]> {
  let query = supabase
    .from('issues')
    .select('*, citizen:citizens(name), sevak:sevaks(id, name, photo_url)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);

  const { data } = await query;
  return (data as Issue[]) ?? [];
}

export async function getIssue(id: string): Promise<Issue | null> {
  const { data } = await supabase
    .from('issues')
    .select('*, citizen:citizens(name), sevak:sevaks(id, name, photo_url)')
    .eq('id', id)
    .maybeSingle();

  return data as Issue | null;
}

export async function getIssueUpdates(issueId: string): Promise<IssueUpdate[]> {
  const { data } = await supabase
    .from('issue_updates')
    .select('*')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });

  return (data as IssueUpdate[]) ?? [];
}

export async function getIssueComments(issueId: string): Promise<Comment[]> {
  const { data } = await supabase
    .from('comments')
    .select('*, citizen:citizens(name)')
    .eq('issue_id', issueId)
    .order('created_at', { ascending: true });

  return (data as Comment[]) ?? [];
}

export async function getSevaks(): Promise<Sevak[]> {
  const { data } = await supabase
    .from('sevaks')
    .select('*')
    .eq('is_active', true)
    .order('total_resolved', { ascending: false });

  return (data as Sevak[]) ?? [];
}

export async function getSevak(id: string): Promise<Sevak | null> {
  const { data } = await supabase
    .from('sevaks')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return data as Sevak | null;
}

export async function getSevakIssues(sevakId: string): Promise<Issue[]> {
  const { data } = await supabase
    .from('issues')
    .select('*, citizen:citizens(name), sevak:sevaks(id, name, photo_url)')
    .eq('sevak_id', sevakId)
    .order('created_at', { ascending: false });

  return (data as Issue[]) ?? [];
}

/** All issues with coordinates, for the /map view. */
export async function getMapIssues(limit = 500): Promise<MapIssue[]> {
  const { data } = await supabase
    .from('issues')
    .select('id, title, category, status, upvotes, latitude, longitude, location_address, ward_id')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data as MapIssue[]) ?? [];
}

/** Issues that have crossed the 50-vote threshold and are awaiting corporator follow-up. */
export async function getEscalatedIssues(limit = 60): Promise<Issue[]> {
  const { data } = await supabase
    .from('issues')
    .select('*, citizen:citizens(name), sevak:sevaks(id, name, photo_url)')
    .eq('status', 'escalated')
    .order('upvotes', { ascending: false })
    .limit(limit);

  return (data as Issue[]) ?? [];
}

/** Open issues near a point + category, used to surface duplicates while reporting. */
export async function findNearbyIssues({
  latitude,
  longitude,
  category,
  radiusDeg = 0.0015, // roughly ~150m
  limit = 5,
}: {
  latitude: number;
  longitude: number;
  category: IssueCategory;
  radiusDeg?: number;
  limit?: number;
}): Promise<Issue[]> {
  const { data } = await supabase
    .from('issues')
    .select('*, citizen:citizens(name), sevak:sevaks(id, name, photo_url)')
    .eq('category', category)
    .not('status', 'in', '("resolved","rejected")')
    .gte('latitude', latitude - radiusDeg)
    .lte('latitude', latitude + radiusDeg)
    .gte('longitude', longitude - radiusDeg)
    .lte('longitude', longitude + radiusDeg)
    .order('upvotes', { ascending: false })
    .limit(limit);

  return (data as Issue[]) ?? [];
}

export interface WardAnalytics {
  ward: string;
  total: number;
  pending: number;
  escalated: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

export interface IssueAnalytics {
  total: number;
  pending: number;
  escalated: number;
  accepted: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  wards: WardAnalytics[];
}

/** Status + ward-wise breakdown shown below the escalated issues list. */
export async function getIssueAnalytics(): Promise<IssueAnalytics> {
  const { data } = await supabase.from('issues').select('ward_id, status');
  const rows = (data as { ward_id: string | null; status: IssueStatus }[]) ?? [];

  const analytics: IssueAnalytics = {
    total: rows.length,
    pending: 0,
    escalated: 0,
    accepted: 0,
    inProgress: 0,
    resolved: 0,
    rejected: 0,
    wards: [],
  };

  const wardMap = new Map<string, WardAnalytics>();

  for (const row of rows) {
    switch (row.status) {
      case 'pending':
        analytics.pending += 1;
        break;
      case 'escalated':
        analytics.escalated += 1;
        break;
      case 'accepted':
        analytics.accepted += 1;
        break;
      case 'in_progress':
        analytics.inProgress += 1;
        break;
      case 'resolved':
        analytics.resolved += 1;
        break;
      case 'rejected':
        analytics.rejected += 1;
        break;
    }

    const ward = wardLabel(row.ward_id) ?? 'Unassigned';
    const entry =
      wardMap.get(ward) ?? { ward, total: 0, pending: 0, escalated: 0, inProgress: 0, resolved: 0, rejected: 0 };
    entry.total += 1;
    if (row.status === 'pending') entry.pending += 1;
    if (row.status === 'escalated') entry.escalated += 1;
    if (row.status === 'accepted' || row.status === 'in_progress') entry.inProgress += 1;
    if (row.status === 'resolved') entry.resolved += 1;
    if (row.status === 'rejected') entry.rejected += 1;
    wardMap.set(ward, entry);
  }

  analytics.wards = [...wardMap.values()].sort((a, b) => b.total - a.total);

  return analytics;
}
