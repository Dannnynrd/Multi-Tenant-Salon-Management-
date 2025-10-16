-- ========================================
-- FIX: Role Dependencies bevor Migration
-- ========================================
-- Muss VOR der Hauptmigration ausgeführt werden

-- 1. Erstelle Role ENUM falls noch nicht vorhanden
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_role') THEN
        CREATE TYPE tenant_role AS ENUM ('owner', 'admin', 'staff', 'member');
    END IF;
END $$;

-- 2. Füge neue role Spalte hinzu OHNE die alte zu entfernen
DO $$
BEGIN
    -- Check ob role_new schon existiert
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant_members' AND column_name = 'role_new'
    ) THEN
        -- Füge neue Spalte hinzu
        ALTER TABLE tenant_members ADD COLUMN role_new tenant_role;

        -- Migriere Daten
        UPDATE tenant_members SET role_new =
            CASE role
                WHEN 'owner' THEN 'owner'::tenant_role
                WHEN 'admin' THEN 'admin'::tenant_role
                WHEN 'mitarbeiter' THEN 'staff'::tenant_role
                WHEN 'staff' THEN 'staff'::tenant_role
                ELSE 'member'::tenant_role
            END;

        -- Setze NOT NULL
        ALTER TABLE tenant_members ALTER COLUMN role_new SET NOT NULL;
    END IF;
END $$;

-- 3. Recreate abhängige Policies mit role_new
-- Drop und recreate service_categories policies
DROP POLICY IF EXISTS service_categories_delete ON service_categories;
CREATE POLICY service_categories_delete ON service_categories
FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_members
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner')
    )
);

-- Drop und recreate appointments policies
DROP POLICY IF EXISTS appointments_delete ON appointments;
CREATE POLICY appointments_delete ON appointments
FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_members
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner')
    )
    OR
    staff_id IN (
        SELECT id FROM staff WHERE user_id = auth.uid()
    )
);

-- 4. Recreate tenant_statistics view mit role_new
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
LEFT JOIN tenant_members m ON t.id = m.tenant_id
GROUP BY t.id, t.name, t.slug, t.created_at, t.updated_at;

-- 5. Erstelle weitere Policies die möglicherweise role verwenden
-- Check für andere service-bezogene Policies
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    -- Liste alle Policies die möglicherweise role verwenden
    FOR policy_rec IN
        SELECT
            schemaname,
            tablename,
            policyname
        FROM pg_policies
        WHERE definition LIKE '%tenant_members%'
          AND definition LIKE '%role%'
    LOOP
        RAISE NOTICE 'Found policy using role: %.%', policy_rec.tablename, policy_rec.policyname;
    END LOOP;
END $$;

-- 6. Update weitere bekannte Policies
-- Services policies
DROP POLICY IF EXISTS "Users can view services" ON services;
CREATE POLICY "Users can view services" ON services
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services" ON services
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_members
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner')
    )
);

-- Service categories policies
DROP POLICY IF EXISTS "Users can view service_categories" ON service_categories;
CREATE POLICY "Users can view service_categories" ON service_categories
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can manage service_categories" ON service_categories;
CREATE POLICY "Admins can manage service_categories" ON service_categories
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_members
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner')
    )
);

-- Appointments policies
DROP POLICY IF EXISTS "Users can view appointments" ON appointments;
CREATE POLICY "Users can view appointments" ON appointments
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
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
        SELECT tenant_id FROM tenant_members
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner')
    )
);

-- Customers policies
DROP POLICY IF EXISTS "Users can view customers" ON customers;
CREATE POLICY "Users can view customers" ON customers
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Staff can manage customers" ON customers;
CREATE POLICY "Staff can manage customers" ON customers
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM tenant_members
        WHERE user_id = auth.uid()
          AND COALESCE(role_new, 'member'::tenant_role) IN ('admin', 'owner', 'staff')
    )
);

-- 7. JETZT können wir die alte role Spalte sicher entfernen
DO $$
BEGIN
    -- Nur wenn role_new existiert und role noch da ist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant_members' AND column_name = 'role_new'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenant_members' AND column_name = 'role'
    ) THEN
        -- Rename role_new to role
        ALTER TABLE tenant_members DROP COLUMN role CASCADE;
        ALTER TABLE tenant_members RENAME COLUMN role_new TO role;

        RAISE NOTICE 'Successfully migrated role column to ENUM type';
    END IF;
END $$;

-- 8. Verifikation
DO $$
DECLARE
    check_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== ROLE MIGRATION COMPLETE ===';

    -- Check role distribution
    FOR check_rec IN
        SELECT role::text, COUNT(*) as cnt
        FROM tenant_members
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

    -- Check for any policies still using old role
    SELECT COUNT(*) INTO check_rec
    FROM pg_policies
    WHERE definition LIKE '%role_old%';

    IF check_rec.count > 0 THEN
        RAISE WARNING 'Found % policies still referencing role_old!', check_rec.count;
    ELSE
        RAISE NOTICE '  ✅ All policies updated successfully';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Ready for main migration!';
END $$;