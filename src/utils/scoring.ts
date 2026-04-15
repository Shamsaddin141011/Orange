import { MatchResult, StudentProfile, University } from '../types';
import { STATE_ABBREV } from './locations';

const clamp = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Maps user-facing major names to the broad categories stored in the DB.
 * DB categories: Computer Science, Business, Engineering, Biology,
 * Medicine & Health, Social Sciences, Mathematics, Psychology,
 * Humanities, Law, Physics, Liberal Arts
 */
const MAJOR_SYNONYMS: Record<string, string[]> = {
  // Computer & Technology
  'computer science':            ['Computer Science'],
  'software engineering':        ['Computer Science', 'Engineering'],
  'data science':                ['Computer Science', 'Mathematics'],
  'artificial intelligence':     ['Computer Science', 'Mathematics'],
  'machine learning':            ['Computer Science', 'Mathematics'],
  'cybersecurity':               ['Computer Science'],
  'information technology':      ['Computer Science'],
  'computer engineering':        ['Computer Science', 'Engineering'],
  'data engineering':            ['Computer Science', 'Mathematics'],
  'robotics':                    ['Engineering', 'Computer Science'],
  'bioinformatics':              ['Computer Science', 'Biology'],
  'game design':                 ['Computer Science', 'Humanities'],
  'human-computer interaction':  ['Computer Science', 'Psychology'],
  // Engineering
  'engineering':                 ['Engineering'],
  'electrical engineering':      ['Engineering'],
  'mechanical engineering':      ['Engineering'],
  'civil engineering':           ['Engineering'],
  'chemical engineering':        ['Engineering', 'Physics'],
  'biomedical engineering':      ['Engineering', 'Biology'],
  'aerospace engineering':       ['Engineering'],
  'environmental engineering':   ['Engineering', 'Biology'],
  'materials science':           ['Engineering', 'Physics'],
  'nuclear engineering':         ['Engineering', 'Physics'],
  'industrial engineering':      ['Engineering', 'Mathematics'],
  'systems engineering':         ['Engineering', 'Computer Science'],
  'petroleum engineering':       ['Engineering', 'Physics'],
  'architecture':                ['Engineering', 'Humanities'],
  // Sciences
  'mathematics':                 ['Mathematics'],
  'statistics':                  ['Mathematics', 'Computer Science'],
  'physics':                     ['Physics'],
  'chemistry':                   ['Physics', 'Biology'],
  'biology':                     ['Biology'],
  'biochemistry':                ['Biology', 'Physics'],
  'biotechnology':               ['Biology', 'Computer Science'],
  'environmental science':       ['Biology', 'Physics'],
  'earth science':               ['Biology', 'Physics'],
  'astronomy':                   ['Physics'],
  'astrophysics':                ['Physics'],
  'neuroscience':                ['Biology', 'Psychology'],
  'cognitive science':           ['Psychology', 'Computer Science'],
  'genetics':                    ['Biology'],
  'microbiology':                ['Biology'],
  'molecular biology':           ['Biology'],
  'food science':                ['Biology', 'Medicine & Health'],
  'climate science':             ['Biology', 'Physics'],
  'ecology':                     ['Biology'],
  'marine biology':              ['Biology'],
  // Business & Economics
  'business':                    ['Business'],
  'economics':                   ['Business', 'Social Sciences'],
  'finance':                     ['Business', 'Mathematics'],
  'accounting':                  ['Business'],
  'marketing':                   ['Business'],
  'management':                  ['Business'],
  'international business':      ['Business', 'Social Sciences'],
  'entrepreneurship':            ['Business'],
  'business analytics':          ['Business', 'Mathematics'],
  'digital marketing':           ['Business'],
  'human resources':             ['Business', 'Social Sciences'],
  'operations management':       ['Business'],
  'supply chain management':     ['Business'],
  'real estate':                 ['Business'],
  'investment banking':          ['Business', 'Mathematics'],
  'financial engineering':       ['Business', 'Mathematics'],
  'e-commerce':                  ['Business', 'Computer Science'],
  'actuarial science':           ['Mathematics', 'Business'],
  // Social Sciences
  'psychology':                  ['Psychology'],
  'sociology':                   ['Social Sciences'],
  'political science':           ['Social Sciences', 'Law'],
  'anthropology':                ['Social Sciences', 'Humanities'],
  'geography':                   ['Social Sciences'],
  'criminology':                 ['Social Sciences', 'Law'],
  'social work':                 ['Social Sciences'],
  'international relations':     ['Social Sciences'],
  'development studies':         ['Social Sciences'],
  'gender studies':              ['Social Sciences', 'Humanities'],
  'public policy':               ['Social Sciences', 'Law'],
  'public administration':       ['Social Sciences'],
  'urban planning':              ['Social Sciences'],
  'human rights':                ['Law', 'Social Sciences'],
  'peace studies':               ['Social Sciences', 'Humanities'],
  'demography':                  ['Social Sciences', 'Mathematics'],
  // Humanities & Arts
  'humanities':                  ['Humanities'],
  'history':                     ['Humanities', 'Social Sciences'],
  'philosophy':                  ['Humanities'],
  'english':                     ['Humanities'],
  'literature':                  ['Humanities'],
  'linguistics':                 ['Humanities'],
  'communications':              ['Humanities', 'Social Sciences'],
  'journalism':                  ['Humanities'],
  'media studies':               ['Humanities', 'Social Sciences'],
  'film':                        ['Humanities'],
  'theater':                     ['Humanities', 'Liberal Arts'],
  'art':                         ['Humanities', 'Liberal Arts'],
  'design':                      ['Humanities', 'Computer Science'],
  'music':                       ['Humanities', 'Liberal Arts'],
  'liberal arts':                ['Liberal Arts', 'Humanities'],
  'creative writing':            ['Humanities'],
  'cultural studies':            ['Humanities', 'Social Sciences'],
  'classical studies':           ['Humanities'],
  'modern languages':            ['Humanities'],
  'religious studies':           ['Humanities'],
  'digital arts':                ['Humanities', 'Liberal Arts'],
  'graphic design':              ['Humanities', 'Computer Science'],
  'fashion design':              ['Humanities', 'Liberal Arts'],
  'interior design':             ['Humanities'],
  'photography':                 ['Humanities', 'Liberal Arts'],
  // Health & Medicine
  'medicine':                    ['Medicine & Health'],
  'nursing':                     ['Medicine & Health'],
  'public health':               ['Medicine & Health'],
  'pharmacy':                    ['Medicine & Health', 'Biology'],
  'dentistry':                   ['Medicine & Health'],
  'biomedical science':          ['Biology', 'Medicine & Health'],
  'clinical psychology':         ['Psychology', 'Medicine & Health'],
  'epidemiology':                ['Medicine & Health', 'Biology'],
  'healthcare management':       ['Medicine & Health', 'Business'],
  'health informatics':          ['Medicine & Health', 'Computer Science'],
  'kinesiology':                 ['Medicine & Health'],
  'nutrition':                   ['Medicine & Health', 'Biology'],
  'veterinary science':          ['Biology', 'Medicine & Health'],
  'occupational therapy':        ['Medicine & Health'],
  'physical therapy':            ['Medicine & Health'],
  'radiography':                 ['Medicine & Health', 'Physics'],
  'speech therapy':              ['Medicine & Health'],
  'midwifery':                   ['Medicine & Health'],
  // Law
  'law':                         ['Law'],
  'international law':           ['Law', 'Social Sciences'],
  'criminal justice':            ['Law', 'Social Sciences'],
  'paralegal studies':           ['Law'],
  'forensic science':            ['Law', 'Biology'],
  'human rights law':            ['Law', 'Social Sciences'],
  // Agriculture
  'agriculture':                 ['Biology'],
  'agribusiness':                ['Business', 'Biology'],
  'forestry':                    ['Biology'],
  'environmental management':    ['Biology', 'Social Sciences'],
  'sustainable development':     ['Social Sciences', 'Biology'],
  'horticulture':                ['Biology'],
  // IB Subjects
  'ib mathematics':              ['Mathematics'],
  'ib physics':                  ['Physics'],
  'ib chemistry':                ['Physics', 'Biology'],
  'ib biology':                  ['Biology'],
  'ib computer science':         ['Computer Science'],
  'ib economics':                ['Business', 'Social Sciences'],
  'ib business management':      ['Business'],
  'ib history':                  ['Humanities', 'Social Sciences'],
  'ib geography':                ['Social Sciences'],
  'ib psychology':               ['Psychology'],
  'ib philosophy':               ['Humanities'],
  'ib literature':               ['Humanities'],
  'ib visual arts':              ['Humanities', 'Liberal Arts'],
  'ib theatre':                  ['Humanities', 'Liberal Arts'],
  'ib music':                    ['Humanities', 'Liberal Arts'],
  'ib film':                     ['Humanities'],
  'ib environmental systems':    ['Biology', 'Physics'],
  'ib global politics':          ['Social Sciences', 'Law'],
  'ib sports science':           ['Medicine & Health'],
};

/** Expand a user interest to its DB-matching categories */
function expandInterest(interest: string): string[] {
  const key = interest.toLowerCase();
  if (MAJOR_SYNONYMS[key]) return MAJOR_SYNONYMS[key].map((s) => s.toLowerCase());
  for (const [synKey, synVals] of Object.entries(MAJOR_SYNONYMS)) {
    if (synKey.includes(key) || key.includes(synKey)) {
      return synVals.map((s) => s.toLowerCase());
    }
  }
  return [key];
}

/** Convert IB predicted score (0–45) to SAT-equivalent for scoring purposes */
function ibToSatEquiv(ibScore: number): number {
  // IB 24 ≈ SAT 950, IB 45 ≈ SAT 1580 (linear)
  return Math.round(950 + ((ibScore - 24) / 21) * 630);
}

/**
 * Final score = 0.40 interest + 0.35 SAT/IB + 0.15 prestige + 0.10 preference
 * Location match applies a 25% post-score boost (capped at 100) so preferred
 * location universities always surface to the top.
 */
export const scoreUniversity = (profile: StudentProfile, university: University): MatchResult => {
  // ── Interest ────────────────────────────────────────────────────────────────
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

  // ── SAT / IB ─────────────────────────────────────────────────────────────────
  // Use whichever signal the student provided; if both, take the higher result.
  const ibEquiv = profile.ibScore !== undefined ? ibToSatEquiv(profile.ibScore) : undefined;
  const effectiveSat = profile.satTotal !== undefined
    ? (ibEquiv !== undefined ? Math.max(profile.satTotal, ibEquiv) : profile.satTotal)
    : ibEquiv;

  let satScore = 0.5;
  if (effectiveSat !== undefined) {
    const sat = effectiveSat;
    const min = university.sat_middle_50.min;
    if (sat >= min) {
      satScore = 1;
    } else {
      satScore = clamp(1 - (min - sat) / 400);
    }
  }

  // ── Prestige ─────────────────────────────────────────────────────────────────
  let prestigeScore = 0.4;
  if (university.acceptance_rate !== undefined && university.acceptance_rate !== null) {
    prestigeScore = clamp(1 - university.acceptance_rate);
  }

  // ── Preference ───────────────────────────────────────────────────────────────
  let prefScore = 0;
  let locationMatch = false;

  if (profile.preferredLocation) {
    const loc = profile.preferredLocation.toLowerCase().trim();
    const city = university.city.toLowerCase().trim();
    const state = university.state.toLowerCase().trim();
    // Convert full state name (e.g. "California") → abbreviation ("ca") for DB matching
    const abbrev = (STATE_ABBREV[profile.preferredLocation] ?? '').toLowerCase();

    locationMatch =
      city === loc ||
      city.includes(loc) ||
      loc.includes(city) ||
      state === loc ||
      (abbrev.length > 0 && state === abbrev);

    if (locationMatch) prefScore += 0.5;
  }

  if (profile.budgetMax && university.tuition_estimate <= profile.budgetMax) {
    prefScore += 0.5;
  }

  const rawTotal = 0.40 * interestScore + 0.35 * satScore + 0.15 * prestigeScore + 0.10 * prefScore;

  // Location boost: matching unis rank significantly higher (×1.25, capped at 1)
  const finalTotal = locationMatch ? Math.min(1, rawTotal * 1.25) : rawTotal;

  // ── Reasons ──────────────────────────────────────────────────────────────────
  const reasons: string[] = [];
  if (effectiveSat && satScore >= 0.9) reasons.push('Your test score is highly competitive here');
  if (matchedInterests.length > 0) reasons.push(`Offers your interest${matchedInterests.length > 1 ? 's' : ''}: ${matchedInterests.slice(0, 2).join(', ')}`);
  if (university.acceptance_rate !== undefined && university.acceptance_rate < 0.15) reasons.push('Highly selective — strong match for your profile');
  if (locationMatch) reasons.push('Location preference alignment');
  if (profile.budgetMax && university.tuition_estimate <= profile.budgetMax) reasons.push('Within your budget preference');
  if (!reasons.length) reasons.push('Good overall profile compatibility');

  return {
    university,
    score: Math.round(finalTotal * 100),
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
