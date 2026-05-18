/*
  # Kifékoi Initial Schema

  1. New Tables
    - profiles: User profile information
    - households: Family/household units  
    - household_members: Members of households
    - tasks: Household tasks
    - task_completions: Task completion records

  2. Security
    - Enable RLS on all tables
    - Restrictive policies for data access

  3. Functions
    - handle_new_user(): Auto-creates profile on signup
    - generate_invite_code(): Generates unique codes
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  birthdate date NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

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

CREATE POLICY "Owners can insert households" ON households FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update households" ON households FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete households" ON households FOR DELETE TO authenticated USING (auth.uid() = owner_id);

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

CREATE POLICY "Members can read members" ON household_members FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = household_members.household_id AND hm.user_id = auth.uid()));
CREATE POLICY "Adults can insert members" ON household_members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = household_members.household_id AND hm.user_id = auth.uid() AND hm.role IN ('owner', 'adult')));
CREATE POLICY "Adults can update members" ON household_members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = household_members.household_id AND hm.user_id = auth.uid() AND hm.role IN ('owner', 'adult'))) WITH CHECK (EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = household_members.household_id AND hm.user_id = auth.uid() AND hm.role IN ('owner', 'adult')));
CREATE POLICY "Adults can delete members" ON household_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM household_members hm WHERE hm.household_id = household_members.household_id AND hm.user_id = auth.uid() AND hm.role IN ('owner', 'adult')));

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'households' AND policyname = 'Users can read households'
  ) THEN
    CREATE POLICY "Users can read households" ON households FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM household_members WHERE household_members.household_id = households.id AND household_members.user_id = auth.uid()));
  END IF;
END $$;

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

CREATE POLICY "Members can read tasks" ON tasks FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM household_members WHERE household_members.household_id = tasks.household_id AND household_members.user_id = auth.uid()));
CREATE POLICY "Adults can insert tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM household_members WHERE household_members.household_id = tasks.household_id AND household_members.user_id = auth.uid() AND household_members.role IN ('owner', 'adult')));
CREATE POLICY "Members can update tasks" ON tasks FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM household_members WHERE household_members.household_id = tasks.household_id AND household_members.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM household_members WHERE household_members.household_id = tasks.household_id AND household_members.user_id = auth.uid()));
CREATE POLICY "Adults can delete tasks" ON tasks FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM household_members WHERE household_members.household_id = tasks.household_id AND household_members.user_id = auth.uid() AND household_members.role IN ('owner', 'adult')));

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

CREATE POLICY "Members can read completions" ON task_completions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM tasks JOIN household_members ON household_members.household_id = tasks.household_id WHERE tasks.id = task_completions.task_id AND household_members.user_id = auth.uid()));
CREATE POLICY "Members can insert completions" ON task_completions FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM tasks JOIN household_members ON household_members.household_id = tasks.household_id WHERE tasks.id = task_completions.task_id AND household_members.user_id = auth.uid()));
CREATE POLICY "Adults can delete completions" ON task_completions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM tasks JOIN household_members ON household_members.household_id = tasks.household_id WHERE tasks.id = task_completions.task_id AND household_members.user_id = auth.uid() AND household_members.role IN ('owner', 'adult')));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.profiles (id, first_name, last_name, email, birthdate) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'first_name', ''), COALESCE(NEW.raw_user_meta_data->>'last_name', ''), NEW.email, COALESCE((NEW.raw_user_meta_data->>'birthdate')::date, CURRENT_DATE)) ON CONFLICT (id) DO NOTHING; RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS text AS $$ DECLARE chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; result text := ''; i integer; BEGIN FOR i IN 1..6 LOOP result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1); END LOOP; RETURN result; END; $$ LANGUAGE plpgsql;
