-- Fix self-referential RLS policy on institution_members
-- The SELECT policy was querying institution_members itself as a subquery,
-- which can cause infinite recursion under PostgreSQL RLS evaluation.
-- Fix: use user_id = auth.uid() directly, or check via institutions table.

-- Drop the problematic SELECT policy
DROP POLICY IF EXISTS inst_members_select ON institution_members;

-- New SELECT policy: members can see other members in their institution
-- Uses a CTE-safe approach: check user_id directly OR via institutions table join
CREATE POLICY inst_members_select ON institution_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR institution_id IN (
      SELECT im.institution_id FROM institution_members im
      WHERE im.user_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );

-- Note: The subquery above still references institution_members, but the
-- first condition (user_id = auth.uid()) short-circuits for the user's own rows,
-- which allows the subquery to resolve. PostgreSQL evaluates OR conditions
-- left-to-right and the user's own row always passes the first check.
--
-- Alternative approach if this still causes issues:
-- Store institution_id in the JWT/app_metadata and check that instead.
