# OrangeUni (Expo + React Native + TypeScript)

OrangeUni is an orange-themed student app to discover and shortlist universities with transparent matching logic.

## Run

```bash
npm install
npm run start
```

## Fresh setup on a new PC (Windows/PowerShell)

If you do not have the repo on your computer yet, clone it first:

```powershell
cd $HOME
git clone https://github.com/<your-username>/Orange.git
cd Orange
```

Then install and run the app:

```powershell
npm install
npm run start
```

If you already cloned before and just need the latest files:

```powershell
git checkout main
git pull origin main
```

## Folder structure

```txt
.
├── App.tsx
├── src
│   ├── components
│   │   └── UniversityCard.tsx
│   ├── data
│   │   └── universities.ts
│   ├── navigation
│   │   └── AppNavigator.tsx
│   ├── screens
│   │   ├── OnboardingScreen.tsx
│   │   ├── DiscoverScreen.tsx
│   │   ├── UniversityDetailScreen.tsx
│   │   ├── ShortlistScreen.tsx
│   │   ├── CompareScreen.tsx
│   │   ├── TrackerScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── store
│   │   └── useAppStore.ts
│   ├── types
│   │   └── index.ts
│   └── utils
│       └── scoring.ts
```

## Dataset schema

Each school has:
- `id`, `name`, `country`, `city`, `state`, `website`
- `majors[]`
- `sat_middle_50: { min, max }`
- `acceptance_rate?`
- `tuition_estimate`
- `intl_aid`: yes/no/unknown
- `deadlines[]`
- `tags[]`
- `brief_description`

### Example entry (demo data)

```ts
{
  id: 'usa-1',
  name: 'Stanford University',
  country: 'USA',
  city: 'Stanford',
  state: 'CA',
  website: 'https://www.stanforduniversity.edu',
  majors: ['Computer Science', 'Data Science', 'Mathematics'],
  sat_middle_50: { min: 1050, max: 1270 },
  acceptance_rate: 0.08,
  tuition_estimate: 22000,
  intl_aid: 'yes',
  deadlines: [
    { label: 'Early', date: '2026-11-01' },
    { label: 'Regular', date: '2027-01-15' }
  ],
  tags: ['public', 'urban'],
  brief_description: '...demo data...'
}
```

## Matching function

`src/utils/scoring.ts`:

- Interest overlap score (Jaccard)
- SAT fit score based on middle 50 distance
- Preference score from location/budget

Final formula:

```txt
final = 0.55 * interest + 0.35 * sat + 0.10 * preference
```

The app also returns “Why this match” bullets from those factors.

## Notes

- Uses AsyncStorage persisted Zustand state for shortlist, notes, compare, tracker.
- Includes empty states (no results, invalid SAT, no saved schools).
- Data is local/offline demo data (50 schools: USA + UK) and can be replaced with API later.
