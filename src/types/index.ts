export type Country = 'USA' | 'UK' | 'EU' | 'China' | 'Canada' | 'Australia';
export type AidStatus = 'yes' | 'no' | 'unknown';
export type ShortlistTag = 'reach' | 'match' | 'safety';
export type ApplicationStatus = 'unsent' | 'pending' | 'accepted' | 'not_accepted';

export interface ShortlistMeta {
  tag: ShortlistTag;
  note: string;
  deadline?: string;       // YYYY-MM-DD
  appStatus?: ApplicationStatus;
}

export interface DeadlineItem {
  label: string;
  date: string;
}

export interface University {
  id: string;
  name: string;
  country: Country;
  city: string;
  state: string;
  website: string;
  majors: string[];
  degrees: string[];
  sat_middle_50: { min: number; max: number };
  acceptance_rate?: number;
  tuition_estimate: number;
  intl_aid: AidStatus;
  deadlines: DeadlineItem[];
  tags: string[];
  brief_description: string;
  student_size?: number;
}

export interface StudentProfile {
  country: Country;
  interests: string[];
  degreeLevel?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredLocation?: string;
  satTotal?: number;
  satMath?: number;
  satEbrw?: number;
  ibScore?: number;
  act?: number;
  ielts?: number;
  toefl?: number;
  gpa?: number;
  greVerbal?: number;
  greQuant?: number;
}

export interface MatchResult {
  university: University;
  score: number;
  reasons: string[];
  breakdown: {
    interest: number;
    sat: number;
    preference: number;
  };
}

export interface TrackerItemState {
  essays: boolean;
  recommendations: boolean;
  testScores: boolean;
  feeWaiver: boolean;
  visaDocs: boolean;
  status: 'not_started' | 'in_progress' | 'submitted';
  reminder?: string;
}

export interface UserPublicProfile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  country?: Country;
  interests?: string[];
  degree_level?: string;
  is_public: boolean;
}

export interface Conversation {
  id: string;
  participant_ids: string[];
  last_message_at: string;
  last_message_content: string | null;
  other_user?: UserPublicProfile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string | null;
}
