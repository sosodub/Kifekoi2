/*
  # Fix household_members RLS recursive policies

  1. Problem
    - Current policies on household_members query household_members itself
    - This causes "infinite recursion detected" error in Postgres
    - Occurs when navigating or performing operations on the household

  2. Solution
    - Replace all recursive policies with non-recursive ones
    - Use households table to check permissions instead
    - Allow users to see their own member record OR members of households they own
    - Allow owners to insert/update/delete members in their households

  3. New Policies
    - SELECT: User can see own record OR records in households they own
    - INSERT: Only household owners can add members
    - UPDATE: Only household owners can update members
    - DELETE: Only household owners can delete members

  4. Security
    - Maintains multi-household support
    - Preserves owner-based access control
    - Eliminates recursive policy checks
*/

-- Drop all existing policies on household_members
DROP POLICY IF EXISTS "Members can read members" ON public.household_members;
DROP POLICY IF EXISTS "Adults can insert members" ON public.household_members;
DROP POLICY IF EXISTS "Adults can update members" ON public.household_members;
DROP POLICY IF EXISTS "Adults can delete members" ON public.household_members;

-- SELECT policy: Users can see their own member record OR members of households they own
CREATE POLICY "Users can view household members"
ON public.household_members
FOR SELECT
TO authenticated
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

-- INSERT policy: Only household owners can add members
CREATE POLICY "Owners can insert household members"
ON public.household_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.households h
    WHERE h.id = household_id
    AND h.owner_id = auth.uid()
  )
);

-- UPDATE policy: Only household owners can update members
CREATE POLICY "Owners can update household members"
ON public.household_members
FOR UPDATE
TO authenticated
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

-- DELETE policy: Only household owners can delete members
CREATE POLICY "Owners can delete household members"
ON public.household_members
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.households h
    WHERE h.id = household_members.household_id
    AND h.owner_id = auth.uid()
  )
);
