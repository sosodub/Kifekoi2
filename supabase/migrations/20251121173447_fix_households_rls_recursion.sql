/*
  # Fix households RLS recursive policies

  1. Problem
    - SELECT policy on households queries household_members table
    - household_members policies query households table back
    - This creates a circular dependency causing "infinite recursion detected"
    - Occurs when loading household data

  2. Solution
    - Replace all policies with simple owner-based checks
    - Use only owner_id = auth.uid() without any subqueries
    - No cross-table queries between households and household_members in policies
    - Keep security by restricting access to owned households only

  3. New Policies
    - SELECT: Users can only see households they own
    - INSERT: Users can only create households where they are owner
    - UPDATE: Users can only update their own households
    - DELETE: Users can only delete their own households

  4. Security
    - Simple and performant
    - No recursive queries
    - Owner-based access control
    - Prevents unauthorized access
*/

-- Drop all existing policies on households
DROP POLICY IF EXISTS "Users can read households" ON public.households;
DROP POLICY IF EXISTS "Owners can insert households" ON public.households;
DROP POLICY IF EXISTS "Owners can update households" ON public.households;
DROP POLICY IF EXISTS "Owners can delete households" ON public.households;

-- SELECT policy: Users can only see households they own
CREATE POLICY "Owners can view their households"
ON public.households
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);

-- INSERT policy: Users can only create households where they are owner
CREATE POLICY "Users can create households as owner"
ON public.households
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);

-- UPDATE policy: Users can only update their own households
CREATE POLICY "Owners can update their households"
ON public.households
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);

-- DELETE policy: Users can only delete their own households
CREATE POLICY "Owners can delete their households"
ON public.households
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND owner_id = auth.uid()
);
