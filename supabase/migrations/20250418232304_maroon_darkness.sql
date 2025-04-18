/*
  # Simplify Database Schema

  1. Changes
    - Remove organization-related tables and constraints
    - Simplify shows table structure
    - Add user-based access control
    - Remove versioning

  2. Security
    - Enable RLS on shows table
    - Add policies for authenticated users
    - Ensure proper indexes for performance
*/

-- First check if tables exist before trying to drop policies
DO $$
BEGIN
  -- Drop policies only if the related tables exist
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'shows') THEN
    DROP POLICY IF EXISTS "Users can view their own shows" ON shows;
    DROP POLICY IF EXISTS "Users can modify their own shows" ON shows;
  END IF;
END $$;

-- Drop tables if they exist
DROP TABLE IF EXISTS show_performances CASCADE;
DROP TABLE IF EXISTS class_performers CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS performers CASCADE;
DROP TABLE IF EXISTS show_versions CASCADE;

-- Create or modify shows table
CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  show_name text,
  name text,
  data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add unique constraint on user_id and show_name
ALTER TABLE shows 
  DROP CONSTRAINT IF EXISTS shows_user_id_show_name_key;

ALTER TABLE shows 
  ADD CONSTRAINT shows_user_id_show_name_key UNIQUE (user_id, show_name);

-- Enable RLS on shows table
ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own shows"
  ON shows
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can modify their own shows"
  ON shows
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shows_user_id ON shows(user_id);
CREATE INDEX IF NOT EXISTS idx_shows_created_at ON shows(created_at DESC);

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_shows_updated_at ON shows;

CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON shows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();