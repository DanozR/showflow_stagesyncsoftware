/*
  # Initial ShowFlow Database Schema

  1. New Tables
    - `organizations`
    - `organization_users` (junction table)
    - `shows`
    - `performers`
    - `classes`
    - `class_performers` (junction table)
    - `show_performances`

  2. Security
    - Enable RLS on all tables
    - Add policies for organization-based access
    - Add policies for authenticated users

  3. Indexes and Triggers
    - Add indexes for foreign keys
    - Add updated_at triggers
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Organization users junction table
CREATE TABLE IF NOT EXISTS organization_users (
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (organization_id, user_id)
);

-- Enable RLS and create policies for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Enable RLS and create policies for organization_users
ALTER TABLE organization_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view organization memberships"
  ON organization_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Shows table
CREATE TABLE IF NOT EXISTS shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  date date,
  time time,
  location text,
  min_gap int DEFAULT 2,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shows in their organizations"
  ON shows
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Performers table
CREATE TABLE IF NOT EXISTS performers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  external_id text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, external_id)
);

ALTER TABLE performers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view performers in their organizations"
  ON performers
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, name)
);

ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view classes in their organizations"
  ON classes
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Class performers junction table
CREATE TABLE IF NOT EXISTS class_performers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  performer_id uuid REFERENCES performers(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(class_id, performer_id)
);

ALTER TABLE class_performers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view class performers in their organizations"
  ON class_performers
  FOR SELECT
  TO authenticated
  USING (
    class_id IN (
      SELECT id FROM classes
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Show performances table
CREATE TABLE IF NOT EXISTS show_performances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid REFERENCES shows(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  position int,
  title text,
  included boolean DEFAULT true,
  locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(show_id, class_id)
);

ALTER TABLE show_performances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view show performances in their organizations"
  ON show_performances
  FOR SELECT
  TO authenticated
  USING (
    show_id IN (
      SELECT id FROM shows
      WHERE organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organization_users_user_id ON organization_users(user_id);
CREATE INDEX IF NOT EXISTS idx_shows_organization_id ON shows(organization_id);
CREATE INDEX IF NOT EXISTS idx_performers_organization_id ON performers(organization_id);
CREATE INDEX IF NOT EXISTS idx_performers_external_id ON performers(external_id);
CREATE INDEX IF NOT EXISTS idx_classes_organization_id ON classes(organization_id);
CREATE INDEX IF NOT EXISTS idx_class_performers_class_id ON class_performers(class_id);
CREATE INDEX IF NOT EXISTS idx_class_performers_performer_id ON class_performers(performer_id);
CREATE INDEX IF NOT EXISTS idx_show_performances_show_id ON show_performances(show_id);
CREATE INDEX IF NOT EXISTS idx_show_performances_class_id ON show_performances(class_id);

-- Create triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shows_updated_at
  BEFORE UPDATE ON shows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performers_updated_at
  BEFORE UPDATE ON performers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_show_performances_updated_at
  BEFORE UPDATE ON show_performances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();