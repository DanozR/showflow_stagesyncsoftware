/*
  # Add version history functionality

  1. Changes to shows table
    - Add user_id for personal shows
    - Add show_name for unique identification
    - Add data column for storing show state
    - Add version column for tracking changes

  2. New Tables
    - show_versions: Stores version history of shows

  3. Security
    - Update RLS policies for shows
    - Add RLS policies for show_versions
    - Add indexes for performance
*/

-- Modify shows table
ALTER TABLE shows
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS show_name text,
  ADD COLUMN IF NOT EXISTS data jsonb,
  ADD COLUMN IF NOT EXISTS version integer DEFAULT 1 NOT NULL;

-- Add unique constraint for show_name per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'shows_user_id_show_name_key'
  ) THEN
    ALTER TABLE shows
      ADD CONSTRAINT shows_user_id_show_name_key UNIQUE (user_id, show_name);
  END IF;
END $$;

-- Add index on user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_shows_user_id'
  ) THEN
    CREATE INDEX idx_shows_user_id ON shows(user_id);
  END IF;
END $$;

-- Create show_versions table
CREATE TABLE IF NOT EXISTS show_versions (
  version_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  version integer NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(show_id, version)
);

-- Enable RLS on show_versions
ALTER TABLE show_versions ENABLE ROW LEVEL SECURITY;

-- Update shows table RLS policies
DO $$
BEGIN
  -- Drop the old policy if it exists
  DROP POLICY IF EXISTS "Users can view shows in their organizations" ON shows;
  
  -- Check if the new policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'shows' 
    AND policyname = 'Users can view their own shows'
  ) THEN
    -- Create the new policy only if it doesn't exist
    CREATE POLICY "Users can view their own shows"
      ON shows
      FOR ALL
      TO authenticated
      USING (
        user_id = auth.uid() OR
        organization_id IN (
          SELECT organization_id FROM organization_users
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Add RLS policies for show_versions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'show_versions' 
    AND policyname = 'Users can view versions of their shows'
  ) THEN
    CREATE POLICY "Users can view versions of their shows"
      ON show_versions
      FOR SELECT
      TO authenticated
      USING (
        show_id IN (
          SELECT id FROM shows
          WHERE user_id = auth.uid() OR
          organization_id IN (
            SELECT organization_id FROM organization_users
            WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Add indexes for show_versions
CREATE INDEX IF NOT EXISTS idx_show_versions_show_id ON show_versions(show_id);
CREATE INDEX IF NOT EXISTS idx_show_versions_version ON show_versions(version);

-- Update trigger function to handle JSONB data
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- If data changed and it's the shows table, increment version
  IF TG_TABLE_NAME = 'shows' AND 
     (OLD.data IS DISTINCT FROM NEW.data OR OLD.data IS NULL) THEN
    NEW.version = OLD.version + 1;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';