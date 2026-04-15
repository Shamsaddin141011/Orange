export type Country = 'USA' | 'UK' | 'EU' | 'China' | 'Canada' | 'Australia';
export type AidStatus = 'yes' | 'no' | 'unknown';
export type ShortlistTag = 'reach' | 'match' | 'safety';

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
