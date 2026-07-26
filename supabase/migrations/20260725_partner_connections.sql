-- Accountability partners: real, shared, two-sided connections.
--
-- Before this migration, partner data lived only inside each user's own
-- profiles.data JSONB blob. There was no shared record, so two users could never
-- see the same truth, partner streaks froze at the moment of adding, and a failed
-- invite lookup silently fabricated a local "partner" that did not exist.
--
-- This replaces that with two tables and a small set of SECURITY DEFINER functions.
-- The functions exist because RLS correctly prevents reading another user's
-- profile row; they are the only sanctioned window into a partner's data, and they
-- expose exactly the three fields the invite modal promises — name, streak, and
-- last activity date. Nothing else about a partner is readable.
--
-- Run in the Supabase SQL editor, or via `supabase db push`.

-- ─────────────────────────────────────────────────────────────────────────────
-- Invite code lookup index
-- ─────────────────────────────────────────────────────────────────────────────
-- Invite codes live at profiles.data->>'partnerInviteCode'. Without this index
-- every redemption is a full table scan.

CREATE INDEX IF NOT EXISTS profiles_partner_invite_code_idx
  ON profiles ((data->>'partnerInviteCode'))
  WHERE data->>'partnerInviteCode' IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- partner_connections
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS partner_connections (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at  TIMESTAMPTZ,
  CONSTRAINT no_self_connection CHECK (requester_id <> addressee_id)
);

-- One connection per pair, in either direction.
CREATE UNIQUE INDEX IF NOT EXISTS partner_connections_pair_idx
  ON partner_connections (
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  );

CREATE INDEX IF NOT EXISTS partner_connections_requester_idx
  ON partner_connections (requester_id, status);
CREATE INDEX IF NOT EXISTS partner_connections_addressee_idx
  ON partner_connections (addressee_id, status);

ALTER TABLE partner_connections ENABLE ROW LEVEL SECURITY;

-- You can see any connection you are part of, in either role.
CREATE POLICY "Users read own connections"
  ON partner_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Only the addressee may accept, decline, or block. The requester cannot
-- self-approve — that is the whole point of a two-sided connection.
CREATE POLICY "Addressee responds to request"
  ON partner_connections FOR UPDATE
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id);

-- Either side may walk away.
CREATE POLICY "Users delete own connections"
  ON partner_connections FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Note: no INSERT policy. Connections are created exclusively through
-- request_partner_connection() below, which validates the invite code.

-- ─────────────────────────────────────────────────────────────────────────────
-- partner_check_ins
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS partner_check_ins (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID        NOT NULL REFERENCES partner_connections(id) ON DELETE CASCADE,
  author_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind          TEXT        NOT NULL CHECK (kind IN ('nudge', 'practice', 'note')),
  body          TEXT        CHECK (body IS NULL OR char_length(body) <= 500),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS partner_check_ins_connection_idx
  ON partner_check_ins (connection_id, created_at DESC);

ALTER TABLE partner_check_ins ENABLE ROW LEVEL SECURITY;

-- Readable by both sides of an accepted connection.
CREATE POLICY "Partners read connection check-ins"
  ON partner_check_ins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM partner_connections c
      WHERE c.id = partner_check_ins.connection_id
        AND c.status = 'accepted'
        AND (auth.uid() = c.requester_id OR auth.uid() = c.addressee_id)
    )
  );

-- You may only write check-ins as yourself, on an accepted connection you are in.
CREATE POLICY "Partners write own check-ins"
  ON partner_check_ins FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM partner_connections c
      WHERE c.id = partner_check_ins.connection_id
        AND c.status = 'accepted'
        AND (auth.uid() = c.requester_id OR auth.uid() = c.addressee_id)
    )
  );

CREATE POLICY "Authors delete own check-ins"
  ON partner_check_ins FOR DELETE
  USING (auth.uid() = author_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- request_partner_connection(invite_code)
-- ─────────────────────────────────────────────────────────────────────────────
-- Redeems an invite code and opens a PENDING connection. Returns the connection
-- id and the addressee's display name so the client can show "invite sent to X".
--
-- Deliberately does NOT auto-accept. The old client-side code created accepted
-- partners unilaterally; a connection now requires the other person to agree.

CREATE OR REPLACE FUNCTION public.request_partner_connection(invite_code TEXT)
RETURNS TABLE (connection_id UUID, partner_id UUID, partner_name TEXT, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id      UUID;
  target_name    TEXT;
  existing       partner_connections%ROWTYPE;
  new_connection partner_connections%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  IF invite_code IS NULL OR btrim(invite_code) = '' THEN
    RAISE EXCEPTION 'Invite code required' USING ERRCODE = '22023';
  END IF;

  SELECT p.id, p.data->>'name'
    INTO target_id, target_name
    FROM profiles p
   WHERE p.data->>'partnerInviteCode' = upper(btrim(invite_code))
   LIMIT 1;

  IF target_id IS NULL THEN
    RAISE EXCEPTION 'No one found with that invite code' USING ERRCODE = 'P0002';
  END IF;

  IF target_id = auth.uid() THEN
    RAISE EXCEPTION 'That is your own invite code' USING ERRCODE = '22023';
  END IF;

  -- Already connected, or a request already exists in either direction?
  SELECT * INTO existing
    FROM partner_connections c
   WHERE LEAST(c.requester_id, c.addressee_id) = LEAST(auth.uid(), target_id)
     AND GREATEST(c.requester_id, c.addressee_id) = GREATEST(auth.uid(), target_id)
   LIMIT 1;

  IF FOUND THEN
    IF existing.status = 'blocked' THEN
      RAISE EXCEPTION 'This connection is unavailable' USING ERRCODE = '42501';
    END IF;

    -- They already invited us: accept rather than opening a mirror request.
    IF existing.status = 'pending' AND existing.addressee_id = auth.uid() THEN
      UPDATE partner_connections
         SET status = 'accepted', responded_at = NOW()
       WHERE id = existing.id
      RETURNING * INTO existing;
    END IF;

    RETURN QUERY SELECT existing.id, target_id, target_name, existing.status;
    RETURN;
  END IF;

  INSERT INTO partner_connections (requester_id, addressee_id, status)
  VALUES (auth.uid(), target_id, 'pending')
  RETURNING * INTO new_connection;

  RETURN QUERY SELECT new_connection.id, target_id, target_name, new_connection.status;
END;
$$;

REVOKE ALL ON FUNCTION public.request_partner_connection(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_partner_connection(TEXT) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- get_partner_summaries()
-- ─────────────────────────────────────────────────────────────────────────────
-- The only window into a partner's profile. Returns name, streak, and last
-- activity date and nothing else — matching the promise made in the invite modal.
-- Goals, journal entries, reflections, and chat history are never exposed.

CREATE OR REPLACE FUNCTION public.get_partner_summaries()
RETURNS TABLE (
  connection_id      UUID,
  partner_id         UUID,
  partner_name       TEXT,
  current_streak     INT,
  last_activity_date TEXT,
  status             TEXT,
  is_incoming        BOOLEAN,
  created_at         TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  RETURN QUERY
  SELECT
    c.id,
    other.id,
    COALESCE(other.data->>'name', 'Partner'),
    COALESCE((other.data->>'streak')::INT, 0),
    other.data->'practiceData'->>'lastActivityDate',
    c.status,
    (c.addressee_id = auth.uid()),
    c.created_at
  FROM partner_connections c
  JOIN profiles other
    ON other.id = CASE WHEN c.requester_id = auth.uid()
                       THEN c.addressee_id
                       ELSE c.requester_id END
  WHERE (c.requester_id = auth.uid() OR c.addressee_id = auth.uid())
    AND c.status IN ('pending', 'accepted')
  ORDER BY c.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_partner_summaries() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_partner_summaries() TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- respond_to_partner_request(connection_id, accept)
-- ─────────────────────────────────────────────────────────────────────────────
-- Thin wrapper over the UPDATE policy so the client has one clear call and the
-- responded_at stamp is always set.

CREATE OR REPLACE FUNCTION public.respond_to_partner_request(
  target_connection UUID,
  accept BOOLEAN
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '28000';
  END IF;

  new_status := CASE WHEN accept THEN 'accepted' ELSE 'declined' END;

  UPDATE partner_connections
     SET status = new_status, responded_at = NOW()
   WHERE id = target_connection
     AND addressee_id = auth.uid()
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No pending request found' USING ERRCODE = 'P0002';
  END IF;

  RETURN new_status;
END;
$$;

REVOKE ALL ON FUNCTION public.respond_to_partner_request(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.respond_to_partner_request(UUID, BOOLEAN) TO authenticated;
