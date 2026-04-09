-- Palante Accountability Partner RPC Functions

DROP FUNCTION IF EXISTS find_user_by_invite_code(text);

CREATE OR REPLACE FUNCTION find_user_by_invite_code(invite_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_profile profiles;
  safe_data JSONB;
BEGIN
  SELECT * INTO found_profile
  FROM profiles
  WHERE data->>'partnerInviteCode' = invite_code
  LIMIT 1;

  IF found_profile IS NULL THEN
    RETURN NULL;
  END IF;

  safe_data := jsonb_build_object(
    'id', found_profile.id,
    'name', COALESCE(found_profile.data->>'name', 'Anonymous'),
    'streak', COALESCE((found_profile.data->>'streak')::int, 0),
    'partnerInviteCode', found_profile.data->>'partnerInviteCode'
  );

  RETURN safe_data;
END;
$$;


DROP FUNCTION IF EXISTS add_partner_connection(uuid, uuid);

CREATE OR REPLACE FUNCTION add_partner_connection(user_id_1 UUID, user_id_2 UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p1 profiles;
  p2 profiles;
  p1_data JSONB;
  p2_data JSONB;
  new_partner_1 JSONB;
  new_partner_2 JSONB;
BEGIN
  SELECT * INTO p1 FROM profiles WHERE id = user_id_1;
  SELECT * INTO p2 FROM profiles WHERE id = user_id_2;

  IF p1 IS NULL OR p2 IS NULL THEN
    RETURN FALSE;
  END IF;

  p1_data := p1.data;
  p2_data := p2.data;

  new_partner_2 := jsonb_build_object(
    'id', p2.id,
    'name', COALESCE(p2_data->>'name', 'Partner'),
    'currentStreak', COALESCE((p2_data->>'streak')::int, 0),
    'lastActivityDate', now(),
    'inviteStatus', 'accepted',
    'addedDate', now()
  );

  new_partner_1 := jsonb_build_object(
    'id', p1.id,
    'name', COALESCE(p1_data->>'name', 'Partner'),
    'currentStreak', COALESCE((p1_data->>'streak')::int, 0),
    'lastActivityDate', now(),
    'inviteStatus', 'accepted',
    'addedDate', now()
  );

  UPDATE profiles
  SET data = jsonb_set(
    data,
    '{accountabilityPartners}',
    COALESCE(data->'accountabilityPartners', '[]'::jsonb) || new_partner_2
  )
  WHERE id = user_id_1
  AND (
    (data->'accountabilityPartners') IS NULL 
    OR 
    NOT (data->'accountabilityPartners' @> jsonb_build_array(jsonb_build_object('id', p2.id)))
  );

  UPDATE profiles
  SET data = jsonb_set(
    data,
    '{accountabilityPartners}',
    COALESCE(data->'accountabilityPartners', '[]'::jsonb) || new_partner_1
  )
  WHERE id = user_id_2
  AND (
    (data->'accountabilityPartners') IS NULL 
    OR 
    NOT (data->'accountabilityPartners' @> jsonb_build_array(jsonb_build_object('id', p1.id)))
  );

  RETURN TRUE;
END;
$$;
