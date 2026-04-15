import { University } from '../types';
import { UniversityRow } from './supabase';

/** Convert a Supabase row into the University shape the app uses */
export function rowToUniversity(row: UniversityRow): University {
  return {
    id: row.id,
    name: row.name,
    country: row.country as University['country'],
    city: row.city ?? '',
    state: row.state ?? '',
    website: row.website ?? '',
    majors: row.majors ?? [],
    degrees: row.degrees ?? ['Bachelor', 'Master', 'PhD'],
    sat_middle_50: {
      min: row.sat_min ?? 1000,
      max: row.sat_max ?? 1400,
    },
    acceptance_rate: row.acceptance_rate ?? undefined,
    tuition_estimate: row.tuition_estimate ?? 30000,
    intl_aid: row.intl_aid ?? 'unknown',
    deadlines: [
      { label: 'Early', date: '2026-11-01' },
      { label: 'Regular', date: '2027-01-15' },
    ],
    tags: row.tags ?? [],
    brief_description: row.brief_description ?? '',
    student_size: row.student_size ?? undefined,
  };
}

/** Deterministic card color index from university id */
export function colorIdx(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(31, h) + id.charCodeAt(i);
  }
  return Math.abs(h);
}
