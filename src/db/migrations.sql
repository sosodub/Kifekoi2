-- =====================================================
-- KIFÉKOI DATABASE SCHEMA
-- Multi-household task management application
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- =====================================================
-- Stores user profile information linked to Supabase Auth
-- Each auth.users row has a corresponding profile

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  birthdate date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 2. HOUSEHOLDS TABLE
-- =====================================================
-- Represents a family/household unit
-- Contains unique invite code for adding new members

CREATE TABLE IF NOT EXISTS households (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text UNIQUE NOT NULL,
  owner_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_households_owner_id ON households(owner_id);
CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code);

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read households they belong to" ON households;
CREATE POLICY "Users can read households they belong to"
  ON households
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = households.id
      AND household_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Owners can insert households" ON households;
CREATE POLICY "Owners can insert households"
  ON households
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their households" ON households;
CREATE POLICY "Owners can update their households"
  ON households
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their households" ON households;
CREATE POLICY "Owners can delete their households"
  ON households
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- =====================================================
-- 3. HOUSEHOLD_MEMBERS TABLE
-- =====================================================
-- All members visible on "Mon foyer" page
-- Includes adults with accounts (user_id NOT NULL)
-- and children without phones (user_id NULL)

CREATE TABLE IF NOT EXISTS household_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NULL,
  user_id uuid NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'adult', 'child')),
  points int DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON household_members(household_id);
CREATE INDEX IF NOT EXISTS idx_household_members_user_id ON household_members(user_id);

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read household members" ON household_members;
CREATE POLICY "Members can read household members"
  ON household_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Adults can insert household members" ON household_members;
CREATE POLICY "Adults can insert household members"
  ON household_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'adult')
    )
  );

DROP POLICY IF EXISTS "Adults can update household members" ON household_members;
CREATE POLICY "Adults can update household members"
  ON household_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'adult')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'adult')
    )
  );

DROP POLICY IF EXISTS "Adults can delete household members" ON household_members;
CREATE POLICY "Adults can delete household members"
  ON household_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'adult')
    )
  );

-- =====================================================
-- 4. TASKS TABLE
-- =====================================================
-- Tasks within a household
-- Can be assigned to specific members or unassigned

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NULL,
  status text NOT NULL CHECK (status IN ('pending', 'done')) DEFAULT 'pending',
  assigned_member_id uuid NULL REFERENCES household_members(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_household_id ON tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_member_id ON tasks(assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read household tasks" ON tasks;
CREATE POLICY "Members can read household tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = tasks.household_id
      AND household_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Adults can insert tasks" ON tasks;
CREATE POLICY "Adults can insert tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = tasks.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role IN ('owner', 'adult')
    )
  );

DROP POLICY IF EXISTS "Members can update tasks" ON tasks;
CREATE POLICY "Members can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = tasks.household_id
      AND household_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = tasks.household_id
      AND household_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Adults can delete tasks" ON tasks;
CREATE POLICY "Adults can delete tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM household_members
      WHERE household_members.household_id = tasks.household_id
      AND household_members.user_id = auth.uid()
      AND household_members.role IN ('owner', 'adult')
    )
  );

-- =====================================================
-- 5. TASK_COMPLETIONS TABLE
-- =====================================================
-- Records when a task is completed
-- Tracks who completed it and who validated it

CREATE TABLE IF NOT EXISTS task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES household_members(id) ON DELETE CASCADE,
  done_by_user_id uuid NULL REFERENCES profiles(id) ON DELETE SET NULL,
  done_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_member_id ON task_completions(member_id);

ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can read task completions" ON task_completions;
CREATE POLICY "Members can read task completions"
  ON task_completions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN household_members ON household_members.household_id = tasks.household_id
      WHERE tasks.id = task_completions.task_id
      AND household_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Members can insert task completions" ON task_completions;
CREATE POLICY "Members can insert task completions"
  ON task_completions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN household_members ON household_members.household_id = tasks.household_id
      WHERE tasks.id = task_completions.task_id
      AND household_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Adults can delete task completions" ON task_completions;
CREATE POLICY "Adults can delete task completions"
  ON task_completions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN household_members ON household_members.household_id = tasks.household_id
      WHERE tasks.id = task_completions.task_id
      AND household_members.user_id = auth.uid()
      AND household_members.role IN ('owner', 'adult')
    )
  );

-- =====================================================
-- 6. AUTOMATIC PROFILE CREATION TRIGGER
-- =====================================================
-- Automatically creates a profile when a user signs up

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, birthdate)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'birthdate')::date, CURRENT_DATE)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 7. UTILITY FUNCTION: GENERATE INVITE CODE
-- =====================================================
-- Generates a unique 6-character alphanumeric invite code

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
