/*
  # Fix member visibility without recursion

  1. Problem
    - Need members to see other members in same household
    - Cannot query household_members in its own policy (causes recursion)
    - Current policy only shows own entry or entries if owner

  2. Solution
    - Create a SECURITY DEFINER function that checks membership
    - Function bypasses RLS to avoid recursion
    - Use function in policy to check if user belongs to household

  3. Implementation
    - Function: user_is_household_member(p_household_id, p_user_id)
    - Returns boolean indicating membership
    - Policy uses this function to allow viewing
*/

-- Drop the recursive policy if it exists
DROP POLICY IF EXISTS household_members_view_same_household ON public.household_members;

-- Create function to check membership without triggering RLS
CREATE OR REPLACE FUNCTION user_is_household_member(
  p_household_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = p_user_id
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

-- Update SELECT policy to use the function
DROP POLICY IF EXISTS household_members_select ON public.household_members;

CREATE POLICY household_members_select
ON public.household_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.households h
      WHERE h.id = household_members.household_id
        AND h.owner_id = auth.uid()
    )
    OR user_is_household_member(household_members.household_id, auth.uid())
  )
);

COMMENT ON FUNCTION user_is_household_member IS 
'Security definer function to check household membership without triggering RLS recursion';

COMMENT ON POLICY household_members_select ON public.household_members IS 
'Users can view their own entries, all entries from households they own, or entries from households they belong to';
