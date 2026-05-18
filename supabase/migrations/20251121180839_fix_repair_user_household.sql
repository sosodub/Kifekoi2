/*
  # Fix repair_user_household function

  1. Changes
    - Remove ON CONFLICT clause that caused issues
    - Check for existing membership before inserting
    - Handle duplicate membership gracefully

  2. Security
    - Maintains SECURITY DEFINER for RLS bypass
    - Validates user and household existence
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
  v_existing_member_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Non authentifié'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  SELECT p.id, p.first_name, p.last_name INTO v_profile
  FROM profiles p
  WHERE p.id = p_user_id;

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

  SELECT hm.id INTO v_existing_member_id
  FROM household_members hm
  WHERE hm.household_id = v_household_id
    AND hm.user_id = p_user_id;

  IF v_existing_member_id IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, 'Compte déjà rattaché à ce foyer'::TEXT, v_household_id;
    RETURN;
  END IF;

  v_member_name := v_profile.first_name || ' ' || v_profile.last_name;

  INSERT INTO household_members (household_id, user_id, name, emoji, role)
  VALUES (v_household_id, p_user_id, v_member_name, NULL, 'adult');

  RETURN QUERY SELECT TRUE, 'Compte réparé avec succès'::TEXT, v_household_id;
END;
$$;

COMMENT ON FUNCTION repair_user_household IS 'Repairs orphaned user accounts by creating missing household_members entries. Used for accounts that signed up with invite codes but failed to join.';
