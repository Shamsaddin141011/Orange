import { MatchResult, StudentProfile, University } from '../types';

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Final score = 0.55 interest + 0.35 SAT + 0.10 preference
 */
export const scoreUniversity = (profile: StudentProfile, university: University): MatchResult => {
  const interestSet = new Set(profile.interests.map((i) => i.toLowerCase()));
  const majorSet = new Set(university.majors.map((m) => m.toLowerCase()));
  const overlap = [...interestSet].filter((i) => majorSet.has(i)).length;
  const union = new Set([...interestSet, ...majorSet]).size || 1;
  const interestScore = overlap / union;

  let satScore = 0.5;
  if (profile.satTotal) {
    const sat = profile.satTotal;
    const min = university.sat_middle_50.min;
    const max = university.sat_middle_50.max;
    if (sat >= min && sat <= max) {
      satScore = 1;
    } else {
      const distance = sat < min ? min - sat : sat - max;
      satScore = clamp(1 - distance / 500);
    }
  }

  let prefScore = 0;
  if (profile.preferredLocation && `${university.city} ${university.state}`.toLowerCase().includes(profile.preferredLocation.toLowerCase())) {
    prefScore += 0.5;
  }
  if (profile.budgetMax && university.tuition_estimate <= profile.budgetMax) {
    prefScore += 0.5;
  }

  const total = 0.55 * interestScore + 0.35 * satScore + 0.1 * prefScore;

  const reasons: string[] = [];
  if (profile.satTotal && satScore >= 0.8) reasons.push('SAT range fits well');
  if (overlap > 0) reasons.push(`Strong for ${[...interestSet].filter((i) => majorSet.has(i)).slice(0, 2).join(', ')}`);
  if (profile.preferredLocation && prefScore >= 0.5) reasons.push('Location preference alignment');
  if (profile.budgetMax && university.tuition_estimate <= profile.budgetMax) reasons.push('Within your budget preference');
  if (!reasons.length) reasons.push('Good overall profile compatibility');

  return {
    university,
    score: Math.round(total * 100),
    reasons: reasons.slice(0, 3),
    breakdown: {
      interest: Math.round(interestScore * 100),
      sat: Math.round(satScore * 100),
      preference: Math.round(prefScore * 100)
    }
  };
};

export const validateSat = (sat?: number) => sat === undefined || (sat >= 400 && sat <= 1600);
export const validateSectionSat = (score?: number) => score === undefined || (score >= 200 && score <= 800);
