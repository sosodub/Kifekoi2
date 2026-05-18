/*
  # Disable RLS on household_members table

  1. Problem
    - Infinite recursion error persists despite SECURITY DEFINER function
    - user_is_household_member() still triggers recursion
    - Need to disable RLS temporarily for development

  2. Solution
    - Drop all existing policies on household_members
    - Disable RLS completely on the table
    - Allow unrestricted access for development/testing

  3. Security Note
    - This puts the table in development mode
    - RLS will need to be re-enabled later with proper non-recursive policies
    - For production, implement policies that don't reference household_members
*/

-- Drop all existing policies
DROP POLICY IF EXISTS household_members_delete ON public.household_members;
DROP POLICY IF EXISTS household_members_insert ON public.household_members;
DROP POLICY IF EXISTS household_members_select ON public.household_members;
DROP POLICY IF EXISTS household_members_update ON public.household_members;

-- Disable RLS completely
ALTER TABLE public.household_members DISABLE ROW LEVEL SECURITY;

-- Ensure FORCE RLS is also disabled
ALTER TABLE public.household_members NO FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.household_members IS 
'Household members table - RLS disabled for development. TODO: Re-enable with non-recursive policies.';
