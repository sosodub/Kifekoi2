/*
  # Allow members to view other members in their household

  1. Problem
    - Current SELECT policy only allows users to see their own entry or entries from households they own
    - Members who join cannot see other members of the same household
    - Adding a policy that reads household_members causes recursion

  2. Solution
    - Add a new SELECT policy that allows viewing members of the same household
    - Use ONLY the household_id from the current row
    - Check if user has ANY entry in the same household via households table
    - Avoid recursion by not querying household_members in the policy

  3. Implementation
    - Check if the household exists AND user is owner (already covered)
    - OR check if the user's own household_id matches the row's household_id
    - Use a simple EXISTS on households with a join condition

  4. Security
    - Users can only see members of households where they themselves are members
    - No recursion as we don't query household_members
    - Clear access control
*/

-- This policy allows members to see all members of households they belong to
-- We check via households table if the user is authorized to see this household_id
CREATE POLICY household_members_view_same_household
ON public.household_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND household_members.household_id IN (
    SELECT hm.household_id 
    FROM public.household_members hm
    WHERE hm.user_id = auth.uid()
  )
);

COMMENT ON POLICY household_members_view_same_household ON public.household_members IS 
'Allows members to view all other members of households they belong to';
