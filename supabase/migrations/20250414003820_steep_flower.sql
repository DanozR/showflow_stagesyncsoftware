/*
  # Add Show Versioning Support

  1. Changes
    - Add user_id, show_name, data, and version columns to shows table
    - Create show_versions table for version history
    - Update RLS policies for shows table
    - Add RLS policies for show_versions table
    - Add indexes for efficient querying
    - Update trigger function to handle versioning

  2. Security
    - Enable RLS on show_versions table
    - Add policies for authenticated users
    - Ensure users can only access their own shows and versions

  3. Notes
    - show_name must be unique per user
    - version is automatically incremented when data changes
    - show_versions maintains a history of all changes
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
  -- Drop any existing policies on shows table
  DROP POLICY IF EXISTS "Users can view shows in their organizations" ON shows;
  DROP POLICY IF EXISTS "Users can view their own shows" ON shows;
  
  -- Create new policy
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
END $$;

-- Add RLS policies for show_versions
DO $$
BEGIN
  -- Drop any existing policies on show_versions table
  DROP POLICY IF EXISTS "Users can view versions of their shows" ON show_versions;
  
  -- Create new policy
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