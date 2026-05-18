/*
  # Allow household members to view all members of their household

  1. Problem
    - Current policy only allows users to see their own member entry or entries from households they own
    - Members who join via invite code cannot see other members of the household
    - This prevents proper display of all household members

  2. Solution
    - Add new SELECT policy on household_members table
    - Allow users to view all members of households they belong to
    - Keep existing policies for backwards compatibility

  3. Security
    - Users can only view members of households where they are members themselves
    - Verified through membership check
*/

CREATE POLICY "Members can view all household members"
ON public.household_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM household_members my_membership
    WHERE my_membership.household_id = household_members.household_id
      AND my_membership.user_id = auth.uid()
  )
);

COMMENT ON POLICY "Members can view all household members" ON public.household_members IS 
'Allows household members to view all other members of their household';
