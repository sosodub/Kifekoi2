/*
  # Reset household_members RLS policies to fix infinite recursion

  1. Problem
    - "Members can view all household members" policy causes infinite recursion
    - The policy has a subquery that reads from household_members itself
    - This creates a circular dependency causing the recursion error

  2. Solution
    - Drop ALL existing policies on household_members
    - Create 4 simple policies (SELECT, INSERT, UPDATE, DELETE)
    - NEVER use household_members in a FROM or JOIN within these policies
    - Only reference the current row's columns and households table

  3. New Policies
    - SELECT: Users can see their own entries OR all entries from households they own
    - INSERT: Users can insert for themselves OR owners can insert for their household
    - UPDATE: Only household owners can update members
    - DELETE: Only household owners can delete members

  4. Security
    - No recursion - policies only reference households table
    - Clear ownership model
    - Self-service for joining, owner control for management
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Members can view all household members" ON public.household_members;
DROP POLICY IF EXISTS "Owners can delete household members" ON public.household_members;
DROP POLICY IF EXISTS "Owners can insert household members" ON public.household_members;
DROP POLICY IF EXISTS "Owners can update household members" ON public.household_members;
DROP POLICY IF EXISTS "Users can view household members" ON public.household_members;

-- Ensure RLS is enabled
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own entries OR all entries from households they own
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
  )
);

-- INSERT: Users can insert for themselves OR owners can insert for their household
CREATE POLICY household_members_insert
ON public.household_members
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.households h
      WHERE h.id = household_id
        AND h.owner_id = auth.uid()
    )
  )
);

-- UPDATE: Only household owners can update members
CREATE POLICY household_members_update
ON public.household_members
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.households h
    WHERE h.id = household_members.household_id
      AND h.owner_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.households h
    WHERE h.id = household_members.household_id
      AND h.owner_id = auth.uid()
  )
);

-- DELETE: Only household owners can delete members
CREATE POLICY household_members_delete
ON public.household_members
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.households h
    WHERE h.id = household_members.household_id
      AND h.owner_id = auth.uid()
  )
);

COMMENT ON POLICY household_members_select ON public.household_members IS 
'Users can view their own member entries or all members of households they own';

COMMENT ON POLICY household_members_insert ON public.household_members IS 
'Users can insert themselves or owners can insert members for their household';

COMMENT ON POLICY household_members_update ON public.household_members IS 
'Only household owners can update member entries';

COMMENT ON POLICY household_members_delete ON public.household_members IS 
'Only household owners can delete member entries';
