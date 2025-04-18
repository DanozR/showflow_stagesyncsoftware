/*
  # Simplify Database Schema

  1. Changes
    - Remove organization-related tables and references
    - Simplify shows table to directly use user_id
    - Remove show_versions table
    - Update RLS policies to work with simplified structure

  2. Security
    - Maintain RLS policies for user-based access
    - Ensure users can only access their own shows
*/

-- First, drop policies that depend on organization_users
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Users can view performers in their organizations" ON performers;
DROP POLICY IF EXISTS "Users can view classes in their organizations" ON classes;
DROP POLICY IF EXISTS "Users can view class performers in their organizations" ON class_performers;
DROP POLICY IF EXISTS "Users can view show performances in their organizations" ON show_performances;
DROP POLICY IF EXISTS "Users can view versions of their shows" ON show_versions;
DROP POLICY IF EXISTS "Users can view their own shows" ON shows;
DROP POLICY IF EXISTS "Users can modify their own shows" ON shows;
DROP POLICY IF EXISTS "Users can view organization memberships" ON organization_users;
DROP POLICY IF EXISTS "Users can modify organization memberships" ON organization_users;

-- Drop foreign key constraints that reference organizations
ALTER TABLE shows DROP CONSTRAINT IF EXISTS shows_organization_id_fkey;
ALTER TABLE performers DROP CONSTRAINT IF EXISTS performers_organization_id_fkey;
ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_organization_id_fkey;

-- Drop organization-related tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS organization_users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop show_versions table
DROP TABLE IF EXISTS show_versions CASCADE;

-- Modify shows table to remove organization_id if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shows' AND column_name = 'organization_id'
  ) THEN
    -- We'll keep the existing shows but set organization_id to NULL
    -- This ensures we don't lose any data
    ALTER TABLE shows ALTER COLUMN organization_id DROP NOT NULL;
  END IF;
END $$;

-- Ensure shows table has the correct structure
ALTER TABLE shows 
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS show_name text,
  ADD COLUMN IF NOT EXISTS data jsonb,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add unique constraint on user_id and show_name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'shows_user_id_show_name_key'
  ) THEN
    ALTER TABLE shows ADD CONSTRAINT shows_user_id_show_name_key UNIQUE (user_id, show_name);
  END IF;
END $$;

-- Create new RLS policies for shows table
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

-- Add index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_shows_user_id ON shows(user_id);

-- Update trigger function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure trigger exists on shows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_shows_updated_at'
  ) THEN
    CREATE TRIGGER update_shows_updated_at
      BEFORE UPDATE ON shows
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;