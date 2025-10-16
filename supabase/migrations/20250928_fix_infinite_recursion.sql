-- ========================================
-- FIX: Infinite Recursion in tenant_members policies
-- ========================================

-- The issue is that tenant_members policies reference tenant_members
-- in a way that causes infinite recursion. We need to fix this.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage tenant_members" ON tenant_members;

-- Recreate with a non-recursive check
-- This uses auth.uid() directly without self-referencing the same table
CREATE POLICY "Admins can manage tenant_members" ON tenant_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM tenant_members tm
        WHERE tm.user_id = auth.uid()
          AND tm.tenant_id = tenant_members.tenant_id
          AND tm.role IN ('admin', 'owner')
          AND tm.id != tenant_members.id  -- Prevent self-reference
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM tenant_members tm
        WHERE tm.user_id = auth.uid()
          AND tm.tenant_id = tenant_members.tenant_id
          AND tm.role IN ('admin', 'owner')
          AND tm.id != tenant_members.id  -- Prevent self-reference
    )
);

-- Also ensure the "Users can view own membership" policy exists
DROP POLICY IF EXISTS "Users can view own membership" ON tenant_members;
CREATE POLICY "Users can view own membership" ON tenant_members
FOR SELECT USING (user_id = auth.uid());

-- Verify policies
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    RAISE NOTICE 'Current tenant_members policies:';
    FOR policy_rec IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'tenant_members'
    LOOP
        RAISE NOTICE '  - %', policy_rec.policyname;
    END LOOP;
END $$;