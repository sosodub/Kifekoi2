/*
  # Add emoji and points columns to tasks table

  1. Changes
    - Add `emoji` column to tasks table (text, nullable)
    - Add `points` column to tasks table (integer, default 4)
  
  2. Notes
    - Existing tasks will get default values (null for emoji, 4 for points)
    - These fields are used to display task icons and point values
*/

-- Add emoji column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'emoji'
  ) THEN
    ALTER TABLE tasks ADD COLUMN emoji text;
  END IF;
END $$;

-- Add points column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'points'
  ) THEN
    ALTER TABLE tasks ADD COLUMN points integer DEFAULT 4;
  END IF;
END $$;