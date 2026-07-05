# OrangeUni — Full Redesign Design System
**Generated:** June 2026 | **Stack:** React Native (Expo) | **Audience:** High school students 16–18

---

## 1. Brand Identity

### Personality
Bold, vibrant, Gen-Z energy. Confidence of a startup, trust of an institution.
Inspired by **Airbnb** (card-heavy discovery, image-first trust) + **Notion/Linear** (clean info hierarchy, strong typography).
NOT: corporate, cluttered, dark-only, boring.

### Tagline Direction
Short, punchy, action-oriented. Examples: *"Find. Apply. Thrive."* / *"Your uni, your way."*

---

## 2. Color System

### Semantic Tokens

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `color.primary` | `#FF5500` | `#FF6B1A` | CTAs, active states, badges |
| `color.primaryLight` | `#FF8C00` | `#FF9933` | Hover states, secondary orange |
| `color.primarySurface` | `#FFF0E6` | `rgba(255,85,0,0.15)` | Orange-tinted backgrounds |
| `color.accent` | `#0EA5E9` (sky blue) | `#38BDF8` | Info states, teal contrast |
| `color.accentSurface` | `#E0F2FE` | `rgba(14,165,233,0.15)` | Blue-tinted chips/badges |
| `color.bg` | `#FFFAF5` | `#0F0A04` | Screen background |
| `color.bgElevated` | `#FFFFFF` | `#1A1008` | Cards, sheets |
| `color.bgMuted` | `#F5F0EB` | `#241508` | Subtle section backgrounds |
| `color.surface` | `#FFFFFF` | `rgba(255,255,255,0.06)` | Card surfaces |
| `color.surfaceBorder` | `rgba(0,0,0,0.08)` | `rgba(255,255,255,0.10)` | Card borders |
| `color.textPrimary` | `#0F0A04` | `#FFFFFF` | Body text, headings |
| `color.textSecondary` | `rgba(15,10,4,0.60)` | `rgba(255,255,255,0.60)` | Subtext, captions |
| `color.textTertiary` | `rgba(15,10,4,0.35)` | `rgba(255,255,255,0.35)` | Placeholder, disabled |
| `color.success` | `#16A34A` | `#22C55E` | Applied, offers |
| `color.successSurface` | `#DCFCE7` | `rgba(34,197,94,0.15)` | |
| `color.warning` | `#D97706` | `#FBBF24` | Deadlines approaching |
| `color.warningSurface` | `#FEF3C7` | `rgba(251,191,36,0.15)` | |
| `color.danger` | `#DC2626` | `#F87171` | Overdue, errors |
| `color.dangerSurface` | `#FEE2E2` | `rgba(248,113,113,0.15)` | |
| `color.scrim` | `rgba(0,0,0,0.50)` | `rgba(0,0,0,0.65)` | Modal overlay |

### Anti-patterns
- Never use raw hex values in components — always reference tokens
- Never use gray-on-gray combinations (textSecondary on bgMuted)
- Never use orange alone to convey status — always pair with icon/label

---

## 3. Typography

### Font Stack
| Role | Font | Weight | Size scale |
|------|------|--------|-----------|
| **Display / Hero** | Syne | 800 ExtraBold | 32 / 40 / 48px |
| **Heading** | Syne | 700 Bold | 20 / 24 / 28px |
| **Subheading** | Syne | 600 SemiBold | 16 / 18px |
| **Body** | Space Grotesk | 400 Regular | 14 / 16px |
| **Body emphasis** | Space Grotesk | 500 Medium | 14 / 16px |
| **Label / Caption** | Space Grotesk | 500 Medium | 11 / 12px |
| **Numeric / Stats** | Space Grotesk | 700 Bold | varies — tabular figures |

### Type Scale (base 16px)
```
xs:   12px — captions, helper text
sm:   14px — secondary body
md:   16px — primary body (minimum on mobile)
lg:   18px — emphasized body
xl:   20px — section headings
2xl:  24px — page titles
3xl:  28px — screen headings
4xl:  32px — display
5xl:  40px — hero
```

### Rules
- Line height: 1.5 for body, 1.2 for headings
- Letter spacing: -0.02em for display/hero, 0 for body, +0.04em for labels/caps
- Max line length: 60 characters on mobile
- Never use text below 12px
- Use tabular figures (`fontVariant: ['tabular-nums']`) for ranks, percentages, tuition

### Loading
```js
// In app entry point
import * as Font from 'expo-font';
await Font.loadAsync({
  'Syne-Bold': require('./assets/fonts/Syne-Bold.ttf'),
  'Syne-ExtraBold': require('./assets/fonts/Syne-ExtraBold.ttf'),
  'SpaceGrotesk-Regular': require('./assets/fonts/SpaceGrotesk-Regular.ttf'),
  'SpaceGrotesk-Medium': require('./assets/fonts/SpaceGrotesk-Medium.ttf'),
  'SpaceGrotesk-Bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
});
```

---

## 4. Spacing & Layout

### Spacing Scale (4px base unit)
```
space.1  =  4px
space.2  =  8px
space.3  = 12px
space.4  = 16px
space.5  = 20px
space.6  = 24px
space.8  = 32px
space.10 = 40px
space.12 = 48px
space.16 = 64px
```

### Layout Constants
```js
export const layout = {
  screenPadding: 16,        // horizontal page inset
  cardGap: 12,              // gap between cards in a list
  sectionGap: 32,           // gap between page sections
  maxContentWidth: 440,     // max width for tablet/large phone
  tabBarHeight: 62,
  tabBarBottomOffset: 16,
  headerHeight: 56,
};
```

### Border Radius Scale
```js
export const radius = {
  sm:   8,   // chips, badges, tags
  md:   12,  // inputs, small cards
  lg:   16,  // standard cards
  xl:   20,  // large cards, modals
  full: 999, // pills, avatar, FABs
};
```

### Safe Areas
Always use `useSafeAreaInsets()`. Never place tappable content behind notch, status bar, or home indicator.

---

## 5. Elevation & Shadows

```js
export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  orange: {
    shadowColor: '#FF5500',
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
};
```

Light mode: use `shadow.sm` and `shadow.md` — shadows are visible against white.
Dark mode: reduce shadowOpacity by 50% (shadows are less effective on dark bg, use border instead).

---

## 6. Icons

**Library:** Lucide React Native (`lucide-react-native`)

```bash
npm install lucide-react-native
```

### Icon Size Tokens
```js
export const iconSize = {
  xs: 14,
  sm: 16,
  md: 20,  // default UI icon
  lg: 24,  // nav icons
  xl: 32,  // empty state icons
  hero: 48, // onboarding/feature icons
};
```

### Rules
- Stroke width: **1.5px** for all icons (consistent, not mixing 1px and 2px)
- All interactive icons: minimum 44×44pt tap area (use `hitSlop` if icon is smaller)
- Never use emoji as structural icons
- All icon-only buttons must have `accessibilityLabel`

### Key Icon Mapping
| Action | Icon |
|--------|------|
| Search | `Search` |
| Shortlist/Save | `Heart` |
| Home | `Home` |
| Compare | `BarChart3` |
| Track | `CheckSquare` |
| People | `Users` |
| Profile | `User` |
| Filter | `SlidersHorizontal` |
| Deadline | `CalendarClock` |
| Location | `MapPin` |
| Rank | `Trophy` |
| Tuition | `Banknote` |
| More | `MoreHorizontal` |
| Back | `ChevronLeft` |
| Close | `X` |
| Add | `Plus` |
| Notification | `Bell` |

---

## 7. Motion & Animation

**Personality:** Snappy & satisfying — spring physics, feels tactile and responsive.

### Spring Configs
```js
// Fast, snappy — for button presses, tab switches
export const springSnappy = { damping: 20, stiffness: 300, mass: 0.8 };

// Standard — for cards, modals entering
export const springStandard = { damping: 22, stiffness: 220, mass: 1 };

// Gentle — for page transitions, large elements
export const springGentle = { damping: 28, stiffness: 160, mass: 1 };
```

### Duration Tokens (for non-spring cases)
```js
export const duration = {
  instant:  80,   // press feedback
  fast:    150,   // micro-interactions
  normal:  250,   // state changes
  slow:    350,   // page transitions, modals
  xslow:   450,   // complex transitions (max)
};
```

### Easing
- Enter animations: `ease-out` (decelerating — feels natural arriving)
- Exit animations: `ease-in` (accelerating — feels intentional leaving)
- Exit duration = 60-70% of enter duration

### Rules
- Animate `transform` and `opacity` only. Never animate `width`, `height`, `top`, `left`
- Max 1-2 animated elements per screen simultaneously
- Every animation must respect `reduceMotion` from `useReduceMotion()`
- Card tap: scale to 0.97 on press, spring back on release (80ms press, spring release)
- Page transitions: directional slide — forward = enter from right, back = exit to right
- Stagger list items: 30ms per item delay on initial load

### Shared Element Transition
Card → Detail: the square image animates as a shared element hero into the full-width header image. Use `react-native-reanimated` shared values for this.

---

## 8. Navigation Architecture

### Bottom Tab Bar
```
[ Home ] [ Discover ] [ Shortlist ] [ Tracker ] [ ··· ]
```

**More tab** expands to: Compare, People, Profile

- Tab bar floats 16px from bottom, rounded pill (borderRadius 32)
- Blur background (BlurView intensity 20, tint: adaptive)
- Each tab has icon + label. Active: `color.primary`. Inactive: `color.textTertiary`
- Icon size: 22px. Label: 10px Space Grotesk Medium
- Tab badge: small orange dot (no number for initial release)

### Stack Navigation
- All stack transitions: horizontal slide (left/right)
- Headers: hidden (`headerShown: false`), custom header components
- Back: `ChevronLeft` icon, 44×44pt tap area

### Custom Header Component
```
[ ← ] [ Screen Title (Syne Bold 20px) ] [ Action icon ]
```
- Height: 56px + safe area top
- Background: adaptive (bgElevated with subtle bottom border)
- No drop shadow — use a 1px border instead

---

## 9. Screen-by-Screen Specs

---

### 9.1 Auth / Login Screen

**Layout:** Illustrated hero + tagline + social login priority

```
┌─────────────────────────────┐
│   [Campus illustration SVG] │  ← ~40% of screen height
│                             │
│   OrangeUni                 │  ← Syne ExtraBold 32px, primary color
│   Find. Apply. Thrive.      │  ← Space Grotesk 16px, textSecondary
│                             │
│  [G] Continue with Google   │  ← Primary filled button, orange
│  [A] Continue with Apple    │  ← Secondary outlined button
│      ────── or ──────       │
│  [✉] Sign in with email     │  ← Ghost button
│                             │
│  By signing up you agree to │  ← 12px caption
│  our Terms & Privacy Policy │
└─────────────────────────────┘
```

- Illustration: abstract campus scene, bold oranges + blues, flat vector style
- Tagline animates in with stagger (0ms, 150ms, 300ms delay on 3 elements)
- Buttons: 56px height, borderRadius `radius.full`, minimum 44px touch target

---

### 9.2 Onboarding Wizard

**Steps (5 screens with progress bar):**

1. **Welcome** — name + profile photo
2. **Subjects** — multi-select chips (A-level / IB / AP subjects)
3. **Target Countries** — flag chips: UK, USA, Canada, Australia, Europe, Other
4. **Budget** — range slider (tuition per year)
5. **Dream Schools** — optional: type 1-3 dream unis for calibration

**Progress Bar:** Orange filled strip at top. `step / total * 100%`. Animated width change on `springStandard`.

**Skip option:** Top-right "Skip for now" in every step except Welcome.

**Bottom CTA:** Full-width orange button "Continue →". Last step: "Start Exploring 🎓" (only screen where an emoji is intentional in copy, not as an icon).

---

### 9.3 Animated Splash Screen

- Duration: 1.2 seconds
- Dark bg (`#0F0A04`) fades to adaptive bg
- Orange logo mark scales from 0.6 → 1.0 with `springGentle`
- "OrangeUni" wordmark fades in at 400ms
- Whole screen fades out at 1000ms

---

### 9.4 Home Screen (Personalized Dashboard)

**Layout (top → bottom scroll):**

```
┌─────────────────────────────┐
│ Good morning, Sham 👋       │  ← Syne Bold 24px (emoji ok in copy)
│ [completion ring] 72% done  │  ← Subtle ring on avatar, small nudge
├─────────────────────────────┤
│ DEADLINES                   │  ← Section label, Space Grotesk 11px caps
│ [⚠ Oxford — 3 days]        │  ← Warning chip
│ [📅 UCL — Jan 15]           │  ← Info chip
├─────────────────────────────┤
│ YOUR SHORTLIST              │
│ [Uni card] [Uni card] →     │  ← Horizontal scroll, 2.5 cards visible
├─────────────────────────────┤
│ RECOMMENDED FOR YOU         │
│ [Card] [Card] [Card] →      │  ← Based on profile prefs
├─────────────────────────────┤
│ TRENDING THIS WEEK          │
│ [Card] [Card] [Card] →      │  ← Popularity-based
└─────────────────────────────┘
```

- Section headers: Space Grotesk 11px, 500 weight, `color.textTertiary`, letter-spacing +0.08em
- Each horizontal scroll section: `snapToInterval` for satisfying snap
- Profile completion ring: only shown until profile is 100% complete, then hidden

---

### 9.5 Discover Screen

**Layout:**

```
┌─────────────────────────────┐
│ [Search bar ———————] [⊞]   │  ← Collapses on scroll, filter icon
│ [UK] [Top 50] [CS] [+ more] │  ← Active filter chips (shown when applied)
├─────────────────────────────┤
│ 847 universities             │  ← Result count, Space Grotesk 13px
│                             │
│ [University Card]           │
│ [University Card]           │
│ [University Card]           │
│ ...                         │
└─────────────────────────────┘
```

**Search Bar:**
- Collapsed: 44px pill with search icon + "Search universities..."
- Expanded: full input with keyboard, clear button
- Collapses with `springSnappy` when scrolling down >50px, re-expands scrolling up

**Filter chips row:** Only shows chips for ACTIVE filters (not all options). Tap chip to remove filter. Tap filter icon to open bottom sheet.

**University Card (Discover card):**
```
┌──────────────────────────────────┐
│ [████████ Square image ████████] │  ← aspectRatio: 1, borderRadius lg top
│                                  │
│ Oxford University        [87%]   │  ← Syne Bold 17px + match % badge
│ 📍 Oxford, UK                    │  ← 13px, textSecondary
│ 🏆 Rank #5  |  ✅ 17%  |  💷 £9k│  ← Stat row chips
│ [Computer Science]              │  ← Top matching major chip
│                          [♡]   │  ← Heart icon to shortlist (44×44pt)
└──────────────────────────────────┘
```

- Image: `aspectRatio: 1` (square), `resizeMode: 'cover'`, `borderRadius: {tl: 16, tr: 16, bl: 0, br: 0}`
- Info section: `padding: 12`, white/bgElevated bg, `borderRadius: {bl: 16, br: 16}`
- Match % badge: orange filled pill, right-aligned next to name
- Shortlist heart: fills orange when saved, outline when not. Spring scale animation on tap
- Card shadow: `shadow.md` in light mode, border-only in dark mode

**Filter Bottom Sheet:**
- Slides up 80% screen height
- Drag handle at top
- Sections: Country (chips), Subject/Major (chips), QS Rank range (slider), Tuition range (slider), Acceptance rate (slider), Scholarship only (toggle)
- Footer: [Reset] ghost button + [Apply X filters] orange button
- Apply button shows count of active filters

---

### 9.6 University Detail Screen

**Layout:**

```
┌─────────────────────────────┐
│ [██████ HERO IMAGE █████]   │  ← Full-width, 260px tall, shared element
│ [← Back]           [♡] [⋯]│  ← Floating buttons over image
├─────────────────────────────┤
│ Oxford University           │  ← Syne ExtraBold 28px
│ 📍 Oxford, UK               │  ← textSecondary 14px
│ [87% Match] [Top 10]        │  ← Badge row
├─────────────────────────────┤
│ [#5][17%][£9,250][IELTS 7] │  ← Stat chips row (horizontal scroll)
├─────────────────────────────┤
│ [About] [Stats] [Apply]     │  ← Tab bar (segment control)
├─────────────────────────────┤
│ Scrollable content below    │
│ (changes per tab)           │
│                             │
│         ...                 │
├─────────────────────────────┤
│ [  ADD TO SHORTLIST  ]      │  ← Sticky bottom CTA, full-width orange
└─────────────────────────────┘
```

**About tab:** Description text, campus photo gallery (horizontal scroll of square thumbnails), tags (programs offered)

**Stats tab:** Acceptance rate gauge, QS ranking bar, tuition breakdown table, entry requirements chips

**Apply tab:** Application deadlines with countdown, required documents checklist, external apply link button

**Floating back/action buttons:** Semi-transparent pill buttons with blur bg over the hero image

**Sticky CTA:** 56px height, orange, `borderRadius: radius.full`. If already shortlisted: shows "Added to Shortlist ✓" in success green.

---

### 9.7 Shortlist Screen

**Layout:**

```
┌─────────────────────────────┐
│ My Shortlist           (5)  │  ← Syne Bold 24px + count badge
│ [All] [Researching] [Appying│  ← Status filter chips
├─────────────────────────────┤
│ ┌──────────────────────────┐│
│ │ [□ img] Oxford University││
│ │         London, UK       ││  ← 56px tall compact card
│ │         [Applying] Mar 15││  ← Status badge + deadline
│ │               [ > ]      ││
│ └──────────────────────────┘│
│ ┌──────────────────────────┐│
│ │ [□ img] MIT              ││
│ │         Cambridge, US    ││
│ │         [Research]  —    ││
│ └──────────────────────────┘│
└─────────────────────────────┘
```

**Status badge colors:**
- `Researching` → blue/teal (`color.accent`)
- `Applying` → orange (`color.primary`)
- `Applied` → warning amber (`color.warning`)
- `Offer` → success green (`color.success`)
- `Rejected` → danger red (`color.danger`)

**Thumbnail:** 48×48px square, `borderRadius: radius.sm`, left-aligned

**Swipe to delete:** Swipe left on a row reveals a red delete action (confirmation required — "Remove from shortlist?" dialog)

**Empty state:**
```
      [Heart icon — 48px, color.textTertiary]
  Nothing shortlisted yet
  Find universities that excite you
      [ Browse Universities ]   ← orange button
```

---

### 9.8 Tracker Screen

**Layout:**

```
┌─────────────────────────────┐
│ Applications            (3) │  ← Syne Bold 24px
├─────────────────────────────┤
│ [Oxford University]         │
│  Deadline: Mar 15  [3 days] │  ← Warning if ≤7 days
│  ───────────────────────    │
│  ☐ Personal statement       │
│  ☐ References (2)           │
│  ☑ Grades transcript        │
│  ☐ Predicted grades letter  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─      │
│  2 of 5 tasks complete      │  ← Progress bar below
├─────────────────────────────┤
│ [MIT]                       │
│  Deadline: Feb 1   [45 days]│
│  ───────────────────────    │
│  ☐ Common App essay         │
│  ☐ SAT scores               │
│  ...                        │
└─────────────────────────────┘
```

**Checklist items:** 44px tap area, checkbox uses `color.primary` when checked. Animate checkmark with spring scale.

**Progress bar under each uni:** Thin 4px bar, orange fill, animated on check.

**Deadline badge:** 
- Green pill if >30 days
- Warning amber if 8-30 days
- Danger red if ≤7 days
- "OVERDUE" red badge if past

**Notification scheduling:** On first Tracker open, request notification permission. Schedule push at 7d, 3d, 1d before each deadline.

---

### 9.9 Compare Screen

**Layout:**

```
┌─────────────────────────────┐
│ Compare                     │
│ [+ Add University]          │  ← Up to 3 unis
├─────────────────────────────┤
│ [Oxford] [MIT] [UCL]        │  ← Selected uni chips, removable
├─────────────────────────────┤
│      [Radar Chart]          │  ← 260px × 260px centered
│   Rank ●                    │
│  /    \                     │
│ Cost   Research             │
│  \    /                     │
│  Accept-Location            │
├─────────────────────────────┤
│ DETAILED COMPARISON         │
│            Oxford  MIT  UCL │
│ QS Rank      #5    #1   #8  │
│ Acceptance  17%   4%  14%   │
│ Tuition     £9k  $57k £9k   │
│ IELTS       7.0  7.0  6.5   │
└─────────────────────────────┘
```

**Radar chart dimensions:** Rank, Acceptance Rate (inverted — lower is better), Cost (inverted), Research output, Location score (city cost of living, student life)

**Chart library:** `react-native-gifted-charts` or `victory-native` for radar support

**Color per uni:** Oxford = orange, MIT = blue, UCL = teal (from the accent palette)

**Table rows:** Alternating subtle bg (`bgMuted`), sortable by tapping column header

---

### 9.10 Profile Screen

**Layout:**

```
┌─────────────────────────────┐
│ [Avatar] Username           │
│ @sham141   [Edit Profile]  │
│ ─────────── ring 72% ─────  │  ← Subtle completion ring around avatar
├─────────────────────────────┤
│ ABOUT ME                    │
│ "Aspiring CS student..."    │
├─────────────────────────────┤
│ ACADEMIC PROFILE            │
│ Predicted: A*AA (A-levels)  │
│ Subjects: Maths, CS, Physics│
├─────────────────────────────┤
│ PREFERENCES                 │
│ Countries: 🇬🇧 🇺🇸 🇨🇦         │
│ Budget: Under £15k/yr       │
│ Major: Computer Science     │
├─────────────────────────────┤
│ MY STATS                    │
│ 5 Shortlisted | 3 Comparing │
│ 2 Tracking    | 0 Offers    │
├─────────────────────────────┤
│ [Settings] [Help] [Sign Out]│
└─────────────────────────────┘
```

**Completion ring:** Only visible until 100%. Uses `react-native-svg` circle stroke-dashoffset animation. Disappears with a celebratory animation at 100%.

**Public profile view:** Other users see avatar, bio, subjects, target countries only. Private data (grades, budget) is never shown publicly.

---

### 9.11 People Screen

**Layout:**

```
┌─────────────────────────────┐
│ [🔍 Search people...]       │
│ Studying: [CS] [Law] [Med]  │  ← Filter by subject chips
├─────────────────────────────┤
│ [Avatar] Ahmed K.           │
│ @ahmed  · CS · 🇬🇧 UK       │  ← Compact row card
│ Shortlisted: Oxford, UCL   │
├─────────────────────────────┤
│ [Avatar] Sara M.            │
│ @sara_m  · Law · 🇺🇸 US     │
│ Shortlisted: Harvard, Yale  │
└─────────────────────────────┘
```

- Deprioritized in nav (inside More tab)
- Each row taps to public profile
- Public profile → Message button opens Chat

---

## 10. Component Library Specs

### Primary Button
```
Height: 52px | borderRadius: radius.full
Background: color.primary | Text: white, Space Grotesk 600 16px
Pressed: scale 0.97, shadowOpacity × 0.5, duration 80ms spring
Loading: spinner replaces text, button disabled
Disabled: opacity 0.4, no press effect
```

### Secondary Button
```
Height: 52px | borderRadius: radius.full
Background: transparent | Border: 1.5px color.primary
Text: color.primary, Space Grotesk 600 16px
Pressed: background color.primarySurface
```

### Chip / Tag
```
Height: 32px | borderRadius: radius.full | paddingH: 12px
Background: color.bgMuted | Border: 1px color.surfaceBorder
Text: Space Grotesk 500 13px, color.textSecondary
Active: background color.primarySurface, border color.primary, text color.primary
```

### Input
```
Height: 52px | borderRadius: radius.md | paddingH: 16px
Background: color.bgElevated | Border: 1.5px color.surfaceBorder
Focus border: color.primary (animated with duration.fast)
Label: above input, Space Grotesk 500 13px, color.textSecondary
Error: border color.danger, error text below (Space Grotesk 12px, color.danger)
```

### Status Badge
```
Height: 24px | borderRadius: radius.full | paddingH: 10px
Text: Space Grotesk 600 11px, uppercase
Applying: bg color.primarySurface, text color.primary
Applied: bg color.warningSurface, text color.warning
Offer: bg color.successSurface, text color.success
Rejected: bg color.dangerSurface, text color.danger
Researching: bg color.accentSurface, text color.accent
```

### Toast / Snackbar
```
Position: bottom, above tab bar
Height: 48px | borderRadius: radius.full | paddingH: 20px
Background: color.textPrimary (inverted) | Text: color.bg
Auto-dismiss: 4 seconds
Slides up from bottom with springSnappy, fades out
aria-live="polite" via AccessibilityInfo
```

---

## 11. Localization

**Languages:** English (default), + 2 additional (recommend: Arabic + Spanish or Chinese)

**RTL Support:**
- Use `I18nManager.isRTL` to flip layout direction
- All flex rows must use `start`/`end` not `left`/`right`
- Icons: mirror directional icons (chevrons, arrows) in RTL
- Use `react-native-i18n` or `i18next`

**Design for text expansion:** All strings may be 30-40% longer in other languages. Never use fixed-width containers for translated text.

---

## 12. Accessibility Checklist

- [ ] All interactive elements ≥44×44pt
- [ ] 8px+ gap between touch targets
- [ ] All icon-only buttons have `accessibilityLabel`
- [ ] Text contrast ≥4.5:1 (all modes verified separately)
- [ ] Heading hierarchy: h1 → h2 → h3, no skips
- [ ] Focus order matches visual order
- [ ] `reduceMotion` respected — all animations disabled when enabled
- [ ] Dynamic type: text scales without truncation up to 200%
- [ ] All images have `accessibilityLabel` or `accessibilityIgnoresInvertColors`
- [ ] Error messages use `role="alert"` / `accessibilityLiveRegion`
- [ ] Form inputs: `accessibilityLabel`, `accessibilityHint`
- [ ] Loading states announced via `accessibilityLiveRegion`

---

## 13. Match Score System

**Match % badge:** Shown on all university cards and detail pages.

**Algorithm inputs:**
- User's predicted grades vs university entry requirements
- User's target countries vs university location
- User's budget vs tuition
- User's target major vs available programs

**Display:**
- ≥80%: green badge — "Great Match"
- 60–79%: orange badge — "Good Match"
- 40–59%: amber badge — "Possible"
- <40%: gray badge — "Reach"

**Alternative label (shown below badge):** Reach / Match / Safety
- Safety: ≥75% match
- Match: 50–74%
- Reach: <50%

---

## 14. Empty States (All screens)

Pattern: **Bold centered icon + headline + subtext + CTA button**

| Screen | Icon | Headline | Subtext | CTA |
|--------|------|----------|---------|-----|
| Shortlist | `Heart` 48px | "Nothing shortlisted yet" | "Save unis you love from Discover" | Browse Universities |
| Tracker | `CheckSquare` 48px | "No applications tracked" | "Add unis to your shortlist to track them" | Go to Shortlist |
| Compare | `BarChart3` 48px | "Nothing to compare" | "Add up to 3 universities to compare" | Browse Universities |
| People | `Users` 48px | "No one found" | "Try different subjects or countries" | Clear filters |
| Search results | `Search` 48px | "No universities found" | "Try adjusting your filters" | Reset Filters |

---

## 15. Push Notifications

**Deadline reminders:** 7 days, 3 days, 1 day before each tracked deadline.

**Notification copy:**
- 7 days: "📅 Oxford deadline in 7 days — are you on track?"
- 3 days: "⏰ 3 days until Oxford deadline — check your progress"
- 1 day: "🚨 Oxford deadline is TOMORROW — final checks!"

**Permission request:** Prompt on first Tracker interaction with in-app explanation before system dialog.

---

## 16. Pre-Delivery Checklist

### Visual
- [ ] No emojis used as structural UI icons (Lucide only)
- [ ] All icons from Lucide, consistent 1.5px stroke
- [ ] Semantic color tokens used everywhere (no raw hex in components)
- [ ] Press states: scale 0.97 on cards, 0.95 on buttons
- [ ] Dark + light mode tested independently

### Interaction
- [ ] Spring animations (not linear) on all interactive elements
- [ ] Tab bar touch targets ≥44pt
- [ ] Filter sheet has drag handle + dismiss on swipe
- [ ] Back navigation preserves scroll position and filter state

### Layout
- [ ] Safe areas respected (notch + home indicator)
- [ ] Tab bar content inset applied to all scrollable screens
- [ ] Tested on iPhone SE (375px) and iPhone Pro Max (430px)
- [ ] No horizontal scroll except intended carousels

### Accessibility
- [ ] All icon buttons labelled
- [ ] All images have alt text
- [ ] Contrast verified in both modes (4.5:1 minimum)
- [ ] `reduceMotion` kills all animations
- [ ] Dynamic text size tested at +3 steps

### Performance
- [ ] University card images lazy-loaded
- [ ] Skeleton placeholders during list load (not spinners)
- [ ] Discover list virtualized (`FlashList` from Shopify recommended)
- [ ] Fonts preloaded before splash dismisses
