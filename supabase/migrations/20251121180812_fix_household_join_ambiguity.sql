/*
  # Fix household join ambiguity and add unique constraint

  1. Problem
    - ON CONFLICT (household_id, user_id) in join_household_by_code fails because no UNIQUE constraint exists
    - This causes "column reference household_id is ambiguous" error
    - Users cannot join existing households

  2. Solution
    - Add UNIQUE constraint on (household_id, user_id) to prevent duplicate memberships
    - Update join_household_by_code to handle conflicts properly
    - Add constraint only if it doesn't exist to avoid errors

  3. Security
    - Maintains data integrity by preventing duplicate memberships
    - Ensures one user can only be a member once per household
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'household_members_household_user_unique'
    AND conrelid = 'household_members'::regclass
  ) THEN
    ALTER TABLE household_members
    ADD CONSTRAINT household_members_household_user_unique
    UNIQUE (household_id, user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION join_household_by_code(
  p_invite_code TEXT,
  p_member_name TEXT,
  p_member_emoji TEXT DEFAULT NULL
)
RETURNS TABLE(household_id UUID, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_user_id UUID;
  v_existing_member_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 'Non authentifié'::TEXT;
    RETURN;
  END IF;

  IF p_invite_code IS NULL OR trim(p_invite_code) = '' THEN
    RETURN QUERY SELECT NULL::UUID, 'Code foyer requis'::TEXT;
    RETURN;
  END IF;

  SELECT h.id INTO v_household_id
  FROM households h
  WHERE h.invite_code = upper(trim(p_invite_code));

  IF v_household_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, 'Code foyer invalide'::TEXT;
    RETURN;
  END IF;

  SELECT hm.id INTO v_existing_member_id
  FROM household_members hm
  WHERE hm.household_id = v_household_id
    AND hm.user_id = v_user_id;

  IF v_existing_member_id IS NOT NULL THEN
    RETURN QUERY SELECT v_household_id, NULL::TEXT;
    RETURN;
  END IF;

  INSERT INTO household_members (household_id, user_id, name, emoji, role)
  VALUES (v_household_id, v_user_id, p_member_name, p_member_emoji, 'adult');

  RETURN QUERY SELECT v_household_id, NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION join_household_by_code IS 'Allows authenticated users to join an existing household by invite code. Bypasses RLS to search households and create membership.';
