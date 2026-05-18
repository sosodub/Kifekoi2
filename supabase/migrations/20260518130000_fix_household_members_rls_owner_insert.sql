/*
  # Fix RLS cross-table recursion between household_members and households

  ## Problem
  Two intersecting issues caused the app to be unusable:

  1. The initial INSERT policy on household_members required the user to
     already be a member of the household — chicken-and-egg that blocked
     the first owner insert during signup.

  2. The SELECT policies cross-referenced each other: household_members
     policy queried households, households "Members can view" policy
     queried household_members. Postgres detected infinite recursion at
     runtime as soon as a member tried to read either table.

  ## Solution
  Use two SECURITY DEFINER plpgsql functions with `SET row_security = off`
  to break the cycle. The functions bypass RLS for the lookup, so a policy
  on table A that calls a function querying table B does not trigger B's
  RLS, eliminating the cross-recursion.

    is_household_owner(uuid) → bool
    is_household_member(uuid) → bool

  Policies are then rewritten to use these helpers instead of EXISTS
  subqueries against the other table.
*/

DROP POLICY IF EXISTS "Adults can insert members" ON public.household_members;
DROP POLICY IF EXISTS "Adults can update members" ON public.household_members;
DROP POLICY IF EXISTS "Adults can delete members" ON public.household_members;
DROP POLICY IF EXISTS "Members can read members" ON public.household_members;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.household_members;
DROP POLICY IF EXISTS household_members_insert ON public.household_members;
DROP POLICY IF EXISTS household_members_select ON public.household_members;
DROP POLICY IF EXISTS household_members_update ON public.household_members;
DROP POLICY IF EXISTS household_members_delete ON public.household_members;
DROP POLICY IF EXISTS members_insert ON public.household_members;
DROP POLICY IF EXISTS members_select ON public.household_members;
DROP POLICY IF EXISTS members_select_self ON public.household_members;
DROP POLICY IF EXISTS members_select_owner ON public.household_members;
DROP POLICY IF EXISTS members_update ON public.household_members;
DROP POLICY IF EXISTS members_delete ON public.household_members;

DROP POLICY IF EXISTS "Members can view their household" ON public.households;
DROP POLICY IF EXISTS "Owners can view their households" ON public.households;
DROP POLICY IF EXISTS "Users can read households" ON public.households;
DROP POLICY IF EXISTS households_select ON public.households;

DROP FUNCTION IF EXISTS public.user_household_ids();
DROP FUNCTION IF EXISTS public.is_household_owner(uuid);
DROP FUNCTION IF EXISTS public.is_household_member(uuid);

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_household_owner(p_household_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE result boolean;
BEGIN
  SELECT (owner_id = auth.uid()) INTO result
    FROM public.households WHERE id = p_household_id;
  RETURN COALESCE(result, false);
END;
$$;
REVOKE ALL ON FUNCTION public.is_household_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_household_owner(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_household_member(p_household_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
SET row_security = off
AS $$
DECLARE result boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.household_members
    WHERE household_id = p_household_id AND user_id = auth.uid()
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.is_household_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_household_member(uuid) TO authenticated;

CREATE POLICY households_select
  ON public.households FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_household_member(id));

CREATE POLICY members_insert
  ON public.household_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_household_owner(household_id)
  );

CREATE POLICY members_select
  ON public.household_members FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_household_owner(household_id)
    OR public.is_household_member(household_id)
  );

CREATE POLICY members_update
  ON public.household_members FOR UPDATE TO authenticated
  USING (public.is_household_owner(household_id))
  WITH CHECK (public.is_household_owner(household_id));

CREATE POLICY members_delete
  ON public.household_members FOR DELETE TO authenticated
  USING (public.is_household_owner(household_id));
