import { University } from '../types';

const TOTAL_UNIVERSITIES = 500;
const USA_SHARE = 300;

const usSeeds = [
  ['Stanford University', 'Stanford', 'CA'],
  ['Massachusetts Institute of Technology', 'Cambridge', 'MA'],
  ['Harvard University', 'Cambridge', 'MA'],
  ['University of California, Berkeley', 'Berkeley', 'CA'],
  ['University of Michigan', 'Ann Arbor', 'MI'],
  ['Carnegie Mellon University', 'Pittsburgh', 'PA'],
  ['University of Texas at Austin', 'Austin', 'TX'],
  ['University of Washington', 'Seattle', 'WA'],
  ['Georgia Institute of Technology', 'Atlanta', 'GA'],
  ['New York University', 'New York', 'NY'],
  ['University of Southern California', 'Los Angeles', 'CA'],
  ['University of Illinois Urbana-Champaign', 'Champaign', 'IL'],
  ['Purdue University', 'West Lafayette', 'IN'],
  ['Pennsylvania State University', 'University Park', 'PA'],
  ['Boston University', 'Boston', 'MA'],
  ['Northeastern University', 'Boston', 'MA'],
  ['University of Florida', 'Gainesville', 'FL'],
  ['Ohio State University', 'Columbus', 'OH'],
  ['Arizona State University', 'Tempe', 'AZ'],
  ['University of Arizona', 'Tucson', 'AZ'],
  ['Rutgers University', 'New Brunswick', 'NJ'],
  ['University of Wisconsin–Madison', 'Madison', 'WI'],
  ['University of Minnesota', 'Minneapolis', 'MN'],
  ['University of Maryland', 'College Park', 'MD'],
  ['Temple University', 'Philadelphia', 'PA']
] as const;

const ukSeeds = [
  ['University of Oxford', 'Oxford', 'England'],
  ['University of Cambridge', 'Cambridge', 'England'],
  ['Imperial College London', 'London', 'England'],
  ['University College London', 'London', 'England'],
  ["King's College London", 'London', 'England'],
  ['London School of Economics', 'London', 'England'],
  ['University of Edinburgh', 'Edinburgh', 'Scotland'],
  ['University of Manchester', 'Manchester', 'England'],
  ['University of Bristol', 'Bristol', 'England'],
  ['University of Warwick', 'Coventry', 'England'],
  ['University of Glasgow', 'Glasgow', 'Scotland'],
  ['University of Leeds', 'Leeds', 'England'],
  ['University of Birmingham', 'Birmingham', 'England'],
  ['University of Southampton', 'Southampton', 'England'],
  ['University of Sheffield', 'Sheffield', 'England'],
  ['Durham University', 'Durham', 'England'],
  ['University of Nottingham', 'Nottingham', 'England'],
  ['University of York', 'York', 'England'],
  ['University of Bath', 'Bath', 'England'],
  ['University of Exeter', 'Exeter', 'England'],
  ['University of Liverpool', 'Liverpool', 'England'],
  ['Queen Mary University of London', 'London', 'England'],
  ['Lancaster University', 'Lancaster', 'England'],
  ['Cardiff University', 'Cardiff', 'Wales'],
  ['Newcastle University', 'Newcastle', 'England']
] as const;

const campusVariants = [
  'Main Campus',
  'City Campus',
  'North Campus',
  'South Campus',
  'Innovation Campus',
  'Global Campus',
  'Riverside Campus',
  'Metro Campus',
  'Central Campus',
  'Science Campus'
] as const;

const majorBuckets = [
  ['Computer Science', 'Data Science', 'Mathematics', 'Statistics'],
  ['Business', 'Economics', 'Finance', 'Management'],
  ['Mechanical Engineering', 'Electrical Engineering', 'Physics', 'Robotics'],
  ['Biology', 'Medicine', 'Chemistry', 'Public Health'],
  ['Psychology', 'Sociology', 'Political Science', 'International Relations'],
  ['Law', 'Philosophy', 'History', 'English Literature'],
  ['Architecture', 'Urban Planning', 'Civil Engineering', 'Environmental Science'],
  ['Design', 'Media Studies', 'Communication', 'Fine Arts']
] as const;

const intakeTerms = ['Fall', 'Spring', 'Rolling'];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '').trim();

const buildUniversity = (
  base: readonly [string, string, string],
  idx: number,
  country: 'USA' | 'UK'
): University => {
  const [baseName, city, state] = base;
  const variant = campusVariants[idx % campusVariants.length];
  const name = `${baseName} (${variant})`;
  const satMin = 960 + (idx % 12) * 50;
  const satMax = Math.min(1600, satMin + 250);
  const majors = majorBuckets[idx % majorBuckets.length] ?? majorBuckets[0];
  const acceptance = Number((0.06 + (idx % 18) * 0.035).toFixed(2));
  const tuition = country === 'USA' ? 17000 + (idx % 20) * 2500 : 13000 + (idx % 20) * 1900;

  return {
    id: `${country.toLowerCase()}-${idx + 1}`,
    name,
    country,
    city,
    state,
    website:
      country === 'USA'
        ? `https://www.${slugify(baseName)}.edu`
        : `https://www.${slugify(baseName)}.ac.uk`,
    majors: [...majors],
    sat_middle_50: { min: satMin, max: satMax },
    acceptance_rate: acceptance,
    tuition_estimate: tuition,
    intl_aid: idx % 3 === 0 ? 'yes' : idx % 3 === 1 ? 'no' : 'unknown',
    deadlines: [
      { label: `${intakeTerms[idx % intakeTerms.length]} Priority`, date: '2026-11-01' },
      { label: 'Regular', date: '2027-01-15' },
      { label: 'Scholarship', date: '2026-12-01' }
    ],
    tags: [
      idx % 2 === 0 ? 'public' : 'private',
      idx % 4 === 0 ? 'urban' : idx % 4 === 1 ? 'suburban' : 'college-town'
    ],
    brief_description: `${name} is demo data for OrangeUni with strong pathways in ${majors[0]} and ${majors[1]}, active student support, and international applicant guidance.`
  };
};

const buildCountryList = (
  seeds: readonly (readonly [string, string, string])[],
  count: number,
  country: 'USA' | 'UK',
  offset: number
): University[] => {
  const firstSeed = seeds[0];
  if (!firstSeed) return [];

  return Array.from({ length: count }, (_, i) => {
    const seed = seeds[i % seeds.length] ?? firstSeed;
    return buildUniversity(seed, i + offset, country);
  });
};

const usUniversities = buildCountryList(usSeeds, USA_SHARE, 'USA', 0);
const ukUniversities = buildCountryList(ukSeeds, TOTAL_UNIVERSITIES - USA_SHARE, 'UK', USA_SHARE);

export const universities: University[] = [...usUniversities, ...ukUniversities];

export const datasetSchemaExample: University = universities[0]!;
