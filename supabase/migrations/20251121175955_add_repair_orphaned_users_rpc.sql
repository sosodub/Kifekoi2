/*
  # Add RPC function to repair orphaned user accounts

  1. Problem
    - Some users signed up with an invite code but household_members entry was never created
    - These users see "Aucun foyer trouvé pour ce compte"
    - Need to identify and repair these accounts

  2. Solution
    - Create an RPC function to find users without household_members
    - Allow manual repair by providing user_id and invite_code
    - Function validates the household and creates the missing membership

  3. Security
    - SECURITY DEFINER to bypass RLS
    - Only allows repair for authenticated users
    - Validates household exists before creating membership
*/

CREATE OR REPLACE FUNCTION repair_user_household(
  p_user_id UUID,
  p_invite_code TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT, household_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_household_id UUID;
  v_profile RECORD;
  v_member_name TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Non authentifié'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  SELECT id, first_name, last_name INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF v_profile.id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Profil utilisateur introuvable'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  SELECT h.id INTO v_household_id
  FROM households h
  WHERE h.invite_code = upper(trim(p_invite_code));

  IF v_household_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Code foyer invalide'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  v_member_name := v_profile.first_name || ' ' || v_profile.last_name;

  INSERT INTO household_members (household_id, user_id, name, emoji, role)
  VALUES (v_household_id, p_user_id, v_member_name, NULL, 'adult')
  ON CONFLICT (household_id, user_id) DO NOTHING;

  RETURN QUERY SELECT TRUE, 'Compte réparé avec succès'::TEXT, v_household_id;
END;
$$;

COMMENT ON FUNCTION repair_user_household IS 'Repairs orphaned user accounts by creating missing household_members entries. Used for accounts that signed up with invite codes but failed to join.';
