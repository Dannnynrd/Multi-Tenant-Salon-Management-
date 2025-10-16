-- ========================================
-- FIX: Memberships Role Dependencies ZUERST
-- ========================================
-- Muss VOR dem Rename zu tenant_members ausgeführt werden

-- 1. Erstelle Role ENUM falls noch nicht vorhanden
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_role') THEN
        CREATE TYPE tenant_role AS ENUM ('owner', 'admin', 'staff', 'member');
    END IF;
END $$;

-- 2. Arbeite mit MEMBERSHIPS (noch nicht renamed!)
DO $$
BEGIN
    -- Check ob memberships existiert
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'memberships'
    ) THEN
        RAISE EXCEPTION 'Table memberships does not exist!';
    END IF;

    -- Füge neue role Spalte hinzu wenn noch nicht vorhanden
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'memberships' AND column_name = 'role_new'
    ) THEN
        -- Füge neue Spalte hinzu
        ALTER TABLE memberships ADD COLUMN role_new tenant_role;

        -- Migriere Daten
        UPDATE memberships SET role_new =
            CASE role
                WHEN 'owner' THEN 'owner'::tenant_role
                WHEN 'admin' THEN 'admin'::tenant_role
                WHEN 'mitarbeiter' THEN 'staff'::tenant_role
                WHEN 'staff' THEN 'staff'::tenant_role
                ELSE 'member'::tenant_role
            END;

        -- Setze NOT NULL
        ALTER TABLE memberships ALTER COLUMN role_new SET NOT NULL;
    END IF;
END $$;

-- 3. Update alle Policies die memberships.role referenzieren

-- Service categories policies
DROP POLICY IF EXISTS service_categories_delete ON service_categories;
CREATE POLICY service_categories_delete ON service_categories
FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner')
    )
);

DROP POLICY IF EXISTS "Admins can manage service_categories" ON service_categories;
CREATE POLICY "Admins can manage service_categories" ON service_categories
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner')
    )
);

-- Services policies
DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services" ON services
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner')
    )
);

-- Appointments policies
DROP POLICY IF EXISTS appointments_delete ON appointments;
CREATE POLICY appointments_delete ON appointments
FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner')
    )
    OR
    staff_id IN (
        SELECT id FROM staff WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Staff can manage own appointments" ON appointments;
CREATE POLICY "Staff can manage own appointments" ON appointments
FOR ALL USING (
    staff_id IN (
        SELECT id FROM staff WHERE user_id = auth.uid()
    )
    OR
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner')
    )
);

-- Customers policies
DROP POLICY IF EXISTS "Staff can manage customers" ON customers;
CREATE POLICY "Staff can manage customers" ON customers
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner', 'staff')
    )
);

-- 4. Update tenant_statistics view
DROP VIEW IF EXISTS tenant_statistics CASCADE;
CREATE VIEW tenant_statistics AS
SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug,
    -- Staff Statistiken
    COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true) as active_staff_count,
    COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = false) as inactive_staff_count,
    COUNT(DISTINCT s.id) as total_staff_count,
    -- User Statistiken mit role_new
    COUNT(DISTINCT m.user_id) as total_members,
    COUNT(DISTINCT m.user_id) FILTER (WHERE COALESCE(m.role_new, 'member'::tenant_role) = 'admin') as admin_count,
    COUNT(DISTINCT m.user_id) FILTER (WHERE COALESCE(m.role_new, 'member'::tenant_role) = 'owner') as owner_count,
    -- Aktivität
    MAX(s.updated_at) as last_staff_activity,
    t.created_at,
    t.updated_at
FROM tenants t
LEFT JOIN staff s ON t.id = s.tenant_id
LEFT JOIN memberships m ON t.id = m.tenant_id
GROUP BY t.id, t.name, t.slug, t.created_at, t.updated_at;

-- 5. Finde und update alle anderen Policies
DO $$
DECLARE
    policy_rec RECORD;
    policy_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking for other policies using memberships.role...';

    -- Check alle Policies auf memberships
    FOR policy_rec IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE tablename = 'memberships'
    LOOP
        RAISE NOTICE 'Found policy on memberships: %', policy_rec.policyname;
        policy_count := policy_count + 1;
    END LOOP;

    -- Recreate common memberships policies mit role_new
    DROP POLICY IF EXISTS "Users can view own membership" ON memberships;
    CREATE POLICY "Users can view own membership" ON memberships
    FOR SELECT USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "Admins can manage memberships" ON memberships;
    CREATE POLICY "Admins can manage memberships" ON memberships
    FOR ALL USING (
        tenant_id IN (
            SELECT tenant_id FROM memberships m2
            WHERE m2.user_id = auth.uid()
              AND COALESCE(m2.role_new, 'member'::tenant_role) IN ('admin', 'owner')
        )
    );

    RAISE NOTICE 'Updated % policies', policy_count;
END $$;

-- 6. JETZT role_old entfernen und role_new zu role umbenennen
DO $$
BEGIN
    -- Check ob beide Spalten existieren
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'memberships' AND column_name = 'role_new'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'memberships' AND column_name = 'role'
    ) THEN
        -- Sichere alte role Spalte entfernen mit CASCADE (recreated alle abhängigen Views)
        ALTER TABLE memberships DROP COLUMN role CASCADE;

        -- Rename role_new zu role
        ALTER TABLE memberships RENAME COLUMN role_new TO role;

        RAISE NOTICE 'Successfully migrated memberships.role to ENUM type';
    ELSE
        RAISE NOTICE 'Skipping role migration - already done or not needed';
    END IF;
END $$;

-- 7. Recreate views die durch CASCADE gedroppt wurden
-- tenant_statistics (mit korrekter role Spalte)
CREATE OR REPLACE VIEW tenant_statistics AS
SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug,
    -- Staff Statistiken
    COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true) as active_staff_count,
    COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = false) as inactive_staff_count,
    COUNT(DISTINCT s.id) as total_staff_count,
    -- User Statistiken mit ENUM role
    COUNT(DISTINCT m.user_id) as total_members,
    COUNT(DISTINCT m.user_id) FILTER (WHERE m.role = 'admin') as admin_count,
    COUNT(DISTINCT m.user_id) FILTER (WHERE m.role = 'owner') as owner_count,
    -- Aktivität
    MAX(s.updated_at) as last_staff_activity,
    t.created_at,
    t.updated_at
FROM tenants t
LEFT JOIN staff s ON t.id = s.tenant_id
LEFT JOIN memberships m ON t.id = m.tenant_id
GROUP BY t.id, t.name, t.slug, t.created_at, t.updated_at;

-- 8. Final: Update alle Policies mit der neuen role Spalte (ENUM)
-- Services
DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services" ON services
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
    )
);

-- Service categories
DROP POLICY IF EXISTS service_categories_delete ON service_categories;
CREATE POLICY service_categories_delete ON service_categories
FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
    )
);

DROP POLICY IF EXISTS "Admins can manage service_categories" ON service_categories;
CREATE POLICY "Admins can manage service_categories" ON service_categories
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
    )
);

-- Appointments
DROP POLICY IF EXISTS appointments_delete ON appointments;
CREATE POLICY appointments_delete ON appointments
FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
    )
    OR
    staff_id IN (
        SELECT id FROM staff WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Staff can manage own appointments" ON appointments;
CREATE POLICY "Staff can manage own appointments" ON appointments
FOR ALL USING (
    staff_id IN (
        SELECT id FROM staff WHERE user_id = auth.uid()
    )
    OR
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
    )
);

-- Customers
DROP POLICY IF EXISTS "Staff can manage customers" ON customers;
CREATE POLICY "Staff can manage customers" ON customers
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner', 'staff')
    )
);

-- Memberships selbst
DROP POLICY IF EXISTS "Admins can manage memberships" ON memberships;
CREATE POLICY "Admins can manage memberships" ON memberships
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships m2
        WHERE m2.user_id = auth.uid()
          AND m2.role IN ('admin', 'owner')
    )
);

-- 9. Verifikation
DO $$
DECLARE
    check_rec RECORD;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MEMBERSHIPS ROLE MIGRATION COMPLETE ===';
    RAISE NOTICE '';

    -- Check role distribution
    FOR check_rec IN
        SELECT role::text, COUNT(*) as cnt
        FROM memberships
        GROUP BY role
        ORDER BY
            CASE role::text
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'staff' THEN 3
                WHEN 'member' THEN 4
            END
    LOOP
        RAISE NOTICE '  Role %: % users', check_rec.role, check_rec.cnt;
    END LOOP;

    -- Check data type
    SELECT data_type INTO check_rec
    FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'role';

    RAISE NOTICE '';
    RAISE NOTICE '  Role column type: %', check_rec.data_type;

    IF check_rec.data_type = 'USER-DEFINED' THEN
        RAISE NOTICE '  ✅ Role successfully migrated to ENUM type!';
    ELSE
        RAISE WARNING '  ⚠️ Role is still %', check_rec.data_type;
        error_count := error_count + 1;
    END IF;

    IF error_count = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ Ready for main migration (rename to tenant_members)!';
    END IF;
END $$;

COMMENT ON COLUMN memberships.role IS 'User role in tenant (ENUM: owner|admin|staff|member)';