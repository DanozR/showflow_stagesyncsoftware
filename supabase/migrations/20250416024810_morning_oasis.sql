/*
  # Verify Foreign Key References

  1. Changes
    - Verify user_id columns reference auth.users(id)
    - Add missing foreign key constraints if needed
    - Add indexes for foreign key columns

  2. Security
    - Ensure referential integrity
    - Maintain data consistency
    - Add appropriate cascade behavior
*/

-- Verify shows.user_id foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'shows'
    AND constraint_name = 'shows_user_id_fkey'
  ) THEN
    ALTER TABLE shows
      ADD CONSTRAINT shows_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id);
  END IF;
END $$;

-- Verify organization_users.user_id foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'organization_users'
    AND constraint_name = 'organization_users_user_id_fkey'
  ) THEN
    ALTER TABLE organization_users
      ADD CONSTRAINT organization_users_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add indexes for foreign keys if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'shows'
    AND indexname = 'idx_shows_user_id'
  ) THEN
    CREATE INDEX idx_shows_user_id ON shows(user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'organization_users'
    AND indexname = 'idx_organization_users_user_id'
  ) THEN
    CREATE INDEX idx_organization_users_user_id ON organization_users(user_id);
  END IF;
END $$;

-- Verify constraints exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'shows'
    AND constraint_name = 'shows_user_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Shows user_id foreign key constraint not created correctly';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'organization_users'
    AND constraint_name = 'organization_users_user_id_fkey'
  ) THEN
    RAISE EXCEPTION 'Organization users user_id foreign key constraint not created correctly';
  END IF;
END $$;