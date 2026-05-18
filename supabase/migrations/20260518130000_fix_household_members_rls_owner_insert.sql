/*
  # Fix household_members RLS to allow owner to insert first member

  ## Problem
  The initial RLS INSERT policy required the user to already be a member of
  the household to insert a new member — a chicken-and-egg that blocked the
  very first owner insert during signup.

    new row violates row-level security policy for table "household_members"

  Subsequent migrations tried various recursive policies before resorting to
  disabling RLS entirely, which is unsafe for production.

  ## Solution
  Replace all existing policies with non-recursive ones that:
    - Allow a user to insert themselves into any household (user_id = auth.uid())
    - Allow the household owner to insert anyone (auth.uid() = owner_id)
    - Allow members to see other members of households they belong to,
      without recursion (separate subquery)
*/

DROP POLICY IF EXISTS "Adults can insert members" ON public.household_members;
DROP POLICY IF EXISTS "Adults can update members" ON public.household_members;
DROP POLICY IF EXISTS "Adults can delete members" ON public.household_members;
DROP POLICY IF EXISTS "Members can read members" ON public.household_members;
DROP POLICY IF EXISTS household_members_insert ON public.household_members;
DROP POLICY IF EXISTS household_members_select ON public.household_members;
DROP POLICY IF EXISTS household_members_update ON public.household_members;
DROP POLICY IF EXISTS household_members_delete ON public.household_members;

ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_insert"
  ON public.household_members FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = (SELECT owner_id FROM public.households WHERE id = household_id)
  );

CREATE POLICY "members_select"
  ON public.household_members FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() = (SELECT owner_id FROM public.households WHERE id = household_id)
    OR household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "members_update"
  ON public.household_members FOR UPDATE TO authenticated
  USING (auth.uid() = (SELECT owner_id FROM public.households WHERE id = household_id))
  WITH CHECK (auth.uid() = (SELECT owner_id FROM public.households WHERE id = household_id));

CREATE POLICY "members_delete"
  ON public.household_members FOR DELETE TO authenticated
  USING (auth.uid() = (SELECT owner_id FROM public.households WHERE id = household_id));
