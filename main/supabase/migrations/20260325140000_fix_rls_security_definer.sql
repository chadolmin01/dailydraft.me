-- Fix self-referential RLS using SECURITY DEFINER function
-- This function runs with table owner privileges, bypassing RLS,
-- so the policy subquery doesn't recursively apply the same policy.

CREATE OR REPLACE FUNCTION get_user_institution_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT institution_id FROM institution_members WHERE user_id = uid;
$$;

CREATE OR REPLACE FUNCTION get_user_admin_institution_ids(uid uuid)
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT institution_id FROM institution_members WHERE user_id = uid AND role = 'admin';
$$;

-- Drop all existing institution_members policies and recreate with SECURITY DEFINER functions
DROP POLICY IF EXISTS inst_members_select ON institution_members;
DROP POLICY IF EXISTS inst_members_insert_admin ON institution_members;
DROP POLICY IF EXISTS inst_members_update_admin ON institution_members;
DROP POLICY IF EXISTS inst_members_delete_admin ON institution_members;

CREATE POLICY inst_members_select ON institution_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR institution_id IN (SELECT get_user_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY inst_members_insert_admin ON institution_members FOR INSERT
  WITH CHECK (
    institution_id IN (SELECT get_user_admin_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY inst_members_update_admin ON institution_members FOR UPDATE
  USING (
    institution_id IN (SELECT get_user_admin_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY inst_members_delete_admin ON institution_members FOR DELETE
  USING (
    institution_id IN (SELECT get_user_admin_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

-- Also fix institutions and institution_programs policies
DROP POLICY IF EXISTS institutions_select_member ON institutions;
DROP POLICY IF EXISTS institutions_update_admin ON institutions;
DROP POLICY IF EXISTS inst_programs_select ON institution_programs;
DROP POLICY IF EXISTS inst_programs_manage_admin ON institution_programs;

CREATE POLICY institutions_select_member ON institutions FOR SELECT
  USING (
    id IN (SELECT get_user_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY institutions_update_admin ON institutions FOR UPDATE
  USING (
    id IN (SELECT get_user_admin_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY inst_programs_select ON institution_programs FOR SELECT
  USING (
    institution_id IN (SELECT get_user_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

CREATE POLICY inst_programs_manage_admin ON institution_programs FOR ALL
  USING (
    institution_id IN (SELECT get_user_admin_institution_ids(auth.uid()))
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

-- S6: Add CHECK constraint on role column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'institution_members_valid_role'
  ) THEN
    ALTER TABLE institution_members
      ADD CONSTRAINT institution_members_valid_role
      CHECK (role IN ('student', 'mentor', 'admin'));
  END IF;
END $$;
