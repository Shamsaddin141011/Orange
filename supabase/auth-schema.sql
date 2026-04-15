-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)

-- ── User profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  country           TEXT    DEFAULT 'USA',
  interests         TEXT[]  DEFAULT '{}',
  budget_max        INTEGER,
  preferred_location TEXT,
  sat_total         INTEGER,
  sat_math          INTEGER,
  sat_ebrw          INTEGER,
  gpa               REAL,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Shortlist ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shortlist (
  id            UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id TEXT    NOT NULL,
  tag           TEXT    DEFAULT 'match',
  note          TEXT    DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, university_id)
);

-- ── Application tracker ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracker (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID    REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id    TEXT    NOT NULL,
  essays           BOOLEAN DEFAULT FALSE,
  recommendations  BOOLEAN DEFAULT FALSE,
  test_scores      BOOLEAN DEFAULT FALSE,
  fee_waiver       BOOLEAN DEFAULT FALSE,
  visa_docs        BOOLEAN DEFAULT FALSE,
  status           TEXT    DEFAULT 'not_started',
  reminder         TEXT    DEFAULT '',
  UNIQUE(user_id, university_id)
);

-- ── Compare list ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS compare_list (
  user_id         UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  university_ids  TEXT[]  DEFAULT '{}'
);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlist    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker      ENABLE ROW LEVEL SECURITY;
ALTER TABLE compare_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile"      ON profiles     FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users manage own shortlist"    ON shortlist    FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own tracker"      ON tracker      FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own compare list" ON compare_list FOR ALL USING (auth.uid() = user_id);

-- ── Universities table: read-only for everyone, no writes via anon key ────────
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read universities" ON universities FOR SELECT USING (true);

-- Auto-create a blank profile row when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
