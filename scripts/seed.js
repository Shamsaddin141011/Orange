/**
 * OrangeUni seed script
 * ─────────────────────
 * Sources:
 *   US  → College Scorecard API (data.ed.gov) — real tuition, SAT, acceptance rates
 *   UK  → HipoLabs open university list + curated stats
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Requires .env.local with:
 *   SUPABASE_URL=
 *   SUPABASE_SERVICE_KEY=
 *   SCORECARD_API_KEY=
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_KEY, SCORECARD_API_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !SCORECARD_API_KEY) {
  console.error('Missing env vars. Create .env.local with SUPABASE_URL, SUPABASE_SERVICE_KEY, SCORECARD_API_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── College Scorecard field mapping ──────────────────────────────────────────

const SC_FIELDS = [
  'id',
  'school.name',
  'school.city',
  'school.state',
  'school.school_url',
  'school.ownership',       // 1=public 2=private-nonprofit 3=private-profit
  'school.locale',          // 11-13=city 21-23=suburb 31-43=town/rural
  'latest.admissions.sat_scores.25th_percentile.critical_reading',
  'latest.admissions.sat_scores.75th_percentile.critical_reading',
  'latest.admissions.sat_scores.25th_percentile.math',
  'latest.admissions.sat_scores.75th_percentile.math',
  'latest.admissions.admission_rate.overall',
  'latest.cost.tuition.out_of_state',
  'latest.student.size',
  'latest.academics.program_percentage.computer',
  'latest.academics.program_percentage.business_marketing',
  'latest.academics.program_percentage.engineering',
  'latest.academics.program_percentage.biological',
  'latest.academics.program_percentage.social_science',
  'latest.academics.program_percentage.mathematics',
  'latest.academics.program_percentage.psychology',
  'latest.academics.program_percentage.health',
  'latest.academics.program_percentage.humanities',
  'latest.academics.program_percentage.law',
  'latest.academics.program_percentage.physical_science',
].join(',');

const MAJOR_MAP = [
  { key: 'latest.academics.program_percentage.computer',          name: 'Computer Science' },
  { key: 'latest.academics.program_percentage.business_marketing', name: 'Business' },
  { key: 'latest.academics.program_percentage.engineering',        name: 'Engineering' },
  { key: 'latest.academics.program_percentage.biological',         name: 'Biology' },
  { key: 'latest.academics.program_percentage.health',             name: 'Medicine & Health' },
  { key: 'latest.academics.program_percentage.social_science',     name: 'Social Sciences' },
  { key: 'latest.academics.program_percentage.mathematics',        name: 'Mathematics' },
  { key: 'latest.academics.program_percentage.psychology',         name: 'Psychology' },
  { key: 'latest.academics.program_percentage.humanities',         name: 'Humanities' },
  { key: 'latest.academics.program_percentage.law',                name: 'Law' },
  { key: 'latest.academics.program_percentage.physical_science',   name: 'Physics' },
];

function getMajors(s) {
  return MAJOR_MAP
    .filter(m => (s[m.key] ?? 0) > 0.04)
    .sort((a, b) => (s[b.key] ?? 0) - (s[a.key] ?? 0))
    .slice(0, 5)
    .map(m => m.name);
}

function getTags(s) {
  const tags = [];
  const own = s['school.ownership'];
  if (own === 1) tags.push('public');
  else if (own === 2) tags.push('private');
  const loc = s['school.locale'];
  if (loc >= 11 && loc <= 13) tags.push('urban');
  else if (loc >= 21 && loc <= 23) tags.push('suburban');
  else tags.push('rural');
  return tags;
}

function transformUS(s) {
  const ebrw25 = s['latest.admissions.sat_scores.25th_percentile.critical_reading'];
  const ebrw75 = s['latest.admissions.sat_scores.75th_percentile.critical_reading'];
  const math25 = s['latest.admissions.sat_scores.25th_percentile.math'];
  const math75 = s['latest.admissions.sat_scores.75th_percentile.math'];

  const sat_min = ebrw25 && math25 ? ebrw25 + math25 : null;
  const sat_max = ebrw75 && math75 ? ebrw75 + math75 : null;

  const majors = getMajors(s);
  const tags = getTags(s);
  const city = s['school.city'] ?? '';
  const state = s['school.state'] ?? '';
  const ownership = tags.includes('public') ? 'public' : 'private';

  const ar = s['latest.admissions.admission_rate.overall'];
  const degrees = ar !== null && ar <= 0.5 ? ['Bachelor', 'Master', 'PhD'] : ['Bachelor', 'Master'];

  return {
    id: `usa-${s.id}`,
    name: s['school.name'],
    country: 'USA',
    city,
    state,
    website: s['school.school_url']
      ? (s['school.school_url'].startsWith('http') ? s['school.school_url'] : `https://${s['school.school_url']}`)
      : null,
    majors: majors.length ? majors : ['Liberal Arts'],
    degrees,
    sat_min,
    sat_max,
    acceptance_rate: ar ?? null,
    tuition_estimate: s['latest.cost.tuition.out_of_state'] ?? 30000,
    intl_aid: 'unknown',
    tags,
    brief_description: `${s['school.name']} is a ${ownership} university in ${city}, ${state}.`,
    student_size: s['latest.student.size'] ?? null,
  };
}

// ─── Top US Universities (curated, always seeded first) ───────────────────────
// IDs match College Scorecard IDs so upsert-by-id deduplicates with API data.
const TOP_US = [
  // [scorecard_id, name, city, state, website, tuition, acceptance_rate, sat_min, sat_max, size, majors]
  [243744, 'Stanford University',                   'Stanford',         'CA', 'https://www.stanford.edu',      57000, 0.04, 1500, 1570, 17000, ['Computer Science','Engineering','Business','Mathematics','Biology']],
  [166683, 'Massachusetts Institute of Technology', 'Cambridge',        'MA', 'https://www.mit.edu',           55000, 0.04, 1510, 1580, 11500, ['Engineering','Computer Science','Mathematics','Physics','Business']],
  [166027, 'Harvard University',                    'Cambridge',        'MA', 'https://www.harvard.edu',       56000, 0.04, 1460, 1570, 21000, ['Business','Law','Medicine & Health','Social Sciences','Humanities']],
  [130794, 'Yale University',                       'New Haven',        'CT', 'https://www.yale.edu',          60000, 0.05, 1460, 1560, 13000, ['Humanities','Law','Social Sciences','Biology','Medicine & Health']],
  [186131, 'Princeton University',                  'Princeton',        'NJ', 'https://www.princeton.edu',     57000, 0.05, 1490, 1570,  9000, ['Engineering','Computer Science','Mathematics','Social Sciences','Humanities']],
  [190150, 'Columbia University',                   'New York',         'NY', 'https://www.columbia.edu',      63000, 0.05, 1450, 1560, 31000, ['Engineering','Business','Social Sciences','Humanities','Medicine & Health']],
  [144050, 'University of Chicago',                 'Chicago',          'IL', 'https://www.uchicago.edu',      62000, 0.07, 1480, 1570, 17000, ['Social Sciences','Economics','Humanities','Mathematics','Physics']],
  [198419, 'Duke University',                       'Durham',           'NC', 'https://www.duke.edu',          60000, 0.07, 1480, 1570, 16000, ['Medicine & Health','Engineering','Business','Social Sciences','Biology']],
  [147767, 'Northwestern University',               'Evanston',         'IL', 'https://www.northwestern.edu',  60000, 0.07, 1470, 1560, 21000, ['Engineering','Business','Social Sciences','Humanities','Computer Science']],
  [162928, 'Johns Hopkins University',              'Baltimore',        'MD', 'https://www.jhu.edu',           58000, 0.07, 1490, 1570, 27000, ['Medicine & Health','Engineering','Biology','Social Sciences','Computer Science']],
  [110347, 'California Institute of Technology',    'Pasadena',         'CA', 'https://www.caltech.edu',       58000, 0.03, 1530, 1600,  2200, ['Engineering','Physics','Mathematics','Computer Science','Biology']],
  [130448, 'University of Pennsylvania',            'Philadelphia',     'PA', 'https://www.upenn.edu',         63000, 0.07, 1460, 1560, 25000, ['Business','Engineering','Medicine & Health','Humanities','Social Sciences']],
  [217156, 'Brown University',                      'Providence',       'RI', 'https://www.brown.edu',         62000, 0.07, 1440, 1550, 10000, ['Social Sciences','Humanities','Computer Science','Biology','Engineering']],
  [182670, 'Dartmouth College',                     'Hanover',          'NH', 'https://www.dartmouth.edu',     61000, 0.07, 1440, 1560,  6600, ['Social Sciences','Humanities','Engineering','Business','Mathematics']],
  [190415, 'Cornell University',                    'Ithaca',           'NY', 'https://www.cornell.edu',       62000, 0.09, 1400, 1540, 25000, ['Engineering','Computer Science','Humanities','Business','Biology']],
  [221999, 'Vanderbilt University',                 'Nashville',        'TN', 'https://www.vanderbilt.edu',    58000, 0.07, 1450, 1560, 13000, ['Medicine & Health','Engineering','Social Sciences','Business','Humanities']],
  [227757, 'Rice University',                       'Houston',          'TX', 'https://www.rice.edu',          52000, 0.11, 1490, 1580,  4100, ['Engineering','Computer Science','Mathematics','Social Sciences','Humanities']],
  [152080, 'University of Notre Dame',              'Notre Dame',       'IN', 'https://www.nd.edu',            57000, 0.15, 1430, 1540, 12600, ['Business','Engineering','Humanities','Social Sciences','Law']],
  [131496, 'Georgetown University',                 'Washington',       'DC', 'https://www.georgetown.edu',    57000, 0.12, 1380, 1540, 19000, ['Business','Law','Social Sciences','Humanities','Medicine & Health']],
  [139658, 'Emory University',                      'Atlanta',          'GA', 'https://www.emory.edu',         55000, 0.15, 1400, 1530, 15000, ['Medicine & Health','Business','Biology','Social Sciences','Humanities']],
  [211440, 'Carnegie Mellon University',            'Pittsburgh',       'PA', 'https://www.cmu.edu',           58000, 0.14, 1480, 1580, 14000, ['Computer Science','Engineering','Business','Mathematics','Humanities']],
  [179867, 'Washington University in St. Louis',    'St. Louis',        'MO', 'https://www.wustl.edu',         58000, 0.13, 1470, 1560, 15000, ['Medicine & Health','Engineering','Business','Social Sciences','Humanities']],
  [110635, 'University of California, Berkeley',    'Berkeley',         'CA', 'https://www.berkeley.edu',      44000, 0.17, 1300, 1530, 43000, ['Engineering','Computer Science','Business','Social Sciences','Biology']],
  [110662, 'University of California, Los Angeles', 'Los Angeles',      'CA', 'https://www.ucla.edu',          44000, 0.14, 1290, 1510, 46000, ['Engineering','Computer Science','Social Sciences','Medicine & Health','Business']],
  [170976, 'University of Michigan',                'Ann Arbor',        'MI', 'https://www.umich.edu',         51000, 0.20, 1360, 1530, 47000, ['Engineering','Business','Computer Science','Social Sciences','Medicine & Health']],
  [193900, 'New York University',                   'New York',         'NY', 'https://www.nyu.edu',           58000, 0.21, 1310, 1510, 58000, ['Business','Humanities','Social Sciences','Computer Science','Medicine & Health']],
  [234076, 'University of Virginia',                'Charlottesville',  'VA', 'https://www.virginia.edu',      52000, 0.21, 1360, 1510, 25000, ['Business','Engineering','Social Sciences','Humanities','Law']],
  [123961, 'University of Southern California',     'Los Angeles',      'CA', 'https://www.usc.edu',           62000, 0.13, 1400, 1530, 49000, ['Engineering','Business','Computer Science','Social Sciences','Humanities']],
  [164988, 'Boston University',                     'Boston',           'MA', 'https://www.bu.edu',            58000, 0.19, 1350, 1510, 36000, ['Engineering','Business','Social Sciences','Medicine & Health','Humanities']],
  [167358, 'Northeastern University',               'Boston',           'MA', 'https://www.northeastern.edu',  58000, 0.18, 1430, 1560, 25000, ['Engineering','Computer Science','Business','Social Sciences','Medicine & Health']],
  [168148, 'Tufts University',                      'Medford',          'MA', 'https://www.tufts.edu',         61000, 0.13, 1420, 1540, 12000, ['Engineering','Social Sciences','Humanities','Medicine & Health','Computer Science']],
  [228778, 'University of Texas at Austin',         'Austin',           'TX', 'https://www.utexas.edu',        40000, 0.31, 1250, 1480, 51000, ['Engineering','Computer Science','Business','Social Sciences','Humanities']],
  [139755, 'Georgia Institute of Technology',       'Atlanta',          'GA', 'https://www.gatech.edu',        32000, 0.21, 1400, 1540, 39000, ['Engineering','Computer Science','Mathematics','Business','Physics']],
  [145637, 'University of Illinois Urbana-Champaign','Champaign',       'IL', 'https://www.illinois.edu',      33000, 0.45, 1310, 1500, 55000, ['Engineering','Computer Science','Business','Social Sciences','Mathematics']],
  [243780, 'Purdue University',                     'West Lafayette',   'IN', 'https://www.purdue.edu',        28000, 0.67, 1220, 1440, 50000, ['Engineering','Computer Science','Mathematics','Business','Biology']],
  [240444, 'University of Wisconsin-Madison',       'Madison',          'WI', 'https://www.wisc.edu',          38000, 0.57, 1290, 1470, 47000, ['Engineering','Business','Social Sciences','Biology','Humanities']],
  [199120, 'University of North Carolina at Chapel Hill','Chapel Hill', 'NC', 'https://www.unc.edu',           37000, 0.23, 1300, 1490, 30000, ['Medicine & Health','Business','Social Sciences','Humanities','Engineering']],
  [236948, 'University of Washington',              'Seattle',          'WA', 'https://www.washington.edu',    38000, 0.52, 1260, 1480, 47000, ['Computer Science','Engineering','Medicine & Health','Business','Social Sciences']],
  [214777, 'Pennsylvania State University',         'University Park',  'PA', 'https://www.psu.edu',           34000, 0.55, 1200, 1400, 47000, ['Engineering','Business','Social Sciences','Computer Science','Biology']],
  [204796, 'Ohio State University',                 'Columbus',         'OH', 'https://www.osu.edu',           32000, 0.57, 1230, 1430, 61000, ['Engineering','Business','Medicine & Health','Social Sciences','Computer Science']],
  [134130, 'University of Florida',                 'Gainesville',      'FL', 'https://www.ufl.edu',           28000, 0.31, 1280, 1460, 52000, ['Engineering','Business','Social Sciences','Medicine & Health','Computer Science']],
  [139940, 'University of Georgia',                 'Athens',           'GA', 'https://www.uga.edu',           30000, 0.45, 1240, 1430, 40000, ['Business','Social Sciences','Engineering','Biology','Humanities']],
  [171100, 'University of Minnesota',               'Minneapolis',      'MN', 'https://www.umn.edu',           33000, 0.77, 1240, 1450, 51000, ['Engineering','Computer Science','Business','Medicine & Health','Social Sciences']],
  [151351, 'Indiana University Bloomington',        'Bloomington',      'IN', 'https://www.indiana.edu',       37000, 0.83, 1150, 1370, 43000, ['Business','Social Sciences','Humanities','Computer Science','Medicine & Health']],
  [126614, 'University of Colorado Boulder',        'Boulder',          'CO', 'https://www.colorado.edu',      37000, 0.85, 1200, 1400, 35000, ['Engineering','Computer Science','Business','Social Sciences','Biology']],
  [104179, 'University of Arizona',                 'Tucson',           'AZ', 'https://www.arizona.edu',       31000, 0.85, 1130, 1350, 47000, ['Engineering','Business','Social Sciences','Computer Science','Medicine & Health']],
  [104151, 'Arizona State University',              'Tempe',            'AZ', 'https://www.asu.edu',           31000, 0.91, 1100, 1340, 73000, ['Engineering','Business','Computer Science','Social Sciences','Humanities']],
  [171128, 'Michigan State University',             'East Lansing',     'MI', 'https://www.msu.edu',           40000, 0.83, 1160, 1380, 50000, ['Engineering','Business','Social Sciences','Computer Science','Biology']],
  [163286, 'University of Maryland',                'College Park',     'MD', 'https://www.umd.edu',           36000, 0.51, 1310, 1490, 40000, ['Engineering','Computer Science','Business','Social Sciences','Mathematics']],
  [186380, 'Rutgers University',                    'New Brunswick',    'NJ', 'https://www.rutgers.edu',       32000, 0.68, 1210, 1410, 50000, ['Engineering','Business','Social Sciences','Medicine & Health','Computer Science']],
  [164924, 'Boston College',                        'Chestnut Hill',    'MA', 'https://www.bc.edu',            60000, 0.23, 1400, 1520, 14000, ['Business','Social Sciences','Humanities','Engineering','Biology']],
  [239105, 'Wake Forest University',                'Winston-Salem',    'NC', 'https://www.wfu.edu',           60000, 0.25, 1380, 1510,  8800, ['Business','Social Sciences','Humanities','Biology','Law']],
  [211158, 'Case Western Reserve University',       'Cleveland',        'OH', 'https://www.case.edu',          56000, 0.30, 1400, 1540, 12000, ['Engineering','Medicine & Health','Computer Science','Biology','Social Sciences']],
  [159391, 'Tulane University',                     'New Orleans',      'LA', 'https://www.tulane.edu',        59000, 0.17, 1340, 1510, 14000, ['Business','Social Sciences','Medicine & Health','Humanities','Engineering']],
  [232566, 'University of Rochester',               'Rochester',        'NY', 'https://www.rochester.edu',     60000, 0.35, 1380, 1530, 12000, ['Engineering','Computer Science','Medicine & Health','Social Sciences','Humanities']],
  [168218, 'Brandeis University',                   'Waltham',          'MA', 'https://www.brandeis.edu',      59000, 0.37, 1340, 1510,  5800, ['Social Sciences','Humanities','Biology','Computer Science','Psychology']],
  [110680, 'University of California, San Diego',   'La Jolla',         'CA', 'https://www.ucsd.edu',          43000, 0.34, 1290, 1510, 38000, ['Computer Science','Engineering','Biology','Mathematics','Social Sciences']],
  [110644, 'University of California, Davis',       'Davis',            'CA', 'https://www.ucdavis.edu',       44000, 0.49, 1200, 1440, 39000, ['Engineering','Biology','Social Sciences','Computer Science','Mathematics']],
  [110705, 'University of California, Santa Barbara','Santa Barbara',   'CA', 'https://www.ucsb.edu',          43000, 0.37, 1260, 1470, 26000, ['Engineering','Computer Science','Social Sciences','Biology','Physics']],
  [110617, 'University of California, Irvine',      'Irvine',           'CA', 'https://www.uci.edu',           43000, 0.26, 1200, 1430, 36000, ['Computer Science','Engineering','Social Sciences','Biology','Business']],
];

async function seedTopUS() {
  console.log('\n── Top US: Curated dataset ─────────────────────');

  const rows = TOP_US.map(([id, name, city, state, website, tuition, acceptance, sat_min, sat_max, size, majors]) => ({
    id: `usa-${id}`,
    name,
    country: 'USA',
    city,
    state,
    website,
    majors,
    degrees: ['Bachelor', 'Master', 'PhD'],
    sat_min,
    sat_max,
    acceptance_rate: acceptance,
    tuition_estimate: tuition,
    intl_aid: 'unknown',
    tags: ['private', 'urban'],
    brief_description: `${name} is a leading university in ${city}, ${state}.`,
    student_size: size,
  }));

  const { error } = await supabase.from('universities').upsert(rows, { onConflict: 'id' });
  if (error) console.error('Top US insert error:', error.message);
  else console.log(`  Done: ${rows.length} top US universities`);
}

async function seedUS() {
  console.log('\n── US: College Scorecard (all schools) ────────');
  let page = 0;
  let totalInserted = 0;

  while (true) {
    const url =
      `https://api.data.gov/ed/collegescorecard/v1/schools.json` +
      `?api_key=${SCORECARD_API_KEY}` +
      `&fields=${SC_FIELDS}` +
      `&per_page=100&page=${page}` +
      `&school.degrees_awarded.predominant=3` +  // bachelor's-predominant
      `&school.operating=1`;                      // currently operating

    let data;
    try {
      const res = await fetch(url);
      data = await res.json();
    } catch (e) {
      console.error('Fetch error:', e.message);
      break;
    }

    const results = data.results ?? [];
    if (results.length === 0) break;

    const rows = results
      .filter(s => s['school.name'] && s['school.city'])
      .map(transformUS);

    if (rows.length) {
      const { error } = await supabase.from('universities').upsert(rows, { onConflict: 'id' });
      if (error) console.error(`  Page ${page} error:`, error.message);
      else {
        totalInserted += rows.length;
        process.stdout.write(`\r  Inserted ${totalInserted} US universities…`);
      }
    }

    page++;
    if (page > 100) break; // safety cap (100 pages × 100 = up to 10,000 records)
    await new Promise(r => setTimeout(r, 150)); // rate-limit buffer
  }

  console.log(`\n  Done: ${totalInserted} US universities`);
}

// ─── UK universities ───────────────────────────────────────────────────────────

// Tuition figures are approximate USD/year for international undergrads (2024/25 GBP fees × ~1.27).
// Source: each university's official international fees page.
const UK_UNIVERSITIES = [
  // [name, city, region, website, tuition_usd, acceptance_rate, sat_min, sat_max, intl_aid, tags, size, majors]
  ['University of Oxford',                    'Oxford',       'England',          'https://www.ox.ac.uk',           59000, 0.17, 1380, 1560, 'yes',     ['private','urban'],    24000, ['Humanities','Law','Medicine & Health','Social Sciences','Mathematics']],
  ['University of Cambridge',                 'Cambridge',    'England',          'https://www.cam.ac.uk',          60000, 0.18, 1380, 1560, 'yes',     ['private','suburban'], 24000, ['Mathematics','Engineering','Computer Science','Medicine & Health','Humanities']],
  ['Imperial College London',                 'London',       'England',          'https://www.imperial.ac.uk',     51000, 0.14, 1360, 1540, 'yes',     ['private','urban'],    19000, ['Engineering','Computer Science','Physics','Mathematics','Medicine & Health']],
  ['University College London',               'London',       'England',          'https://www.ucl.ac.uk',          41000, 0.63, 1280, 1480, 'unknown', ['private','urban'],    44000, ['Medicine & Health','Engineering','Law','Social Sciences','Psychology']],
  ["King's College London",                   'London',       'England',          'https://www.kcl.ac.uk',          40000, 0.55, 1240, 1440, 'unknown', ['private','urban'],    35000, ['Medicine & Health','Law','Humanities','Social Sciences','Business']],
  ['London School of Economics',              'London',       'England',          'https://www.lse.ac.uk',          39000, 0.16, 1300, 1520, 'unknown', ['private','urban'],    12000, ['Business','Social Sciences','Law','Mathematics','Economics']],
  ['University of Edinburgh',                 'Edinburgh',    'Scotland',         'https://www.ed.ac.uk',           37000, 0.44, 1260, 1460, 'unknown', ['public','urban'],     40000, ['Medicine & Health','Engineering','Business','Social Sciences','Humanities']],
  ['University of Manchester',                'Manchester',   'England',          'https://www.manchester.ac.uk',   37000, 0.59, 1220, 1420, 'unknown', ['public','urban'],     45000, ['Engineering','Computer Science','Business','Medicine & Health','Social Sciences']],
  ['University of Bristol',                   'Bristol',      'England',          'https://www.bristol.ac.uk',      36000, 0.54, 1240, 1440, 'unknown', ['public','urban'],     28000, ['Engineering','Social Sciences','Biology','Law','Mathematics']],
  ['University of Warwick',                   'Coventry',     'England',          'https://warwick.ac.uk',          37000, 0.13, 1280, 1500, 'unknown', ['public','suburban'],  27000, ['Business','Mathematics','Computer Science','Engineering','Social Sciences']],
  ['University of Glasgow',                   'Glasgow',      'Scotland',         'https://www.gla.ac.uk',          32000, 0.66, 1200, 1400, 'unknown', ['public','urban'],     36000, ['Medicine & Health','Engineering','Business','Law','Social Sciences']],
  ['University of Leeds',                     'Leeds',        'England',          'https://www.leeds.ac.uk',        33000, 0.72, 1180, 1380, 'unknown', ['public','urban'],     38000, ['Business','Engineering','Social Sciences','Medicine & Health','Computer Science']],
  ['University of Birmingham',                'Birmingham',   'England',          'https://www.birmingham.ac.uk',   34000, 0.69, 1180, 1380, 'unknown', ['public','urban'],     36000, ['Engineering','Medicine & Health','Business','Computer Science','Social Sciences']],
  ['University of Southampton',               'Southampton',  'England',          'https://www.southampton.ac.uk',  32000, 0.72, 1180, 1380, 'unknown', ['public','urban'],     27000, ['Engineering','Computer Science','Medicine & Health','Physics','Mathematics']],
  ['University of Sheffield',                 'Sheffield',    'England',          'https://www.sheffield.ac.uk',    32000, 0.75, 1160, 1360, 'unknown', ['public','urban'],     30000, ['Engineering','Medicine & Health','Computer Science','Business','Social Sciences']],
  ['Durham University',                       'Durham',       'England',          'https://www.durham.ac.uk',       36000, 0.12, 1300, 1500, 'unknown', ['public','suburban'],  20000, ['Business','Social Sciences','Humanities','Law','Mathematics']],
  ['University of Nottingham',                'Nottingham',   'England',          'https://www.nottingham.ac.uk',   32000, 0.68, 1180, 1380, 'unknown', ['public','suburban'],  34000, ['Medicine & Health','Engineering','Business','Computer Science','Biology']],
  ['University of York',                      'York',         'England',          'https://www.york.ac.uk',         31000, 0.71, 1180, 1380, 'unknown', ['public','suburban'],  20000, ['Computer Science','Psychology','Social Sciences','Humanities','Biology']],
  ['University of Bath',                      'Bath',         'England',          'https://www.bath.ac.uk',         33000, 0.17, 1280, 1480, 'unknown', ['public','urban'],     18000, ['Engineering','Business','Computer Science','Mathematics','Social Sciences']],
  ['University of Exeter',                    'Exeter',       'England',          'https://www.exeter.ac.uk',       32000, 0.68, 1200, 1400, 'unknown', ['public','suburban'],  27000, ['Business','Social Sciences','Law','Humanities','Biology']],
  ['University of Liverpool',                 'Liverpool',    'England',          'https://www.liverpool.ac.uk',    32000, 0.73, 1160, 1360, 'unknown', ['public','urban'],     26000, ['Medicine & Health','Engineering','Business','Law','Social Sciences']],
  ['Queen Mary University of London',         'London',       'England',          'https://www.qmul.ac.uk',         32000, 0.62, 1180, 1380, 'unknown', ['public','urban'],     27000, ['Medicine & Health','Engineering','Law','Business','Computer Science']],
  ['Lancaster University',                    'Lancaster',    'England',          'https://www.lancaster.ac.uk',    30000, 0.74, 1160, 1360, 'unknown', ['public','suburban'],  15000, ['Business','Computer Science','Social Sciences','Psychology','Mathematics']],
  ['Cardiff University',                      'Cardiff',      'Wales',            'https://www.cardiff.ac.uk',      31000, 0.76, 1140, 1340, 'unknown', ['public','urban'],     32000, ['Engineering','Medicine & Health','Law','Business','Social Sciences']],
  ['Newcastle University',                    'Newcastle',    'England',          'https://www.ncl.ac.uk',          34000, 0.72, 1160, 1360, 'unknown', ['public','urban'],     27000, ['Medicine & Health','Engineering','Computer Science','Business','Social Sciences']],
  ['University of St Andrews',                'St Andrews',   'Scotland',         'https://www.st-andrews.ac.uk',   37000, 0.08, 1320, 1520, 'unknown', ['public','suburban'],  10000, ['Physics','Mathematics','Computer Science','Humanities','Social Sciences']],
  ['London School of Hygiene & Tropical Medicine','London',   'England',          'https://www.lshtm.ac.uk',        27000, 0.30, 1260, 1460, 'unknown', ['public','urban'],      5000, ['Medicine & Health','Biology','Social Sciences']],
  ['University of Reading',                   'Reading',      'England',          'https://www.reading.ac.uk',      29000, 0.78, 1120, 1320, 'unknown', ['public','suburban'],  20000, ['Business','Social Sciences','Engineering','Biology','Psychology']],
  ['University of East Anglia',               'Norwich',      'England',          'https://www.uea.ac.uk',          28000, 0.80, 1100, 1300, 'unknown', ['public','suburban'],  17000, ['Social Sciences','Biology','Humanities','Medicine & Health','Business']],
  ['University of Leicester',                 'Leicester',    'England',          'https://www.le.ac.uk',           29000, 0.78, 1120, 1320, 'unknown', ['public','urban'],     18000, ['Medicine & Health','Biology','Engineering','Social Sciences','Business']],
  ['University of Sussex',                    'Brighton',     'England',          'https://www.sussex.ac.uk',       29000, 0.79, 1100, 1300, 'unknown', ['public','urban'],     20000, ['Social Sciences','Psychology','Business','Humanities','Computer Science']],
  ['Loughborough University',                 'Loughborough', 'England',          'https://www.lboro.ac.uk',        32000, 0.54, 1200, 1400, 'unknown', ['public','suburban'],  18000, ['Engineering','Computer Science','Business','Mathematics','Social Sciences']],
  ['University of Aberdeen',                  'Aberdeen',     'Scotland',         'https://www.abdn.ac.uk',         28000, 0.75, 1120, 1320, 'unknown', ['public','urban'],     15000, ['Medicine & Health','Engineering','Business','Law','Social Sciences']],
  ['University of Dundee',                    'Dundee',       'Scotland',         'https://www.dundee.ac.uk',       28000, 0.76, 1120, 1320, 'unknown', ['public','urban'],     17000, ['Medicine & Health','Engineering','Computer Science','Social Sciences','Law']],
  ['University of Strathclyde',               'Glasgow',      'Scotland',         'https://www.strath.ac.uk',       30000, 0.74, 1140, 1340, 'unknown', ['public','urban'],     23000, ['Engineering','Computer Science','Business','Medicine & Health','Social Sciences']],
  ['Heriot-Watt University',                  'Edinburgh',    'Scotland',         'https://www.hw.ac.uk',           25000, 0.80, 1100, 1300, 'unknown', ['public','urban'],     10000, ['Engineering','Computer Science','Mathematics','Business','Physics']],
  ['University of Stirling',                  'Stirling',     'Scotland',         'https://www.stir.ac.uk',         24000, 0.85, 1060, 1260, 'unknown', ['public','suburban'],  13000, ['Business','Psychology','Social Sciences','Medicine & Health','Humanities']],
  ['Swansea University',                      'Swansea',      'Wales',            'https://www.swansea.ac.uk',      26000, 0.82, 1080, 1280, 'unknown', ['public','urban'],     22000, ['Engineering','Computer Science','Medicine & Health','Business','Social Sciences']],
  ['Bangor University',                       'Bangor',       'Wales',            'https://www.bangor.ac.uk',       23000, 0.86, 1020, 1220, 'unknown', ['public','suburban'],  10000, ['Biology','Psychology','Social Sciences','Humanities','Business']],
  ['University of Surrey',                    'Guildford',    'England',          'https://www.surrey.ac.uk',       30000, 0.72, 1160, 1360, 'unknown', ['public','suburban'],  16000, ['Engineering','Computer Science','Business','Mathematics','Social Sciences']],
  ['University of Kent',                      'Canterbury',   'England',          'https://www.kent.ac.uk',         27000, 0.80, 1080, 1280, 'unknown', ['public','suburban'],  20000, ['Computer Science','Social Sciences','Law','Psychology','Business']],
  ['University of Essex',                     'Colchester',   'England',          'https://www.essex.ac.uk',        25000, 0.82, 1060, 1260, 'unknown', ['public','suburban'],  15000, ['Social Sciences','Computer Science','Psychology','Business','Mathematics']],
  ['Brunel University London',                'London',       'England',          'https://www.brunel.ac.uk',       27000, 0.76, 1100, 1300, 'unknown', ['public','suburban'],  14000, ['Engineering','Computer Science','Business','Social Sciences','Mathematics']],
  ['City, University of London',              'London',       'England',          'https://www.city.ac.uk',         29000, 0.74, 1120, 1320, 'unknown', ['public','urban'],     20000, ['Business','Law','Computer Science','Engineering','Social Sciences']],
  ['University of Hull',                      'Hull',         'England',          'https://www.hull.ac.uk',         24000, 0.88, 1040, 1240, 'no',      ['public','urban'],     16000, ['Business','Social Sciences','Humanities','Law','Computer Science']],
  ['Keele University',                        'Keele',        'England',          'https://www.keele.ac.uk',        25000, 0.84, 1060, 1260, 'unknown', ['public','rural'],     10000, ['Medicine & Health','Social Sciences','Business','Humanities','Biology']],
  ['University of Lincoln',                   'Lincoln',      'England',          'https://www.lincoln.ac.uk',      23000, 0.88, 1020, 1220, 'unknown', ['public','urban'],     16000, ['Business','Computer Science','Engineering','Social Sciences','Humanities']],
  ['Coventry University',                     'Coventry',     'England',          'https://www.coventry.ac.uk',     22000, 0.90, 1000, 1200, 'unknown', ['public','urban'],     30000, ['Engineering','Business','Computer Science','Social Sciences','Humanities']],
  ['Aston University',                        'Birmingham',   'England',          'https://www.aston.ac.uk',        27000, 0.78, 1100, 1300, 'unknown', ['public','urban'],     14000, ['Business','Engineering','Computer Science','Biology','Social Sciences']],
  ['University of Plymouth',                  'Plymouth',     'England',          'https://www.plymouth.ac.uk',     23000, 0.84, 1040, 1240, 'unknown', ['public','urban'],     18000, ['Engineering','Biology','Business','Computer Science','Social Sciences']],
  ['University of Portsmouth',                'Portsmouth',   'England',          'https://www.port.ac.uk',         23000, 0.86, 1020, 1220, 'unknown', ['public','urban'],     23000, ['Business','Computer Science','Engineering','Social Sciences','Humanities']],
  ['Oxford Brookes University',               'Oxford',       'England',          'https://www.brookes.ac.uk',      23000, 0.82, 1040, 1240, 'unknown', ['public','urban'],     17000, ['Business','Engineering','Computer Science','Social Sciences','Humanities']],
  ['University of the Arts London',           'London',       'England',          'https://www.arts.ac.uk',         37000, 0.55, 1100, 1300, 'unknown', ['public','urban'],     22000, ['Humanities','Liberal Arts']],
  ['Goldsmiths, University of London',        'London',       'England',          'https://www.gold.ac.uk',         26000, 0.72, 1100, 1300, 'unknown', ['public','urban'],     10000, ['Humanities','Liberal Arts','Social Sciences','Computer Science','Psychology']],
  ['Royal Holloway, University of London',    'Egham',        'England',          'https://www.royalholloway.ac.uk',28000, 0.70, 1120, 1320, 'unknown', ['public','suburban'],  11000, ['Computer Science','Humanities','Business','Psychology','Social Sciences']],
  ['Birkbeck, University of London',          'London',       'England',          'https://www.bbk.ac.uk',          23000, 0.80, 1060, 1260, 'unknown', ['public','urban'],     18000, ['Business','Social Sciences','Humanities','Computer Science','Law']],
  ['SOAS University of London',               'London',       'England',          'https://www.soas.ac.uk',         30000, 0.62, 1160, 1360, 'unknown', ['public','urban'],      6000, ['Social Sciences','Humanities','Law','Business','Psychology']],
  ['University of Salford',                   'Salford',      'England',          'https://www.salford.ac.uk',      21000, 0.88, 1000, 1200, 'unknown', ['public','urban'],     21000, ['Engineering','Computer Science','Business','Social Sciences','Humanities']],
  ['Manchester Metropolitan University',      'Manchester',   'England',          'https://www.mmu.ac.uk',          21000, 0.88, 1000, 1200, 'unknown', ['public','urban'],     38000, ['Business','Computer Science','Engineering','Social Sciences','Humanities']],
  ['Leeds Beckett University',                'Leeds',        'England',          'https://www.leedsbeckett.ac.uk', 19000, 0.92,  960, 1160, 'unknown', ['public','urban'],     30000, ['Business','Social Sciences','Humanities','Computer Science','Engineering']],
  ['Sheffield Hallam University',             'Sheffield',    'England',          'https://www.shu.ac.uk',          20000, 0.90,  980, 1180, 'unknown', ['public','urban'],     35000, ['Business','Engineering','Computer Science','Social Sciences','Humanities']],
  ['University of Brighton',                  'Brighton',     'England',          'https://www.brighton.ac.uk',     21000, 0.88, 1000, 1200, 'unknown', ['public','urban'],     22000, ['Engineering','Computer Science','Business','Social Sciences','Humanities']],
  ['University of Hertfordshire',             'Hatfield',     'England',          'https://www.herts.ac.uk',        20000, 0.90,  980, 1180, 'unknown', ['public','suburban'],  25000, ['Business','Computer Science','Engineering','Social Sciences','Mathematics']],
  ['Nottingham Trent University',             'Nottingham',   'England',          'https://www.ntu.ac.uk',          21000, 0.88, 1000, 1200, 'unknown', ['public','urban'],     38000, ['Business','Computer Science','Engineering','Social Sciences','Humanities']],
  ['University of Huddersfield',              'Huddersfield', 'England',          'https://www.hud.ac.uk',          20000, 0.90,  960, 1160, 'unknown', ['public','urban'],     20000, ['Engineering','Computer Science','Business','Social Sciences','Humanities']],
  ['University of the West of England',       'Bristol',      'England',          'https://www.uwe.ac.uk',          21000, 0.88,  980, 1180, 'unknown', ['public','suburban'],  30000, ['Engineering','Computer Science','Business','Social Sciences','Humanities']],
  ['De Montfort University',                  'Leicester',    'England',          'https://www.dmu.ac.uk',          20000, 0.91,  960, 1160, 'unknown', ['public','urban'],     26000, ['Computer Science','Engineering','Business','Humanities','Social Sciences']],
  ['University of Central Lancashire',        'Preston',      'England',          'https://www.uclan.ac.uk',        20000, 0.92,  940, 1140, 'unknown', ['public','urban'],     35000, ['Business','Computer Science','Engineering','Social Sciences','Medicine & Health']],
  ['University of Sunderland',                'Sunderland',   'England',          'https://www.sunderland.ac.uk',   18000, 0.94,  920, 1120, 'unknown', ['public','urban'],     18000, ['Business','Engineering','Computer Science','Social Sciences','Humanities']],
  ['University of Northumbria',               'Newcastle',    'England',          'https://www.northumbria.ac.uk',  21000, 0.88,  980, 1180, 'unknown', ['public','urban'],     34000, ['Business','Computer Science','Engineering','Social Sciences','Humanities']],
  ['Robert Gordon University',                'Aberdeen',     'Scotland',         'https://www.rgu.ac.uk',          21000, 0.88, 1000, 1200, 'unknown', ['public','urban'],     16000, ['Engineering','Computer Science','Business','Medicine & Health','Social Sciences']],
  ['Edinburgh Napier University',             'Edinburgh',    'Scotland',         'https://www.napier.ac.uk',       19000, 0.90,  960, 1160, 'unknown', ['public','urban'],     20000, ['Computer Science','Business','Engineering','Social Sciences','Humanities']],
  ['Glasgow Caledonian University',           'Glasgow',      'Scotland',         'https://www.gcu.ac.uk',          19000, 0.90,  960, 1160, 'unknown', ['public','urban'],     20000, ['Business','Engineering','Computer Science','Medicine & Health','Social Sciences']],
  ["Queen's University Belfast",              'Belfast',      'Northern Ireland', 'https://www.qub.ac.uk',          28000, 0.74, 1160, 1360, 'unknown', ['public','urban'],     24000, ['Medicine & Health','Engineering','Business','Law','Computer Science']],
  ['Ulster University',                       'Coleraine',    'Northern Ireland', 'https://www.ulster.ac.uk',       21000, 0.90,  960, 1160, 'unknown', ['public','suburban'],  28000, ['Business','Engineering','Computer Science','Medicine & Health','Social Sciences']],
];

const UK_MAJOR_POOLS = [
  ['Computer Science', 'Data Science', 'Mathematics'],
  ['Business', 'Economics', 'Finance'],
  ['Engineering', 'Physics', 'Mathematics'],
  ['Biology', 'Medicine & Health', 'Chemistry'],
  ['Psychology', 'Social Sciences', 'Political Science'],
  ['Law', 'Humanities', 'Politics'],
  ['Computer Science', 'Engineering', 'Business'],
];

async function seedUK() {
  console.log('\n── UK: Curated dataset ─────────────────────────');

  const rows = UK_UNIVERSITIES.map(([name, city, state, website, tuition, acceptance, sat_min, sat_max, intl_aid, tags, size, majors], i) => ({
    id: `uk-${i + 1}`,
    name,
    country: 'UK',
    city,
    state,
    website,
    majors,
    degrees: ['Bachelor', 'Master', 'PhD'],
    sat_min,
    sat_max,
    acceptance_rate: acceptance,
    tuition_estimate: tuition,
    intl_aid,
    tags,
    brief_description: `${name} is a leading ${tags.includes('public') ? 'public' : 'private'} university in ${city}, ${state}.`,
    student_size: size,
  }));

  const { error } = await supabase.from('universities').upsert(rows, { onConflict: 'id' });
  if (error) console.error('UK insert error:', error.message);
  else console.log(`  Done: ${rows.length} UK universities`);
}

// ─── EU universities ───────────────────────────────────────────────────────────
// Tuition = approximate USD/yr for international (non-EU) undergrads.
// SAT ranges are selectivity proxies (EU schools don't use SAT).

const EU_UNIVERSITIES = [
  // [name, city, country/region, website, tuition_usd, acceptance_rate, sat_min, sat_max, intl_aid, tags, size, majors]
  // Germany
  ['Technical University of Munich', 'Munich', 'Germany', 'https://www.tum.de', 7500, 0.08, 1340, 1520, 'yes', ['public', 'urban'], 50000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Business']],
  ['Ludwig Maximilian University Munich', 'Munich', 'Germany', 'https://www.lmu.de', 3000, 0.15, 1260, 1460, 'unknown', ['public', 'urban'], 53000, ['Medicine & Health', 'Law', 'Humanities', 'Social Sciences', 'Biology']],
  ['Heidelberg University', 'Heidelberg', 'Germany', 'https://www.uni-heidelberg.de', 3000, 0.20, 1240, 1440, 'unknown', ['public', 'suburban'], 31000, ['Medicine & Health', 'Biology', 'Chemistry', 'Humanities', 'Social Sciences']],
  ['RWTH Aachen University', 'Aachen', 'Germany', 'https://www.rwth-aachen.de', 3000, 0.12, 1300, 1480, 'unknown', ['public', 'urban'], 47000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Business']],
  ['Humboldt University Berlin', 'Berlin', 'Germany', 'https://www.hu-berlin.de', 2500, 0.25, 1200, 1400, 'unknown', ['public', 'urban'], 39000, ['Humanities', 'Social Sciences', 'Law', 'Medicine & Health', 'Biology']],
  ['Free University Berlin', 'Berlin', 'Germany', 'https://www.fu-berlin.de', 2500, 0.30, 1180, 1380, 'unknown', ['public', 'urban'], 38000, ['Social Sciences', 'Humanities', 'Political Science', 'Biology', 'Psychology']],
  ['TU Berlin', 'Berlin', 'Germany', 'https://www.tu-berlin.de', 3000, 0.18, 1280, 1460, 'unknown', ['public', 'urban'], 34000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Business']],
  ['University of Hamburg', 'Hamburg', 'Germany', 'https://www.uni-hamburg.de', 2500, 0.35, 1160, 1360, 'unknown', ['public', 'urban'], 44000, ['Business', 'Law', 'Humanities', 'Social Sciences', 'Biology']],
  // France
  ['École Polytechnique', 'Palaiseau', 'France', 'https://www.polytechnique.edu', 15000, 0.05, 1400, 1560, 'yes', ['public', 'suburban'], 9000, ['Engineering', 'Mathematics', 'Physics', 'Computer Science', 'Economics']],
  ['Sciences Po Paris', 'Paris', 'France', 'https://www.sciencespo.fr', 18000, 0.10, 1320, 1520, 'yes', ['public', 'urban'], 14000, ['Political Science', 'Social Sciences', 'Law', 'Economics', 'International Relations']],
  ['HEC Paris', 'Jouy-en-Josas', 'France', 'https://www.hec.edu', 38000, 0.12, 1340, 1520, 'yes', ['private', 'suburban'], 4500, ['Business', 'Economics', 'Finance', 'Management', 'Marketing']],
  ['Sorbonne University', 'Paris', 'France', 'https://www.sorbonne-universite.fr', 4000, 0.40, 1200, 1400, 'unknown', ['public', 'urban'], 55000, ['Humanities', 'Medicine & Health', 'Biology', 'Chemistry', 'Social Sciences']],
  ['University of Paris-Saclay', 'Paris', 'France', 'https://www.universite-paris-saclay.fr', 4500, 0.25, 1260, 1460, 'unknown', ['public', 'suburban'], 48000, ['Engineering', 'Physics', 'Mathematics', 'Computer Science', 'Biology']],
  ['CentraleSupélec', 'Paris', 'France', 'https://www.centralesupelec.fr', 14000, 0.08, 1360, 1540, 'unknown', ['public', 'suburban'], 4700, ['Engineering', 'Mathematics', 'Computer Science', 'Physics', 'Data Science']],
  // Netherlands
  ['Delft University of Technology', 'Delft', 'Netherlands', 'https://www.tudelft.nl', 18000, 0.40, 1300, 1480, 'unknown', ['public', 'suburban'], 26000, ['Engineering', 'Computer Science', 'Architecture', 'Mathematics', 'Physics']],
  ['University of Amsterdam', 'Amsterdam', 'Netherlands', 'https://www.uva.nl', 15000, 0.55, 1240, 1440, 'unknown', ['public', 'urban'], 39000, ['Business', 'Social Sciences', 'Law', 'Humanities', 'Psychology']],
  ['Leiden University', 'Leiden', 'Netherlands', 'https://www.universiteitleiden.nl', 16000, 0.50, 1220, 1420, 'unknown', ['public', 'suburban'], 33000, ['Law', 'Social Sciences', 'Humanities', 'Medicine & Health', 'Biology']],
  ['Utrecht University', 'Utrecht', 'Netherlands', 'https://www.uu.nl', 15500, 0.55, 1220, 1420, 'unknown', ['public', 'urban'], 36000, ['Medicine & Health', 'Biology', 'Social Sciences', 'Humanities', 'Law']],
  ['Eindhoven University of Technology', 'Eindhoven', 'Netherlands', 'https://www.tue.nl', 17000, 0.35, 1280, 1460, 'unknown', ['public', 'suburban'], 14000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Data Science']],
  ['Erasmus University Rotterdam', 'Rotterdam', 'Netherlands', 'https://www.eur.nl', 14500, 0.58, 1200, 1400, 'unknown', ['public', 'urban'], 30000, ['Economics', 'Business', 'Law', 'Medicine & Health', 'Social Sciences']],
  // Sweden
  ['KTH Royal Institute of Technology', 'Stockholm', 'Sweden', 'https://www.kth.se', 19000, 0.30, 1300, 1480, 'yes', ['public', 'urban'], 19000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Architecture']],
  ['Stockholm University', 'Stockholm', 'Sweden', 'https://www.su.se', 17000, 0.50, 1220, 1420, 'unknown', ['public', 'urban'], 33000, ['Social Sciences', 'Humanities', 'Business', 'Law', 'Biology']],
  ['Uppsala University', 'Uppsala', 'Sweden', 'https://www.uu.se', 18000, 0.45, 1240, 1440, 'unknown', ['public', 'urban'], 52000, ['Medicine & Health', 'Biology', 'Humanities', 'Social Sciences', 'Law']],
  ['Lund University', 'Lund', 'Sweden', 'https://www.lu.se', 18500, 0.48, 1240, 1440, 'yes', ['public', 'suburban'], 47000, ['Engineering', 'Medicine & Health', 'Social Sciences', 'Law', 'Business']],
  ['Chalmers University of Technology', 'Gothenburg', 'Sweden', 'https://www.chalmers.se', 19000, 0.35, 1280, 1460, 'unknown', ['public', 'urban'], 13000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Architecture']],
  // Denmark
  ['Technical University of Denmark', 'Kongens Lyngby', 'Denmark', 'https://www.dtu.dk', 17000, 0.25, 1300, 1480, 'yes', ['public', 'suburban'], 12000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Data Science']],
  ['University of Copenhagen', 'Copenhagen', 'Denmark', 'https://www.ku.dk', 16000, 0.55, 1240, 1440, 'unknown', ['public', 'urban'], 40000, ['Medicine & Health', 'Biology', 'Humanities', 'Social Sciences', 'Law']],
  ['Aarhus University', 'Aarhus', 'Denmark', 'https://www.au.dk', 15000, 0.60, 1220, 1420, 'unknown', ['public', 'urban'], 45000, ['Business', 'Social Sciences', 'Humanities', 'Medicine & Health', 'Engineering']],
  // Belgium
  ['KU Leuven', 'Leuven', 'Belgium', 'https://www.kuleuven.be', 10000, 0.45, 1240, 1440, 'unknown', ['public', 'suburban'], 61000, ['Engineering', 'Medicine & Health', 'Law', 'Social Sciences', 'Business']],
  ['Ghent University', 'Ghent', 'Belgium', 'https://www.ugent.be', 8000, 0.55, 1200, 1400, 'unknown', ['public', 'urban'], 49000, ['Biology', 'Engineering', 'Medicine & Health', 'Social Sciences', 'Humanities']],
  // Switzerland (non-EU but commonly grouped)
  ['ETH Zurich', 'Zurich', 'Switzerland', 'https://www.ethz.ch', 5000, 0.08, 1380, 1560, 'yes', ['public', 'urban'], 24000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Data Science']],
  ['EPFL', 'Lausanne', 'Switzerland', 'https://www.epfl.ch', 5000, 0.12, 1360, 1540, 'yes', ['public', 'urban'], 12000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Architecture']],
  // Italy
  ['Politecnico di Milano', 'Milan', 'Italy', 'https://www.polimi.it', 12000, 0.35, 1260, 1460, 'unknown', ['public', 'urban'], 45000, ['Engineering', 'Architecture', 'Design', 'Computer Science', 'Mathematics']],
  ['Bocconi University', 'Milan', 'Italy', 'https://www.unibocconi.eu', 28000, 0.25, 1280, 1480, 'yes', ['private', 'urban'], 16000, ['Business', 'Economics', 'Finance', 'Law', 'Management']],
  ['University of Bologna', 'Bologna', 'Italy', 'https://www.unibo.it', 4000, 0.55, 1180, 1380, 'unknown', ['public', 'urban'], 87000, ['Law', 'Humanities', 'Medicine & Health', 'Engineering', 'Social Sciences']],
  ['Sapienza University of Rome', 'Rome', 'Italy', 'https://www.uniroma1.it', 3500, 0.60, 1160, 1360, 'unknown', ['public', 'urban'], 110000, ['Medicine & Health', 'Law', 'Humanities', 'Engineering', 'Social Sciences']],
  // Spain
  ['University of Barcelona', 'Barcelona', 'Spain', 'https://www.ub.edu', 6000, 0.60, 1180, 1380, 'unknown', ['public', 'urban'], 60000, ['Humanities', 'Social Sciences', 'Medicine & Health', 'Business', 'Law']],
  ['Polytechnic University of Catalonia', 'Barcelona', 'Spain', 'https://www.upc.edu', 5000, 0.40, 1240, 1440, 'unknown', ['public', 'urban'], 30000, ['Engineering', 'Computer Science', 'Mathematics', 'Architecture', 'Physics']],
  ['Autonomous University of Madrid', 'Madrid', 'Spain', 'https://www.uam.es', 5500, 0.55, 1180, 1380, 'unknown', ['public', 'suburban'], 35000, ['Social Sciences', 'Humanities', 'Law', 'Medicine & Health', 'Business']],
  // Finland
  ['Aalto University', 'Espoo', 'Finland', 'https://www.aalto.fi', 16000, 0.18, 1280, 1460, 'yes', ['public', 'suburban'], 20000, ['Engineering', 'Business', 'Design', 'Computer Science', 'Mathematics']],
  ['University of Helsinki', 'Helsinki', 'Finland', 'https://www.helsinki.fi', 15000, 0.40, 1220, 1420, 'unknown', ['public', 'urban'], 38000, ['Medicine & Health', 'Biology', 'Humanities', 'Social Sciences', 'Law']],
  // Austria
  ['TU Wien', 'Vienna', 'Austria', 'https://www.tuwien.at', 8000, 0.30, 1240, 1440, 'unknown', ['public', 'urban'], 30000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Architecture']],
  ['University of Vienna', 'Vienna', 'Austria', 'https://www.univie.ac.at', 7000, 0.50, 1180, 1380, 'unknown', ['public', 'urban'], 93000, ['Humanities', 'Social Sciences', 'Law', 'Medicine & Health', 'Biology']],
  // Norway (non-EU but Nordic)
  ['University of Oslo', 'Oslo', 'Norway', 'https://www.uio.no', 1000, 0.55, 1200, 1400, 'yes', ['public', 'urban'], 28000, ['Humanities', 'Social Sciences', 'Medicine & Health', 'Law', 'Biology']],
  // Czech Republic
  ['Charles University', 'Prague', 'Czech Republic', 'https://www.cuni.cz', 3000, 0.35, 1200, 1400, 'unknown', ['public', 'urban'], 51000, ['Medicine & Health', 'Law', 'Humanities', 'Social Sciences', 'Biology']],
  // Portugal
  ['University of Porto', 'Porto', 'Portugal', 'https://www.up.pt', 5000, 0.55, 1160, 1360, 'unknown', ['public', 'urban'], 34000, ['Engineering', 'Medicine & Health', 'Social Sciences', 'Business', 'Humanities']],
  ['University of Lisbon', 'Lisbon', 'Portugal', 'https://www.ulisboa.pt', 5000, 0.58, 1160, 1360, 'unknown', ['public', 'urban'], 49000, ['Medicine & Health', 'Law', 'Engineering', 'Humanities', 'Social Sciences']],
];

async function seedEU() {
  console.log('\n── EU: Curated dataset ─────────────────────────');

  const rows = EU_UNIVERSITIES.map(([name, city, state, website, tuition, acceptance, sat_min, sat_max, intl_aid, tags, size, majors], i) => ({
    id: `eu-${i + 1}`,
    name,
    country: 'EU',
    city,
    state,
    website,
    majors,
    degrees: ['Bachelor', 'Master', 'PhD'],
    sat_min,
    sat_max,
    acceptance_rate: acceptance,
    tuition_estimate: tuition,
    intl_aid,
    tags,
    brief_description: `${name} is a leading ${tags.includes('public') ? 'public' : 'private'} university in ${city}, ${state}.`,
    student_size: size,
  }));

  const { error } = await supabase.from('universities').upsert(rows, { onConflict: 'id' });
  if (error) console.error('EU insert error:', error.message);
  else console.log(`  Done: ${rows.length} EU universities`);
}

// ─── Chinese universities ──────────────────────────────────────────────────────
// Tuition = approximate USD/yr for international undergrads.
// SAT ranges are selectivity proxies.

const CHINA_UNIVERSITIES = [
  // [name, city, province, website, tuition_usd, acceptance_rate, sat_min, sat_max, intl_aid, tags, size, majors]
  ['Peking University', 'Beijing', 'Beijing', 'https://www.pku.edu.cn', 5500, 0.05, 1380, 1560, 'yes', ['public', 'urban'], 46000, ['Humanities', 'Law', 'Economics', 'Social Sciences', 'Biology']],
  ['Tsinghua University', 'Beijing', 'Beijing', 'https://www.tsinghua.edu.cn', 5500, 0.05, 1400, 1580, 'yes', ['public', 'suburban'], 47000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Architecture']],
  ['Fudan University', 'Shanghai', 'Shanghai', 'https://www.fudan.edu.cn', 5000, 0.08, 1340, 1520, 'yes', ['public', 'urban'], 34000, ['Medicine & Health', 'Economics', 'Humanities', 'Social Sciences', 'Biology']],
  ['Shanghai Jiao Tong University', 'Shanghai', 'Shanghai', 'https://www.sjtu.edu.cn', 4500, 0.10, 1320, 1500, 'yes', ['public', 'suburban'], 41000, ['Engineering', 'Computer Science', 'Medicine & Health', 'Physics', 'Mathematics']],
  ['Zhejiang University', 'Hangzhou', 'Zhejiang', 'https://www.zju.edu.cn', 4000, 0.10, 1300, 1480, 'yes', ['public', 'suburban'], 66000, ['Engineering', 'Computer Science', 'Medicine & Health', 'Agriculture', 'Business']],
  ['University of Science and Technology of China', 'Hefei', 'Anhui', 'https://www.ustc.edu.cn', 4000, 0.12, 1300, 1480, 'yes', ['public', 'suburban'], 16000, ['Physics', 'Mathematics', 'Computer Science', 'Engineering', 'Chemistry']],
  ['Nanjing University', 'Nanjing', 'Jiangsu', 'https://www.nju.edu.cn', 3800, 0.15, 1280, 1460, 'unknown', ['public', 'urban'], 36000, ['Humanities', 'Physics', 'Chemistry', 'Biology', 'Social Sciences']],
  ['Wuhan University', 'Wuhan', 'Hubei', 'https://www.whu.edu.cn', 3500, 0.25, 1240, 1440, 'unknown', ['public', 'urban'], 59000, ['Law', 'Business', 'Humanities', 'Engineering', 'Social Sciences']],
  ['Sun Yat-sen University', 'Guangzhou', 'Guangdong', 'https://www.sysu.edu.cn', 3500, 0.25, 1240, 1440, 'unknown', ['public', 'suburban'], 58000, ['Medicine & Health', 'Business', 'Law', 'Engineering', 'Social Sciences']],
  ['Tongji University', 'Shanghai', 'Shanghai', 'https://www.tongji.edu.cn', 4000, 0.30, 1220, 1420, 'unknown', ['public', 'urban'], 36000, ['Engineering', 'Architecture', 'Computer Science', 'Mathematics', 'Business']],
  ['Renmin University of China', 'Beijing', 'Beijing', 'https://www.ruc.edu.cn', 4000, 0.20, 1260, 1460, 'unknown', ['public', 'urban'], 28000, ['Economics', 'Business', 'Law', 'Social Sciences', 'Humanities']],
  ['Harbin Institute of Technology', 'Harbin', 'Heilongjiang', 'https://www.hit.edu.cn', 3500, 0.18, 1260, 1460, 'unknown', ['public', 'urban'], 47000, ['Engineering', 'Computer Science', 'Mathematics', 'Physics', 'Aerospace']],
  ['Beijing Normal University', 'Beijing', 'Beijing', 'https://www.bnu.edu.cn', 3500, 0.22, 1240, 1440, 'unknown', ['public', 'urban'], 25000, ['Education', 'Humanities', 'Psychology', 'Social Sciences', 'Biology']],
  ["Xi'an Jiaotong University", "Xi'an", 'Shaanxi', 'https://www.xjtu.edu.cn', 3200, 0.25, 1220, 1420, 'unknown', ['public', 'urban'], 41000, ['Engineering', 'Medicine & Health', 'Economics', 'Computer Science', 'Physics']],
  ['South China University of Technology', 'Guangzhou', 'Guangdong', 'https://www.scut.edu.cn', 3000, 0.35, 1200, 1400, 'unknown', ['public', 'urban'], 51000, ['Engineering', 'Computer Science', 'Business', 'Architecture', 'Mathematics']],
  ['Tianjin University', 'Tianjin', 'Tianjin', 'https://www.tju.edu.cn', 3000, 0.30, 1200, 1400, 'unknown', ['public', 'urban'], 29000, ['Engineering', 'Chemistry', 'Computer Science', 'Mathematics', 'Architecture']],
  ['Shandong University', 'Jinan', 'Shandong', 'https://www.sdu.edu.cn', 2800, 0.40, 1180, 1380, 'unknown', ['public', 'suburban'], 68000, ['Humanities', 'Medicine & Health', 'Engineering', 'Social Sciences', 'Law']],
  ['Dalian University of Technology', 'Dalian', 'Liaoning', 'https://www.dlut.edu.cn', 2800, 0.35, 1180, 1380, 'unknown', ['public', 'urban'], 34000, ['Engineering', 'Computer Science', 'Mathematics', 'Chemistry', 'Physics']],
  ['Beijing Institute of Technology', 'Beijing', 'Beijing', 'https://www.bit.edu.cn', 3200, 0.28, 1200, 1400, 'unknown', ['public', 'urban'], 32000, ['Engineering', 'Computer Science', 'Physics', 'Mathematics', 'Business']],
  ['Huazhong University of Science and Technology', 'Wuhan', 'Hubei', 'https://www.hust.edu.cn', 3500, 0.22, 1240, 1440, 'unknown', ['public', 'urban'], 57000, ['Engineering', 'Medicine & Health', 'Computer Science', 'Physics', 'Mathematics']],
];

async function seedChina() {
  console.log('\n── China: Curated dataset ──────────────────────');

  const rows = CHINA_UNIVERSITIES.map(([name, city, state, website, tuition, acceptance, sat_min, sat_max, intl_aid, tags, size, majors], i) => ({
    id: `cn-${i + 1}`,
    name,
    country: 'China',
    city,
    state,
    website,
    majors,
    degrees: ['Bachelor', 'Master', 'PhD'],
    sat_min,
    sat_max,
    acceptance_rate: acceptance,
    tuition_estimate: tuition,
    intl_aid,
    tags,
    brief_description: `${name} is a leading public university in ${city}, ${state}, China.`,
    student_size: size,
  }));

  const { error } = await supabase.from('universities').upsert(rows, { onConflict: 'id' });
  if (error) console.error('China insert error:', error.message);
  else console.log(`  Done: ${rows.length} Chinese universities`);
}

// ─── UK: UCAS provider search ─────────────────────────────────────────────────
// Fetches all UK providers from the UCAS course-search API, merges with
// curated stats (tuition, acceptance rate) where available, and falls back
// to defaults for unknown providers.

// Curated stats for known UK universities keyed by name substring match
const UK_STATS = {};
UK_UNIVERSITIES.forEach(([name, city, state, website, tuition, acceptance, sat_min, sat_max, intl_aid, tags, size, majors]) => {
  UK_STATS[name.toLowerCase()] = { city, state, website, tuition, acceptance, sat_min, sat_max, intl_aid, tags, size, majors };
});

function findUKStats(name) {
  const key = name.toLowerCase();
  // Exact match first
  if (UK_STATS[key]) return UK_STATS[key];
  // Partial match
  for (const k of Object.keys(UK_STATS)) {
    if (key.includes(k) || k.includes(key)) return UK_STATS[k];
  }
  return null;
}

function ucasProviderToRow(provider, idx) {
  const name = provider.providerName ?? provider.name ?? '';
  const city = provider.townOrCity ?? provider.city ?? 'United Kingdom';
  const region = provider.region ?? 'England';
  const website = provider.websiteUrl
    ? (provider.websiteUrl.startsWith('http') ? provider.websiteUrl : `https://${provider.websiteUrl}`)
    : `https://www.${name.toLowerCase().replace(/[^a-z0-9]+/g, '')}.ac.uk`;

  const stats = findUKStats(name);

  return {
    id: `ucas-${idx + 1}`,
    name,
    country: 'UK',
    city,
    state: region,
    website,
    majors: stats?.majors ?? UK_MAJOR_POOLS[idx % UK_MAJOR_POOLS.length],
    degrees: ['Bachelor', 'Master', 'PhD'],
    sat_min: stats?.sat_min ?? 1000,
    sat_max: stats?.sat_max ?? 1200,
    acceptance_rate: stats?.acceptance ?? 0.80,
    tuition_estimate: stats?.tuition ?? 22000,
    intl_aid: stats?.intl_aid ?? 'unknown',
    tags: stats?.tags ?? ['public', 'urban'],
    brief_description: `${name} is a higher education provider in ${city}, UK.`,
    student_size: stats?.size ?? null,
  };
}

async function seedUKFromUCAS() {
  console.log('\n── UK: UCAS provider search ────────────────────');

  // First seed the curated list (accurate stats)
  await seedUK();

  // Then fetch additional providers from UCAS and upsert any not already covered
  let page = 1;
  let totalNew = 0;
  const curatedNames = new Set(UK_UNIVERSITIES.map(([name]) => name.toLowerCase()));

  while (true) {
    const url =
      `https://digital.ucas.com/coursedisplay/results/providers` +
      `?SearchTerm=&PageNumber=${page}&PageSize=100&SearchResultsTab=Providers`;

    let data;
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'OrangeUni/1.0 (university discovery app)',
        }
      });
      if (!res.ok) {
        console.log(`  UCAS API returned ${res.status} on page ${page} — stopping.`);
        break;
      }
      data = await res.json();
    } catch (e) {
      console.log(`  UCAS fetch error on page ${page}: ${e.message} — stopping.`);
      break;
    }

    // UCAS may return providers under different keys depending on API version
    const providers = data.providers ?? data.results ?? data.items ?? data ?? [];
    if (!Array.isArray(providers) || providers.length === 0) break;

    // Skip providers already in curated list
    const novel = providers.filter(p => {
      const name = (p.providerName ?? p.name ?? '').toLowerCase();
      return name && !curatedNames.has(name);
    });

    if (novel.length) {
      const rows = novel.map((p, i) => ucasProviderToRow(p, totalNew + i));
      const { error } = await supabase.from('universities').upsert(rows, { onConflict: 'id' });
      if (error) console.error(`  UCAS page ${page} error:`, error.message);
      else {
        totalNew += novel.length;
        process.stdout.write(`\r  Inserted ${totalNew} additional UK providers from UCAS…`);
      }
    }

    page++;
    if (page > 30) break; // UCAS has ~300 providers, 30 pages of 100 is more than enough
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n  Done: ${totalNew} additional UK universities from UCAS`);
}

// ─── Canadian universities ────────────────────────────────────────────────────
// Tuition = approximate CAD/yr for international undergrads (converted to USD ~0.74).
// SAT ranges are selectivity proxies.

const CANADA_UNIVERSITIES = [
  // [name, city, province, website, tuition_usd, acceptance_rate, sat_min, sat_max, intl_aid, tags, size, majors]
  ['University of Toronto', 'Toronto', 'Ontario', 'https://www.utoronto.ca', 45000, 0.43, 1340, 1520, 'yes', ['public', 'urban'], 97000, ['Engineering', 'Computer Science', 'Business', 'Medicine & Health', 'Social Sciences']],
  ['University of British Columbia', 'Vancouver', 'British Columbia', 'https://www.ubc.ca', 40000, 0.52, 1300, 1480, 'yes', ['public', 'urban'], 65000, ['Engineering', 'Computer Science', 'Business', 'Medicine & Health', 'Humanities']],
  ['McGill University', 'Montreal', 'Quebec', 'https://www.mcgill.ca', 38000, 0.46, 1320, 1500, 'yes', ['public', 'urban'], 40000, ['Medicine & Health', 'Law', 'Engineering', 'Business', 'Social Sciences']],
  ['University of Waterloo', 'Waterloo', 'Ontario', 'https://uwaterloo.ca', 42000, 0.53, 1340, 1520, 'yes', ['public', 'suburban'], 42000, ['Computer Science', 'Engineering', 'Mathematics', 'Business', 'Data Science']],
  ["Queen's University", 'Kingston', 'Ontario', 'https://www.queensu.ca', 36000, 0.44, 1280, 1460, 'yes', ['public', 'suburban'], 25000, ['Business', 'Engineering', 'Law', 'Social Sciences', 'Humanities']],
  ['University of Alberta', 'Edmonton', 'Alberta', 'https://www.ualberta.ca', 30000, 0.58, 1240, 1420, 'yes', ['public', 'urban'], 40000, ['Engineering', 'Business', 'Medicine & Health', 'Social Sciences', 'Computer Science']],
  ['University of Ottawa', 'Ottawa', 'Ontario', 'https://www.uottawa.ca', 32000, 0.62, 1220, 1400, 'unknown', ['public', 'urban'], 44000, ['Law', 'Social Sciences', 'Business', 'Engineering', 'Medicine & Health']],
  ['Western University', 'London', 'Ontario', 'https://www.uwo.ca', 33000, 0.57, 1260, 1440, 'yes', ['public', 'suburban'], 33000, ['Business', 'Medicine & Health', 'Law', 'Social Sciences', 'Engineering']],
  ['McMaster University', 'Hamilton', 'Ontario', 'https://www.mcmaster.ca', 31000, 0.60, 1260, 1440, 'unknown', ['public', 'suburban'], 35000, ['Medicine & Health', 'Engineering', 'Business', 'Social Sciences', 'Computer Science']],
  ['University of Calgary', 'Calgary', 'Alberta', 'https://www.ucalgary.ca', 28000, 0.65, 1220, 1400, 'unknown', ['public', 'urban'], 33000, ['Engineering', 'Business', 'Medicine & Health', 'Law', 'Social Sciences']],
  ['Simon Fraser University', 'Burnaby', 'British Columbia', 'https://www.sfu.ca', 27000, 0.68, 1200, 1380, 'unknown', ['public', 'suburban'], 35000, ['Computer Science', 'Business', 'Social Sciences', 'Engineering', 'Humanities']],
  ['Dalhousie University', 'Halifax', 'Nova Scotia', 'https://www.dal.ca', 26000, 0.70, 1180, 1360, 'unknown', ['public', 'urban'], 19000, ['Medicine & Health', 'Engineering', 'Law', 'Business', 'Social Sciences']],
  ['University of Victoria', 'Victoria', 'British Columbia', 'https://www.uvic.ca', 25000, 0.72, 1180, 1360, 'unknown', ['public', 'suburban'], 22000, ['Engineering', 'Computer Science', 'Business', 'Social Sciences', 'Humanities']],
  ['York University', 'Toronto', 'Ontario', 'https://www.yorku.ca', 24000, 0.78, 1160, 1340, 'unknown', ['public', 'urban'], 53000, ['Business', 'Law', 'Social Sciences', 'Humanities', 'Computer Science']],
  ['University of Manitoba', 'Winnipeg', 'Manitoba', 'https://www.umanitoba.ca', 20000, 0.80, 1140, 1320, 'unknown', ['public', 'urban'], 30000, ['Engineering', 'Medicine & Health', 'Business', 'Social Sciences', 'Agriculture']],
  ['Concordia University', 'Montreal', 'Quebec', 'https://www.concordia.ca', 22000, 0.75, 1160, 1340, 'unknown', ['public', 'urban'], 51000, ['Business', 'Engineering', 'Computer Science', 'Humanities', 'Social Sciences']],
];

async function seedCanada() {
  console.log('\n── Canada: Curated dataset ─────────────────────');

  const rows = CANADA_UNIVERSITIES.map(([name, city, state, website, tuition, acceptance, sat_min, sat_max, intl_aid, tags, size, majors], i) => ({
    id: `ca-${i + 1}`,
    name,
    country: 'Canada',
    city,
    state,
    website,
    majors,
    degrees: ['Bachelor', 'Master', 'PhD'],
    sat_min,
    sat_max,
    acceptance_rate: acceptance,
    tuition_estimate: tuition,
    intl_aid,
    tags,
    brief_description: `${name} is a leading ${tags.includes('public') ? 'public' : 'private'} university in ${city}, ${state}, Canada.`,
    student_size: size,
  }));

  const { error } = await supabase.from('universities').upsert(rows, { onConflict: 'id' });
  if (error) console.error('Canada insert error:', error.message);
  else console.log(`  Done: ${rows.length} Canadian universities`);
}

// ─── Australian universities ──────────────────────────────────────────────────
// Tuition = approximate AUD/yr for international undergrads (converted to USD ~0.65).
// SAT ranges are selectivity proxies.

const AUSTRALIA_UNIVERSITIES = [
  // [name, city, state, website, tuition_usd, acceptance_rate, sat_min, sat_max, intl_aid, tags, size, majors]
  ['University of Melbourne', 'Melbourne', 'Victoria', 'https://www.unimelb.edu.au', 40000, 0.35, 1320, 1500, 'yes', ['public', 'urban'], 52000, ['Medicine & Health', 'Law', 'Engineering', 'Business', 'Humanities']],
  ['Australian National University', 'Canberra', 'Australian Capital Territory', 'https://www.anu.edu.au', 38000, 0.35, 1300, 1480, 'yes', ['public', 'suburban'], 26000, ['Social Sciences', 'Engineering', 'Computer Science', 'Business', 'Humanities']],
  ['University of Sydney', 'Sydney', 'New South Wales', 'https://www.sydney.edu.au', 42000, 0.38, 1300, 1480, 'yes', ['public', 'urban'], 73000, ['Medicine & Health', 'Law', 'Engineering', 'Business', 'Humanities']],
  ['University of Queensland', 'Brisbane', 'Queensland', 'https://www.uq.edu.au', 36000, 0.40, 1280, 1460, 'yes', ['public', 'suburban'], 54000, ['Medicine & Health', 'Engineering', 'Business', 'Social Sciences', 'Biology']],
  ['UNSW Sydney', 'Sydney', 'New South Wales', 'https://www.unsw.edu.au', 42000, 0.40, 1300, 1480, 'yes', ['public', 'urban'], 65000, ['Engineering', 'Computer Science', 'Business', 'Medicine & Health', 'Law']],
  ['Monash University', 'Melbourne', 'Victoria', 'https://www.monash.edu', 38000, 0.42, 1280, 1460, 'yes', ['public', 'suburban'], 78000, ['Engineering', 'Medicine & Health', 'Business', 'Law', 'Computer Science']],
  ['University of Adelaide', 'Adelaide', 'South Australia', 'https://www.adelaide.edu.au', 33000, 0.48, 1240, 1420, 'yes', ['public', 'urban'], 28000, ['Engineering', 'Medicine & Health', 'Business', 'Social Sciences', 'Biology']],
  ['University of Western Australia', 'Perth', 'Western Australia', 'https://www.uwa.edu.au', 34000, 0.50, 1240, 1420, 'yes', ['public', 'suburban'], 24000, ['Engineering', 'Medicine & Health', 'Business', 'Law', 'Humanities']],
  ['Macquarie University', 'Sydney', 'New South Wales', 'https://www.mq.edu.au', 30000, 0.55, 1200, 1380, 'unknown', ['public', 'suburban'], 44000, ['Business', 'Social Sciences', 'Computer Science', 'Humanities', 'Engineering']],
  ['University of Technology Sydney', 'Sydney', 'New South Wales', 'https://www.uts.edu.au', 33000, 0.60, 1200, 1380, 'unknown', ['public', 'urban'], 47000, ['Engineering', 'Computer Science', 'Business', 'Design', 'Social Sciences']],
  ['Queensland University of Technology', 'Brisbane', 'Queensland', 'https://www.qut.edu.au', 28000, 0.62, 1180, 1360, 'unknown', ['public', 'urban'], 51000, ['Business', 'Engineering', 'Computer Science', 'Design', 'Medicine & Health']],
  ['University of Newcastle', 'Newcastle', 'New South Wales', 'https://www.newcastle.edu.au', 26000, 0.70, 1160, 1340, 'unknown', ['public', 'urban'], 38000, ['Engineering', 'Medicine & Health', 'Business', 'Social Sciences', 'Humanities']],
  ['Griffith University', 'Brisbane', 'Queensland', 'https://www.griffith.edu.au', 25000, 0.72, 1140, 1320, 'unknown', ['public', 'urban'], 50000, ['Business', 'Law', 'Social Sciences', 'Engineering', 'Medicine & Health']],
  ['La Trobe University', 'Melbourne', 'Victoria', 'https://www.latrobe.edu.au', 24000, 0.75, 1140, 1320, 'unknown', ['public', 'suburban'], 37000, ['Medicine & Health', 'Business', 'Social Sciences', 'Humanities', 'Engineering']],
  ['Curtin University', 'Perth', 'Western Australia', 'https://www.curtin.edu.au', 26000, 0.68, 1160, 1340, 'unknown', ['public', 'suburban'], 61000, ['Engineering', 'Business', 'Computer Science', 'Social Sciences', 'Humanities']],
];

async function seedAustralia() {
  console.log('\n── Australia: Curated dataset ──────────────────');

  const rows = AUSTRALIA_UNIVERSITIES.map(([name, city, state, website, tuition, acceptance, sat_min, sat_max, intl_aid, tags, size, majors], i) => ({
    id: `au-${i + 1}`,
    name,
    country: 'Australia',
    city,
    state,
    website,
    majors,
    degrees: ['Bachelor', 'Master', 'PhD'],
    sat_min,
    sat_max,
    acceptance_rate: acceptance,
    tuition_estimate: tuition,
    intl_aid,
    tags,
    brief_description: `${name} is a leading ${tags.includes('public') ? 'public' : 'private'} university in ${city}, ${state}, Australia.`,
    student_size: size,
  }));

  const { error } = await supabase.from('universities').upsert(rows, { onConflict: 'id' });
  if (error) console.error('Australia insert error:', error.message);
  else console.log(`  Done: ${rows.length} Australian universities`);
}

// ─── US community colleges (Associate's) ─────────────────────────────────────
// Fetches associate's-predominant schools from College Scorecard.

function transformCommunityCollege(s) {
  const majors = getMajors(s);
  const tags = getTags(s);
  const city = s['school.city'] ?? '';
  const state = s['school.state'] ?? '';
  const ownership = tags.includes('public') ? 'public' : 'private';

  return {
    id: `usa-${s.id}`,
    name: s['school.name'],
    country: 'USA',
    city,
    state,
    website: s['school.school_url']
      ? (s['school.school_url'].startsWith('http') ? s['school.school_url'] : `https://${s['school.school_url']}`)
      : null,
    majors: majors.length ? majors : ['Liberal Arts'],
    degrees: ['Associate', 'Bachelor'],
    sat_min: null,
    sat_max: null,
    acceptance_rate: s['latest.admissions.admission_rate.overall'] ?? 0.85,
    tuition_estimate: s['latest.cost.tuition.out_of_state'] ?? 8000,
    intl_aid: 'unknown',
    tags,
    brief_description: `${s['school.name']} is a ${ownership} community college in ${city}, ${state}.`,
    student_size: s['latest.student.size'] ?? null,
  };
}

async function seedCommunityColleges() {
  console.log('\n── US Community Colleges: College Scorecard ────');
  let page = 0;
  let totalInserted = 0;

  while (true) {
    const url =
      `https://api.data.gov/ed/collegescorecard/v1/schools.json` +
      `?api_key=${SCORECARD_API_KEY}` +
      `&fields=${SC_FIELDS}` +
      `&per_page=100&page=${page}` +
      `&school.degrees_awarded.predominant=2` +  // associate's-predominant
      `&school.operating=1`;

    let data;
    try {
      const res = await fetch(url);
      data = await res.json();
    } catch (e) {
      console.error('Fetch error:', e.message);
      break;
    }

    const results = data.results ?? [];
    if (results.length === 0) break;

    const rows = results
      .filter(s => s['school.name'] && s['school.city'])
      .map(transformCommunityCollege);

    if (rows.length) {
      const { error } = await supabase.from('universities').upsert(rows, { onConflict: 'id' });
      if (error) console.error(`  Page ${page} error:`, error.message);
      else {
        totalInserted += rows.length;
        process.stdout.write(`\r  Inserted ${totalInserted} community colleges…`);
      }
    }

    page++;
    if (page > 20) break; // ~2,000 community colleges
    await new Promise(r => setTimeout(r, 150));
  }

  console.log(`\n  Done: ${totalInserted} US community colleges`);
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('OrangeUni seed script starting…');
  await seedTopUS();
  await seedUS();
  await seedCommunityColleges();
  await seedUKFromUCAS();
  await seedEU();
  await seedChina();
  await seedCanada();
  await seedAustralia();
  console.log('\n✓ Seeding complete!');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
