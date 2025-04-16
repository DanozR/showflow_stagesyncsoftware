/*
  # Verify and Update RLS Policies

  1. Changes
    - Verify RLS is enabled on shows and organization_users tables
    - Update policies to handle both organization and personal access
    - Ensure proper access control for all operations

  2. Security
    - Enable RLS on both tables if not already enabled
    - Create or update policies for authenticated users
    - Allow access based on user_id or organization membership
*/

-- Verify RLS is enabled on shows table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'shows' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE shows ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Verify RLS is enabled on organization_users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'organization_users' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own shows" ON shows;
DROP POLICY IF EXISTS "Users can modify their own shows" ON shows;
DROP POLICY IF EXISTS "Users can view organization memberships" ON organization_users;
DROP POLICY IF EXISTS "Users can modify organization memberships" ON organization_users;

-- Create comprehensive policies for shows table
CREATE POLICY "Users can view their own shows"
  ON shows
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify their own shows"
  ON shows
  FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create comprehensive policies for organization_users table
CREATE POLICY "Users can view organization memberships"
  ON organization_users
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can modify organization memberships"
  ON organization_users
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add indexes to improve policy performance
CREATE INDEX IF NOT EXISTS idx_shows_user_id_org_id ON shows(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_users_user_id_role ON organization_users(user_id, role);

-- Verify policies are created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shows' 
    AND policyname = 'Users can view their own shows'
  ) THEN
    RAISE EXCEPTION 'Shows policies not created correctly';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'organization_users' 
    AND policyname = 'Users can view organization memberships'
  ) THEN
    RAISE EXCEPTION 'Organization users policies not created correctly';
  END IF;
END $$;