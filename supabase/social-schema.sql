-- ============================================================
-- OrangeUni Social Schema
-- Run once in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Extend profiles with social fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username     text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS bio          text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_public    boolean DEFAULT true;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_username_key;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_key UNIQUE (username);

CREATE INDEX IF NOT EXISTS idx_profiles_username_lower
  ON public.profiles (lower(username));

-- Allow any authenticated user to read public profiles
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
CREATE POLICY "Public profiles readable"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR (is_public = true AND username IS NOT NULL)
  );

-- 2. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_ids      uuid[]      NOT NULL,
  last_message_at      timestamptz NOT NULL DEFAULT now(),
  last_message_content text,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_participants
  ON public.conversations USING gin (participant_ids);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants view conversations" ON public.conversations;
CREATE POLICY "Participants view conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

DROP POLICY IF EXISTS "Authenticated create conversations" ON public.conversations;
CREATE POLICY "Authenticated create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = ANY(participant_ids));

DROP POLICY IF EXISTS "Participants update conversations" ON public.conversations;
CREATE POLICY "Participants update conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = ANY(participant_ids));

-- 3. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       uuid        NOT NULL REFERENCES auth.users(id)           ON DELETE CASCADE,
  content         text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at      timestamptz NOT NULL DEFAULT now(),
  read_at         timestamptz
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON public.messages (conversation_id, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read messages" ON public.messages;
CREATE POLICY "Participants read messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() = ANY(c.participant_ids)
    )
  );

DROP POLICY IF EXISTS "Sender insert messages" ON public.messages;
CREATE POLICY "Sender insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND auth.uid() = ANY(c.participant_ids)
    )
  );

-- 4. Enable Realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
