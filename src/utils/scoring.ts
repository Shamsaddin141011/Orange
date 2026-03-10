import { MatchResult, StudentProfile, University } from '../types';

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Maps user-facing major names to the broad categories stored in the DB.
 * DB categories: Computer Science, Business, Engineering, Biology,
 * Medicine & Health, Social Sciences, Mathematics, Psychology,
 * Humanities, Law, Physics, Liberal Arts
 */
const MAJOR_SYNONYMS: Record<string, string[]> = {
  'computer science':        ['Computer Science'],
  'data science':            ['Computer Science', 'Mathematics'],
  'software engineering':    ['Computer Science', 'Engineering'],
  'information technology':  ['Computer Science'],
  'cybersecurity':           ['Computer Science'],
  'artificial intelligence': ['Computer Science', 'Mathematics'],
  'machine learning':        ['Computer Science', 'Mathematics'],
  'mathematics':             ['Mathematics'],
  'statistics':              ['Mathematics', 'Computer Science'],
  'physics':                 ['Physics'],
  'chemistry':               ['Physics', 'Biology'],
  'biology':                 ['Biology'],
  'environmental science':   ['Biology', 'Physics'],
  'neuroscience':            ['Biology', 'Psychology'],
  'biomedical engineering':  ['Engineering', 'Biology'],
  'engineering':             ['Engineering'],
  'electrical engineering':  ['Engineering'],
  'mechanical engineering':  ['Engineering'],
  'civil engineering':       ['Engineering'],
  'chemical engineering':    ['Engineering', 'Physics'],
  'architecture':            ['Engineering', 'Humanities'],
  'business':                ['Business'],
  'finance':                 ['Business', 'Mathematics'],
  'accounting':              ['Business'],
  'marketing':               ['Business'],
  'management':              ['Business'],
  'international business':  ['Business', 'Social Sciences'],
  'entrepreneurship':        ['Business'],
  'economics':               ['Business', 'Social Sciences'],
  'psychology':              ['Psychology'],
  'sociology':               ['Social Sciences'],
  'political science':       ['Social Sciences', 'Law'],
  'anthropology':            ['Social Sciences', 'Humanities'],
  'geography':               ['Social Sciences'],
  'criminology':             ['Social Sciences', 'Law'],
  'social work':             ['Social Sciences'],
  'international relations': ['Social Sciences'],
  'law':                     ['Law'],
  'humanities':              ['Humanities'],
  'history':                 ['Humanities', 'Social Sciences'],
  'philosophy':              ['Humanities'],
  'english':                 ['Humanities'],
  'literature':              ['Humanities'],
  'linguistics':             ['Humanities'],
  'communications':          ['Humanities', 'Social Sciences'],
  'journalism':              ['Humanities'],
  'media studies':           ['Humanities', 'Social Sciences'],
  'film':                    ['Humanities'],
  'theater':                 ['Humanities', 'Liberal Arts'],
  'art':                     ['Humanities', 'Liberal Arts'],
  'design':                  ['Humanities', 'Computer Science'],
  'music':                   ['Humanities', 'Liberal Arts'],
  'education':               ['Social Sciences', 'Humanities'],
  'medicine':                ['Medicine & Health'],
  'nursing':                 ['Medicine & Health'],
  'public health':           ['Medicine & Health'],
  'pharmacy':                ['Medicine & Health', 'Biology'],
  'dentistry':               ['Medicine & Health'],
  'liberal arts':            ['Liberal Arts', 'Humanities'],
};

/** Expand a user interest to its DB-matching categories */
function expandInterest(interest: string): string[] {
  const key = interest.toLowerCase();
  // Direct synonym lookup
  if (MAJOR_SYNONYMS[key]) return MAJOR_SYNONYMS[key].map((s) => s.toLowerCase());
  // Fallback: check if the interest is a substring of any synonym key or vice versa
  for (const [synKey, synVals] of Object.entries(MAJOR_SYNONYMS)) {
    if (synKey.includes(key) || key.includes(synKey)) {
      return synVals.map((s) => s.toLowerCase());
    }
  }
  // Last resort: return the interest itself (handles direct DB category matches)
  return [key];
}

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
  // Interest — expand user interests to DB categories via synonym map,
  // then check recall against what the university offers.
  const majorList = university.majors.map((m) => m.toLowerCase());
  const matchedInterests = profile.interests.filter((interest) => {
    const expanded = expandInterest(interest);
    return expanded.some((term) =>
      majorList.some((major) => major.includes(term) || term.includes(major))
    );
  });
  const interestScore = profile.interests.length > 0
    ? matchedInterests.length / profile.interests.length
    : 0.5;

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
