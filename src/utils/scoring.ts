import { MatchResult, StudentProfile, University } from '../types';

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Final score = 0.40 interest (recall) + 0.35 SAT + 0.15 prestige + 0.10 preference
 *
 * Interest uses recall (overlap / user_interests) so large universities with many
 * programs aren't penalized for offering more than what the student wants.
 *
 * SAT: being above a school's middle-50 range is treated as full score — a 1600
 * student is a strong candidate everywhere.
 *
 * Prestige: derived from acceptance rate so high-SAT students surface elite schools.
 */
export const scoreUniversity = (profile: StudentProfile, university: University): MatchResult => {
  // Interest — recall-based: what fraction of the student's interests does this school cover?
  const interestSet = new Set(profile.interests.map((i) => i.toLowerCase()));
  const majorSet = new Set(university.majors.map((m) => m.toLowerCase()));
  const matchedInterests = [...interestSet].filter((i) => majorSet.has(i));
  const interestScore = interestSet.size > 0 ? matchedInterests.length / interestSet.size : 0.5;

  // SAT — no penalty for being above the range; only penalise for being below
  let satScore = 0.5;
  if (profile.satTotal) {
    const sat = profile.satTotal;
    const min = university.sat_middle_50.min;
    const max = university.sat_middle_50.max;
    if (sat >= min) {
      // In range or above: full score
      satScore = 1;
    } else {
      // Below range: decay over 400 points
      satScore = clamp(1 - (min - sat) / 400);
    }
  }

  // Prestige — inverse acceptance rate; unknown defaults to mid-prestige
  let prestigeScore = 0.4;
  if (university.acceptance_rate !== undefined && university.acceptance_rate !== null) {
    prestigeScore = clamp(1 - university.acceptance_rate);
  }

  // Preference
  let prefScore = 0;
  if (profile.preferredLocation && `${university.city} ${university.state}`.toLowerCase().includes(profile.preferredLocation.toLowerCase())) {
    prefScore += 0.5;
  }
  if (profile.budgetMax && university.tuition_estimate <= profile.budgetMax) {
    prefScore += 0.5;
  }

  const total = 0.40 * interestScore + 0.35 * satScore + 0.15 * prestigeScore + 0.10 * prefScore;

  const reasons: string[] = [];
  if (profile.satTotal && satScore >= 0.9) reasons.push('Your SAT score is highly competitive here');
  if (matchedInterests.length > 0) reasons.push(`Offers your interest${matchedInterests.length > 1 ? 's' : ''}: ${matchedInterests.slice(0, 2).join(', ')}`);
  if (university.acceptance_rate !== undefined && university.acceptance_rate < 0.15) reasons.push('Highly selective — strong match for your profile');
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
      preference: Math.round(prefScore * 100),
    },
  };
};

export const validateSat = (sat?: number) => sat === undefined || (sat >= 400 && sat <= 1600);
export const validateSectionSat = (score?: number) => score === undefined || (score >= 200 && score <= 800);
