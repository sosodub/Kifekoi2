/*
  # Allow household members to view their household

  1. Problem
    - Current RLS policy only allows owners to view households (owner_id = auth.uid())
    - Members who join via invite code cannot view the household details
    - This causes "Foyer introuvable" error after successful join

  2. Solution
    - Add new SELECT policy on households table
    - Allow users who are members (via household_members) to view the household
    - Keep existing owner policy for backwards compatibility

  3. Security
    - Users can only view households where they are members
    - Checked via household_members table
    - Does not allow viewing arbitrary households
*/

CREATE POLICY "Members can view their household"
ON public.households
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM household_members hm
    WHERE hm.household_id = households.id
      AND hm.user_id = auth.uid()
  )
);

COMMENT ON POLICY "Members can view their household" ON public.households IS 
'Allows household members to view household details after joining via invite code';
