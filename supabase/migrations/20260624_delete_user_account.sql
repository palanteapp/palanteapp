-- Allows authenticated users to permanently delete their own account.
-- SECURITY DEFINER so the function runs as the postgres superuser and can
-- delete from auth.users. conversation_memories cascades automatically.
--
-- Run this in the Supabase SQL editor (or via `supabase db push`).

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
