-- ============================================================
-- OrangeUni In-App Account Deletion (App Store guideline 5.1.1(v))
-- Run once in Supabase Dashboard → SQL Editor
-- ============================================================

-- The anon/authenticated roles can't touch auth.users, so deletion runs as
-- SECURITY DEFINER and is scoped strictly to the caller (auth.uid()).
--
-- What goes away:
--   • conversations the user is in   — explicit DELETE (participant_ids is a
--                                      uuid[], so there's no FK to cascade);
--                                      their messages cascade with them
--   • auth.users row                 — cascades to profiles, shortlist,
--                                      tracker, compare_list and the user's
--                                      own messages
--
-- Avatar files are removed by the client through the Storage API *before*
-- calling this function (see deleteMyAccount() in src/lib/supabase.ts).
-- Supabase blocks direct DELETEs on storage.objects from SQL, and deleting
-- the rows would orphan the underlying files anyway.

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.conversations WHERE caller_id = ANY(participant_ids);
  DELETE FROM auth.users WHERE id = caller_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_my_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
