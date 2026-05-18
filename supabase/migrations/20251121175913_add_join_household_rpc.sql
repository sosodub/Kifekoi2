/*
  # Add RPC function for joining household by invite code

  1. Problem
    - Current RLS policies block users from finding households by invite_code
    - Users cannot insert themselves into household_members (only owners can)
    - This prevents the "join existing household" flow during signup

  2. Solution
    - Create a secure RPC function `join_household_by_code` that:
      - Bypasses RLS to search for household by invite_code
      - Validates that the household exists
      - Creates a household_members entry for the calling user
      - Returns the household_id on success
    - Function runs with SECURITY DEFINER to bypass RLS
    - Only allows users to add themselves (auth.uid())

  3. Security
    - Users can only join as themselves (cannot add other users)
    - Checks household exists before inserting
    - Prevents duplicate memberships (ON CONFLICT DO NOTHING)
    - Returns clear error messages
*/

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

  INSERT INTO household_members (household_id, user_id, name, emoji, role)
  VALUES (v_household_id, v_user_id, p_member_name, p_member_emoji, 'adult')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  RETURN QUERY SELECT v_household_id, NULL::TEXT;
END;
$$;

COMMENT ON FUNCTION join_household_by_code IS 'Allows authenticated users to join an existing household by invite code. Bypasses RLS to search households and create membership.';
