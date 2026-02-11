import { University } from '../types';

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
  ['King\'s College London', 'London', 'England'],
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

const majorBuckets = [
  ['Computer Science', 'Data Science', 'Mathematics'],
  ['Business', 'Economics', 'Finance'],
  ['Mechanical Engineering', 'Electrical Engineering', 'Physics'],
  ['Biology', 'Medicine', 'Chemistry'],
  ['Psychology', 'Sociology', 'Political Science']
] as const;

const toUniversity = (
  [name, city, state]: readonly [string, string, string],
  idx: number,
  country: 'USA' | 'UK'
): University => {
  const satMin = 1050 + (idx % 8) * 60;
  const satMax = satMin + 220;
  const majors = majorBuckets[idx % majorBuckets.length] ?? majorBuckets[0];
  return {
    id: `${country.toLowerCase()}-${idx + 1}`,
    name,
    country,
    city,
    state,
    website: `https://www.${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.edu`,
    majors: [...majors],
    sat_middle_50: { min: satMin, max: satMax },
    acceptance_rate: Number((0.08 + (idx % 12) * 0.04).toFixed(2)),
    tuition_estimate: country === 'USA' ? 22000 + (idx % 10) * 4200 : 18000 + (idx % 10) * 2600,
    intl_aid: idx % 3 === 0 ? 'yes' : idx % 3 === 1 ? 'no' : 'unknown',
    deadlines: [
      { label: 'Early', date: '2026-11-01' },
      { label: 'Regular', date: '2027-01-15' }
    ],
    tags: [idx % 2 === 0 ? 'public' : 'private', idx % 4 === 0 ? 'urban' : 'suburban'],
    brief_description: `${name} is demo data for OrangeUni with strong options in ${majors[0]} and ${majors[1]}.`
  };
};

export const universities: University[] = [
  ...usSeeds.map((s, i) => toUniversity(s, i, 'USA')),
  ...ukSeeds.map((s, i) => toUniversity(s, i + usSeeds.length, 'UK'))
];

export const datasetSchemaExample: University = universities[0]!;
