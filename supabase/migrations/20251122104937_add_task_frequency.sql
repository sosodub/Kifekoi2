/*
  # Add frequency fields to tasks

  1. Changes
    - Add `frequency_count` column (int, nullable) - Number of times to repeat
    - Add `frequency_unit` column (text, nullable) - Unit: 'day', 'week', 'month', 'year', 'unique'
    - Add `last_recreated_at` column (timestamptz, nullable) - Track when task was last recreated
    - Add index on frequency fields for efficient queries
  
  2. Notes
    - NULL frequency means no recurrence (one-time task)
    - 'unique' is for non-recurring tasks
    - frequency_count represents "X times per [unit]"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'frequency_count'
  ) THEN
    ALTER TABLE tasks ADD COLUMN frequency_count int NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'frequency_unit'
  ) THEN
    ALTER TABLE tasks ADD COLUMN frequency_unit text NULL CHECK (frequency_unit IN ('day', 'week', 'month', 'year', 'unique'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'last_recreated_at'
  ) THEN
    ALTER TABLE tasks ADD COLUMN last_recreated_at timestamptz NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tasks_frequency ON tasks(frequency_unit, last_recreated_at) WHERE frequency_unit IS NOT NULL;