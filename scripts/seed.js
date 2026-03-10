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
    sat_min,
    sat_max,
    acceptance_rate: s['latest.admissions.admission_rate.overall'] ?? null,
    tuition_estimate: s['latest.cost.tuition.out_of_state'] ?? 30000,
    intl_aid: 'unknown',
    tags,
    brief_description: `${s['school.name']} is a ${ownership} university in ${city}, ${state}.`,
    student_size: s['latest.student.size'] ?? null,
  };
}

async function seedUS() {
  console.log('\n── US: College Scorecard ──────────────────────');
  const TARGET = 2000;
  let page = 0;
  let totalInserted = 0;

  while (totalInserted < TARGET) {
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
    if (page > 30) break; // safety cap (~3000 records max)
    await new Promise(r => setTimeout(r, 150)); // rate-limit buffer
  }

  console.log(`\n  Done: ${totalInserted} US universities`);
}

// ─── UK universities ───────────────────────────────────────────────────────────

const UK_UNIVERSITIES = [
  // [name, city, state/region, website, tuition_usd, acceptance_rate, sat_min, sat_max, intl_aid, tags, size]
  ['University of Oxford', 'Oxford', 'England', 'https://www.ox.ac.uk', 58000, 0.17, 1380, 1560, 'yes', ['private', 'urban'], 24000],
  ['University of Cambridge', 'Cambridge', 'England', 'https://www.cam.ac.uk', 55000, 0.18, 1380, 1560, 'yes', ['private', 'suburban'], 24000],
  ['Imperial College London', 'London', 'England', 'https://www.imperial.ac.uk', 49000, 0.14, 1360, 1540, 'yes', ['private', 'urban'], 19000],
  ['University College London', 'London', 'England', 'https://www.ucl.ac.uk', 40000, 0.63, 1280, 1480, 'unknown', ['private', 'urban'], 44000],
  ["King's College London", 'London', 'England', 'https://www.kcl.ac.uk', 36000, 0.55, 1240, 1440, 'unknown', ['private', 'urban'], 35000],
  ['London School of Economics', 'London', 'England', 'https://www.lse.ac.uk', 34000, 0.16, 1300, 1520, 'unknown', ['private', 'urban'], 12000],
  ['University of Edinburgh', 'Edinburgh', 'Scotland', 'https://www.ed.ac.uk', 38000, 0.44, 1260, 1460, 'unknown', ['public', 'urban'], 40000],
  ['University of Manchester', 'Manchester', 'England', 'https://www.manchester.ac.uk', 32000, 0.59, 1220, 1420, 'unknown', ['public', 'urban'], 45000],
  ['University of Bristol', 'Bristol', 'England', 'https://www.bristol.ac.uk', 33000, 0.54, 1240, 1440, 'unknown', ['public', 'urban'], 28000],
  ['University of Warwick', 'Coventry', 'England', 'https://warwick.ac.uk', 35000, 0.13, 1280, 1500, 'unknown', ['public', 'suburban'], 27000],
  ['University of Glasgow', 'Glasgow', 'Scotland', 'https://www.gla.ac.uk', 28000, 0.66, 1200, 1400, 'unknown', ['public', 'urban'], 36000],
  ['University of Leeds', 'Leeds', 'England', 'https://www.leeds.ac.uk', 30000, 0.72, 1180, 1380, 'unknown', ['public', 'urban'], 38000],
  ['University of Birmingham', 'Birmingham', 'England', 'https://www.birmingham.ac.uk', 30000, 0.69, 1180, 1380, 'unknown', ['public', 'urban'], 36000],
  ['University of Southampton', 'Southampton', 'England', 'https://www.southampton.ac.uk', 29000, 0.72, 1180, 1380, 'unknown', ['public', 'urban'], 27000],
  ['University of Sheffield', 'Sheffield', 'England', 'https://www.sheffield.ac.uk', 29000, 0.75, 1160, 1360, 'unknown', ['public', 'urban'], 30000],
  ['Durham University', 'Durham', 'England', 'https://www.durham.ac.uk', 32000, 0.12, 1300, 1500, 'unknown', ['public', 'suburban'], 20000],
  ['University of Nottingham', 'Nottingham', 'England', 'https://www.nottingham.ac.uk', 29000, 0.68, 1180, 1380, 'unknown', ['public', 'suburban'], 34000],
  ['University of York', 'York', 'England', 'https://www.york.ac.uk', 27000, 0.71, 1180, 1380, 'unknown', ['public', 'suburban'], 20000],
  ['University of Bath', 'Bath', 'England', 'https://www.bath.ac.uk', 28000, 0.17, 1280, 1480, 'unknown', ['public', 'urban'], 18000],
  ['University of Exeter', 'Exeter', 'England', 'https://www.exeter.ac.uk', 28000, 0.68, 1200, 1400, 'unknown', ['public', 'suburban'], 27000],
  ['University of Liverpool', 'Liverpool', 'England', 'https://www.liverpool.ac.uk', 27000, 0.73, 1160, 1360, 'unknown', ['public', 'urban'], 26000],
  ['Queen Mary University of London', 'London', 'England', 'https://www.qmul.ac.uk', 28000, 0.62, 1180, 1380, 'unknown', ['public', 'urban'], 27000],
  ['Lancaster University', 'Lancaster', 'England', 'https://www.lancaster.ac.uk', 27000, 0.74, 1160, 1360, 'unknown', ['public', 'suburban'], 15000],
  ['Cardiff University', 'Cardiff', 'Wales', 'https://www.cardiff.ac.uk', 28000, 0.76, 1140, 1340, 'unknown', ['public', 'urban'], 32000],
  ['Newcastle University', 'Newcastle', 'England', 'https://www.ncl.ac.uk', 28500, 0.72, 1160, 1360, 'unknown', ['public', 'urban'], 27000],
  ['University of St Andrews', 'St Andrews', 'Scotland', 'https://www.st-andrews.ac.uk', 32000, 0.08, 1320, 1520, 'unknown', ['public', 'suburban'], 10000],
  ['London School of Hygiene & Tropical Medicine', 'London', 'England', 'https://www.lshtm.ac.uk', 30000, 0.30, 1260, 1460, 'unknown', ['public', 'urban'], 5000],
  ['University of Reading', 'Reading', 'England', 'https://www.reading.ac.uk', 27000, 0.78, 1120, 1320, 'unknown', ['public', 'suburban'], 20000],
  ['University of East Anglia', 'Norwich', 'England', 'https://www.uea.ac.uk', 26000, 0.80, 1100, 1300, 'unknown', ['public', 'suburban'], 17000],
  ['University of Leicester', 'Leicester', 'England', 'https://www.le.ac.uk', 26000, 0.78, 1120, 1320, 'unknown', ['public', 'urban'], 18000],
  ['University of Sussex', 'Brighton', 'England', 'https://www.sussex.ac.uk', 27000, 0.79, 1100, 1300, 'unknown', ['public', 'urban'], 20000],
  ['Loughborough University', 'Loughborough', 'England', 'https://www.lboro.ac.uk', 28000, 0.54, 1200, 1400, 'unknown', ['public', 'suburban'], 18000],
  ['University of Aberdeen', 'Aberdeen', 'Scotland', 'https://www.abdn.ac.uk', 25000, 0.75, 1120, 1320, 'unknown', ['public', 'urban'], 15000],
  ['University of Dundee', 'Dundee', 'Scotland', 'https://www.dundee.ac.uk', 25000, 0.76, 1120, 1320, 'unknown', ['public', 'urban'], 17000],
  ['University of Strathclyde', 'Glasgow', 'Scotland', 'https://www.strath.ac.uk', 26000, 0.74, 1140, 1340, 'unknown', ['public', 'urban'], 23000],
  ['Heriot-Watt University', 'Edinburgh', 'Scotland', 'https://www.hw.ac.uk', 24000, 0.80, 1100, 1300, 'unknown', ['public', 'urban'], 10000],
  ['University of Stirling', 'Stirling', 'Scotland', 'https://www.stir.ac.uk', 22000, 0.85, 1060, 1260, 'unknown', ['public', 'suburban'], 13000],
  ['Swansea University', 'Swansea', 'Wales', 'https://www.swansea.ac.uk', 24000, 0.82, 1080, 1280, 'unknown', ['public', 'urban'], 22000],
  ['Bangor University', 'Bangor', 'Wales', 'https://www.bangor.ac.uk', 22000, 0.86, 1020, 1220, 'unknown', ['public', 'suburban'], 10000],
  ['University of Surrey', 'Guildford', 'England', 'https://www.surrey.ac.uk', 28000, 0.72, 1160, 1360, 'unknown', ['public', 'suburban'], 16000],
  ['University of Kent', 'Canterbury', 'England', 'https://www.kent.ac.uk', 26000, 0.80, 1080, 1280, 'unknown', ['public', 'suburban'], 20000],
  ['University of Essex', 'Colchester', 'England', 'https://www.essex.ac.uk', 25000, 0.82, 1060, 1260, 'unknown', ['public', 'suburban'], 15000],
  ['Brunel University London', 'London', 'England', 'https://www.brunel.ac.uk', 26000, 0.76, 1100, 1300, 'unknown', ['public', 'suburban'], 14000],
  ['City, University of London', 'London', 'England', 'https://www.city.ac.uk', 27000, 0.74, 1120, 1320, 'unknown', ['public', 'urban'], 20000],
  ['University of Hull', 'Hull', 'England', 'https://www.hull.ac.uk', 24000, 0.88, 1040, 1240, 'no', ['public', 'urban'], 16000],
  ['Keele University', 'Keele', 'England', 'https://www.keele.ac.uk', 24000, 0.84, 1060, 1260, 'unknown', ['public', 'rural'], 10000],
  ['University of Lincoln', 'Lincoln', 'England', 'https://www.lincoln.ac.uk', 23000, 0.88, 1020, 1220, 'unknown', ['public', 'urban'], 16000],
  ['Coventry University', 'Coventry', 'England', 'https://www.coventry.ac.uk', 22000, 0.90, 1000, 1200, 'unknown', ['public', 'urban'], 30000],
  ['Aston University', 'Birmingham', 'England', 'https://www.aston.ac.uk', 25000, 0.78, 1100, 1300, 'unknown', ['public', 'urban'], 14000],
  ['University of Plymouth', 'Plymouth', 'England', 'https://www.plymouth.ac.uk', 23000, 0.84, 1040, 1240, 'unknown', ['public', 'urban'], 18000],
  ['University of Portsmouth', 'Portsmouth', 'England', 'https://www.port.ac.uk', 23000, 0.86, 1020, 1220, 'unknown', ['public', 'urban'], 23000],
  ['Oxford Brookes University', 'Oxford', 'England', 'https://www.brookes.ac.uk', 23000, 0.82, 1040, 1240, 'unknown', ['public', 'urban'], 17000],
  ['University of the Arts London', 'London', 'England', 'https://www.arts.ac.uk', 30000, 0.55, 1100, 1300, 'unknown', ['public', 'urban'], 22000],
  ['Goldsmiths, University of London', 'London', 'England', 'https://www.gold.ac.uk', 26000, 0.72, 1100, 1300, 'unknown', ['public', 'urban'], 10000],
  ['Royal Holloway, University of London', 'Egham', 'England', 'https://www.royalholloway.ac.uk', 27000, 0.70, 1120, 1320, 'unknown', ['public', 'suburban'], 11000],
  ['Birkbeck, University of London', 'London', 'England', 'https://www.bbk.ac.uk', 25000, 0.80, 1060, 1260, 'unknown', ['public', 'urban'], 18000],
  ['SOAS University of London', 'London', 'England', 'https://www.soas.ac.uk', 27000, 0.62, 1160, 1360, 'unknown', ['public', 'urban'], 6000],
  ['University of Salford', 'Salford', 'England', 'https://www.salford.ac.uk', 22000, 0.88, 1000, 1200, 'unknown', ['public', 'urban'], 21000],
  ['Manchester Metropolitan University', 'Manchester', 'England', 'https://www.mmu.ac.uk', 22000, 0.88, 1000, 1200, 'unknown', ['public', 'urban'], 38000],
  ['Leeds Beckett University', 'Leeds', 'England', 'https://www.leedsbeckett.ac.uk', 20000, 0.92, 960, 1160, 'unknown', ['public', 'urban'], 30000],
  ['Sheffield Hallam University', 'Sheffield', 'England', 'https://www.shu.ac.uk', 21000, 0.90, 980, 1180, 'unknown', ['public', 'urban'], 35000],
  ['University of Brighton', 'Brighton', 'England', 'https://www.brighton.ac.uk', 22000, 0.88, 1000, 1200, 'unknown', ['public', 'urban'], 22000],
  ['University of Hertfordshire', 'Hatfield', 'England', 'https://www.herts.ac.uk', 21000, 0.90, 980, 1180, 'unknown', ['public', 'suburban'], 25000],
  ['Nottingham Trent University', 'Nottingham', 'England', 'https://www.ntu.ac.uk', 22000, 0.88, 1000, 1200, 'unknown', ['public', 'urban'], 38000],
  ['University of Huddersfield', 'Huddersfield', 'England', 'https://www.hud.ac.uk', 21000, 0.90, 960, 1160, 'unknown', ['public', 'urban'], 20000],
  ['University of the West of England', 'Bristol', 'England', 'https://www.uwe.ac.uk', 22000, 0.88, 980, 1180, 'unknown', ['public', 'suburban'], 30000],
  ['De Montfort University', 'Leicester', 'England', 'https://www.dmu.ac.uk', 21000, 0.91, 960, 1160, 'unknown', ['public', 'urban'], 26000],
  ['University of Central Lancashire', 'Preston', 'England', 'https://www.uclan.ac.uk', 21000, 0.92, 940, 1140, 'unknown', ['public', 'urban'], 35000],
  ['University of Sunderland', 'Sunderland', 'England', 'https://www.sunderland.ac.uk', 19000, 0.94, 920, 1120, 'unknown', ['public', 'urban'], 18000],
  ['University of Northumbria', 'Newcastle', 'England', 'https://www.northumbria.ac.uk', 22000, 0.88, 980, 1180, 'unknown', ['public', 'urban'], 34000],
  ['Robert Gordon University', 'Aberdeen', 'Scotland', 'https://www.rgu.ac.uk', 22000, 0.88, 1000, 1200, 'unknown', ['public', 'urban'], 16000],
  ['Edinburgh Napier University', 'Edinburgh', 'Scotland', 'https://www.napier.ac.uk', 20000, 0.90, 960, 1160, 'unknown', ['public', 'urban'], 20000],
  ['Glasgow Caledonian University', 'Glasgow', 'Scotland', 'https://www.gcu.ac.uk', 20000, 0.90, 960, 1160, 'unknown', ['public', 'urban'], 20000],
  ['Queen\'s University Belfast', 'Belfast', 'Northern Ireland', 'https://www.qub.ac.uk', 22000, 0.74, 1160, 1360, 'unknown', ['public', 'urban'], 24000],
  ['Ulster University', 'Coleraine', 'Northern Ireland', 'https://www.ulster.ac.uk', 19000, 0.90, 960, 1160, 'unknown', ['public', 'suburban'], 28000],
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

  const rows = UK_UNIVERSITIES.map(([name, city, state, website, tuition, acceptance, sat_min, sat_max, intl_aid, tags, size], i) => ({
    id: `uk-${i + 1}`,
    name,
    country: 'UK',
    city,
    state,
    website,
    majors: UK_MAJOR_POOLS[i % UK_MAJOR_POOLS.length],
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

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('OrangeUni seed script starting…');
  await seedUS();
  await seedUK();
  console.log('\n✓ Seeding complete!');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
