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

// ── Score conversion helpers ─────────────────────────────────────────────────

/** IB predicted score (0–45) → SAT equivalent. IB 24 ≈ SAT 950, IB 45 ≈ SAT 1580. */
function ibToSatEquiv(ib: number): number {
  return Math.round(950 + ((ib - 24) / 21) * 630);
}

/** ACT → SAT (College Board official concordance table). */
const ACT_TO_SAT: Record<number, number> = {
  36:1600, 35:1560, 34:1500, 33:1460, 32:1420, 31:1380, 30:1340,
  29:1290, 28:1250, 27:1210, 26:1170, 25:1130, 24:1090, 23:1060,
  22:1020, 21:980,  20:950,  19:920,  18:880,  17:840,  16:800,
  15:760,  14:730,  13:700,  12:670,  11:630,  10:590,
};
function actToSatEquiv(act: number): number {
  const n = Math.round(Math.max(10, Math.min(36, act)));
  return ACT_TO_SAT[n] ?? 590;
}

/**
 * IELTS (4.0–9.0) → SAT equivalent used as an academic proxy when no SAT/ACT/IB provided.
 * IELTS 4.0 ≈ SAT 760, IELTS 9.0 ≈ SAT 1600.
 */
function ieltsToSatEquiv(ielts: number): number {
  return Math.round(760 + (Math.max(4.0, Math.min(9.0, ielts)) - 4.0) / 5.0 * 840);
}

/**
 * TOEFL (0–120) → SAT equivalent used as an academic proxy.
 * TOEFL 60 ≈ SAT 900, TOEFL 120 ≈ SAT 1600.
 */
function toeflToSatEquiv(toefl: number): number {
  const t = Math.max(0, Math.min(120, toefl));
  if (t >= 60) return Math.round(900 + (t - 60) * (700 / 60));
  return Math.round(400 + t * (500 / 60));
}

/**
 * GRE combined (Verbal 130–170 + Quant 130–170, total 260–340) → SAT equivalent.
 * GRE 340 ≈ SAT 1600, GRE 260 ≈ SAT 800.
 */
export function greToSatEquiv(verbal: number, quant: number): number {
  const combined = Math.max(260, Math.min(340, verbal + quant));
  return Math.round(800 + (combined - 260) / 80 * 800);
}

// ── Component scorers ────────────────────────────────────────────────────────

/**
 * Uses the full middle-50 range (25th → 75th percentile) rather than just the min.
 *   Above 75th pct  → 1.0
 *   In range        → 0.68–1.0 (linear)
 *   Below 25th pct  → decays from 0.68 toward 0
 */
function calcTestScore(sat: number, uni: University): number {
  const lo = uni.sat_middle_50.min;
  const hi = Math.max(uni.sat_middle_50.max, lo + 1);
  if (sat >= hi) return 1.0;
  if (sat >= lo) return 0.68 + 0.32 * (sat - lo) / (hi - lo);
  return clamp(0.68 - (lo - sat) / 420);
}

/**
 * GPA score — infers expected GPA from the university's acceptance rate.
 * Highly selective schools (low AR) expect ~3.9+; open-admission schools ~2.7+.
 */
function calcGpaScore(gpa: number, uni: University): number {
  const ar = uni.acceptance_rate;
  // acceptance 0% → expected 3.95, acceptance 80%+ → expected 2.75
  const expected = ar !== undefined ? Math.max(2.75, 3.95 - ar * 1.5) : 3.3;
  if (gpa >= expected) return 1.0;
  const ratio = gpa / expected;
  return clamp(ratio * ratio * 1.1); // quadratic decay below expected
}

/**
 * Scoring weights:
 *   0.40 interest  (major / field alignment)
 *   0.30 academic  (test scores + GPA blended)
 *   0.15 prestige  (acceptance rate proxy)
 *   0.15 preference (location + budget)
 *
 * Location match applies a ×1.20 post-score boost (capped at 1.0).
 */
export const scoreUniversity = (profile: StudentProfile, university: University): MatchResult => {
  // ── Interest ─────────────────────────────────────────────────────────────────
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

  // ── Academic ──────────────────────────────────────────────────────────────────
  // Pick the best available test score (SAT, IB, ACT, IELTS, TOEFL)
  const candidates: number[] = [];
  if (profile.satTotal  !== undefined) candidates.push(profile.satTotal);
  if (profile.ibScore   !== undefined) candidates.push(ibToSatEquiv(profile.ibScore));
  if (profile.act       !== undefined) candidates.push(actToSatEquiv(profile.act));
  if (profile.ielts     !== undefined) candidates.push(ieltsToSatEquiv(profile.ielts));
  if (profile.toefl     !== undefined) candidates.push(toeflToSatEquiv(profile.toefl));
  if (profile.greVerbal !== undefined && profile.greQuant !== undefined)
    candidates.push(greToSatEquiv(profile.greVerbal, profile.greQuant));
  const effectiveSat = candidates.length > 0 ? Math.max(...candidates) : undefined;

  const testScore = effectiveSat !== undefined ? calcTestScore(effectiveSat, university) : undefined;
  const gpaScore  = profile.gpa  !== undefined ? calcGpaScore(profile.gpa, university)  : undefined;

  let academicScore: number;
  if (testScore !== undefined && gpaScore !== undefined) {
    academicScore = 0.65 * testScore + 0.35 * gpaScore;
  } else if (testScore !== undefined) {
    academicScore = testScore;
  } else if (gpaScore !== undefined) {
    academicScore = gpaScore;
  } else {
    academicScore = 0.5;
  }

  // ── Prestige ──────────────────────────────────────────────────────────────────
  let prestigeScore = 0.4;
  if (university.acceptance_rate !== undefined && university.acceptance_rate !== null) {
    prestigeScore = clamp(1 - university.acceptance_rate);
  }

  // ── Preference ────────────────────────────────────────────────────────────────
  let locationMatch = false;
  let locationScore = 0;
  let budgetScore   = 0.5; // neutral when no budget provided

  if (profile.preferredLocation) {
    const loc    = profile.preferredLocation.toLowerCase().trim();
    const city   = university.city.toLowerCase().trim();
    const state  = university.state.toLowerCase().trim();
    const abbrev = (STATE_ABBREV[profile.preferredLocation] ?? '').toLowerCase();
    locationMatch =
      city === loc || city.includes(loc) || loc.includes(city) ||
      state === loc || (abbrev.length > 0 && state === abbrev);
    locationScore = locationMatch ? 1.0 : 0;
  }

  if (profile.budgetMax) {
    const tuition = university.tuition_estimate;
    if (tuition <= profile.budgetMax) {
      // Reward how comfortably within budget (0.70 → 1.0)
      budgetScore = 0.70 + 0.30 * Math.min(1, (profile.budgetMax - tuition) / profile.budgetMax);
    } else {
      // Penalise proportionally for going over
      const overage = (tuition - profile.budgetMax) / profile.budgetMax;
      budgetScore = Math.max(0, 0.50 - overage);
    }
  }

  const hasLocation = !!profile.preferredLocation;
  const hasBudget   = !!profile.budgetMax;
  const prefScore =
    hasLocation && hasBudget ? 0.5 * locationScore + 0.5 * budgetScore :
    hasLocation              ? locationScore :
    hasBudget                ? budgetScore   : 0.5;

  // ── Final ─────────────────────────────────────────────────────────────────────
  const rawTotal  = 0.40 * interestScore + 0.30 * academicScore + 0.15 * prestigeScore + 0.15 * prefScore;
  const finalTotal = locationMatch ? Math.min(1, rawTotal * 1.20) : rawTotal;

  // ── Reasons ───────────────────────────────────────────────────────────────────
  const reasons: string[] = [];
  if (testScore !== undefined && testScore >= 0.90) {
    reasons.push('Your test score is highly competitive here');
  } else if (testScore !== undefined && testScore >= 0.68) {
    reasons.push('Your test score falls within the typical range');
  }
  if (gpaScore !== undefined && gpaScore >= 0.85) {
    reasons.push('Your GPA is competitive for this school');
  }
  if (matchedInterests.length > 0) {
    reasons.push(`Matches your interest${matchedInterests.length > 1 ? 's' : ''}: ${matchedInterests.slice(0, 2).join(', ')}`);
  }
  if (university.acceptance_rate !== undefined && university.acceptance_rate < 0.15) {
    reasons.push('Highly selective — strong profile match');
  }
  if (locationMatch) reasons.push('Matches your location preference');
  if (profile.budgetMax && university.tuition_estimate <= profile.budgetMax) {
    reasons.push('Within your budget');
  }
  if (!reasons.length) reasons.push('Good overall profile compatibility');

  return {
    university,
    score: Math.round(finalTotal * 100),
    reasons: reasons.slice(0, 3),
    breakdown: {
      interest:   Math.round(interestScore  * 100),
      sat:        Math.round(academicScore  * 100),
      preference: Math.round(prefScore      * 100),
    },
  };
};

export const validateSat         = (v?: number) => v === undefined || (v >= 400  && v <= 1600);
export const validateSectionSat  = (v?: number) => v === undefined || (v >= 200  && v <= 800);
export const validateAct         = (v?: number) => v === undefined || (v >= 1    && v <= 36);
export const validateIelts       = (v?: number) => v === undefined || (v >= 0    && v <= 9);
export const validateToefl       = (v?: number) => v === undefined || (v >= 0    && v <= 120);
export const validateGre         = (v?: number) => v === undefined || (v >= 130  && v <= 170);
