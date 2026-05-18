/*
  # Add missing columns and indexes for tasks feature

  1. Changes to tasks table
    - Add `created_by_user_id` column to track who created the task
  
  2. Changes to task_completions table
    - Add `points_awarded` column to track points given for completing tasks
  
  3. New Indexes
    - Index on `tasks.household_id` for faster household task queries
    - Index on `tasks.assigned_member_id` for filtering by assigned member
    - Index on `task_completions.member_id` for member points calculation
    - Index on `task_completions.task_id` for task completion lookups
  
  4. Security
    - RLS is already enabled on tasks and task_completions
    - Will need policies (to be added in next migration if needed)
*/

-- Add created_by_user_id to tasks if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'created_by_user_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN created_by_user_id uuid REFERENCES profiles(id);
  END IF;
END $$;

-- Add points_awarded to task_completions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_completions' AND column_name = 'points_awarded'
  ) THEN
    ALTER TABLE task_completions ADD COLUMN points_awarded int NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_household_id ON tasks(household_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_member_id ON tasks(assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_member_id ON task_completions(member_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
