export type IssueStatus = 'pending' | 'escalated' | 'accepted' | 'in_progress' | 'resolved' | 'rejected';
export type IssueCategory = 'pothole' | 'garbage' | 'streetlight' | 'water' | 'drainage' | 'encroachment' | 'other';

/** Issues auto-escalate (status -> 'escalated') once they cross this many upvotes. */
export const ESCALATION_THRESHOLD = 50;

export interface Sevak {
  id: string;
  user_id: string;
  name: string;
  photo_url: string | null;
  ward_id: string;
  party: string | null;
  phone: string | null;
  is_active: boolean;
  subscription_end: string | null;
  total_resolved: number;
  avg_rating: number;
  created_at: string;
}

export interface Citizen {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  ward_id: string | null;
  created_at: string;
}

export interface Issue {
  id: string;
  citizen_id: string;
  ward_id: string;
  sevak_id: string | null;
  title: string;
  description: string | null;
  category: IssueCategory;
  status: IssueStatus;
  before_photo_url: string;
  after_photo_url: string | null;
  latitude: number;
  longitude: number;
  location_address: string | null;
  upvotes: number;
  comment_count: number;
  created_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
  reporter_name?: string | null;
  citizen?: { name: string | null } | null;
  sevak?: { id: string; name: string; photo_url: string | null } | null;
}

export interface IssueUpdate {
  id: string;
  issue_id: string;
  updated_by: string | null;
  status: IssueStatus;
  note: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  citizen_id: string | null;
  parent_id?: string | null;
  display_name?: string | null;
  text: string;
  created_at: string;
  citizen?: { name: string | null } | null;
}

export const STATUS_COLORS: Record<IssueStatus, string> = {
  pending: '#F59E0B',
  escalated: '#F97316',
  accepted: '#3B82F6',
  in_progress: '#8B5CF6',
  resolved: '#10B981',
  rejected: '#EF4444',
};

export const STATUS_LABELS: Record<IssueStatus, string> = {
  pending: 'Pending',
  escalated: 'Escalated',
  accepted: 'Accepted',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const STATUS_BADGE: Record<IssueStatus, { bg: string; color: string; dot: string }> = {
  pending: { bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  escalated: { bg: '#FEF2F2', color: '#B91C1C', dot: '#EF4444' },
  accepted: { bg: '#F5F3FF', color: '#6D28D9', dot: '#8B5CF6' },
  in_progress: { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  resolved: { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  rejected: { bg: '#F3F4F6', color: '#6B7280', dot: '#9CA3AF' },
};

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  pothole: 'Road Damage',
  garbage: 'Garbage',
  streetlight: 'Street Light',
  water: 'Water Leakage',
  drainage: 'Drainage',
  encroachment: 'Encroachment',
  other: 'Other',
};

export const CATEGORY_STYLE: Record<IssueCategory, { color: string; bg: string }> = {
  pothole: { color: '#D97706', bg: '#FEF3C7' },
  garbage: { color: '#059669', bg: '#D1FAE5' },
  streetlight: { color: '#7C3AED', bg: '#EDE9FE' },
  water: { color: '#0EA5E9', bg: '#E0F2FE' },
  drainage: { color: '#0D9488', bg: '#CCFBF1' },
  encroachment: { color: '#DC2626', bg: '#FEE2E2' },
  other: { color: '#6B7280', bg: '#F3F4F6' },
};

export const PARTY_ACCENT: Record<string, string> = {
  'Shiv Sena': '#F97316',
  'Shiv Sena (UBT)': '#F97316',
  'Shiv Sena (Uddhav Balasaheb Thackeray)': '#F4A024',
  BJP: '#EF4444',
  'Bharatiya Janata Party': '#EF4444',
  Congress: '#3B82F6',
  'Indian National Congress': '#3B82F6',
  NCP: '#1976D2',
  'Nationalist Congress Party': '#1976D2',
  'Maharashtra Navnirman Sena': '#7C3AED',
  Independent: '#6B7280',
};

export const STATUS_ORDER: IssueStatus[] = ['pending', 'escalated', 'accepted', 'in_progress', 'resolved'];
