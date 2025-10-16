-- ========================================
-- CHECK UND FIX ROLE SPALTE
-- ========================================

-- 1. Erst mal schauen was wir haben
DO $$
DECLARE
    col_type TEXT;
    rec RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING CURRENT STATE ===';

    -- Check Datentyp der role Spalte
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'role';

    RAISE NOTICE 'Current role column type: %', col_type;

    -- Check welche Werte wir haben
    IF col_type != 'USER-DEFINED' THEN
        -- role ist noch TEXT, zeige Werte
        RAISE NOTICE '';
        RAISE NOTICE 'Current role values in memberships:';
        FOR rec IN
            SELECT DISTINCT role, COUNT(*) as cnt
            FROM memberships
            GROUP BY role
            ORDER BY role
        LOOP
            RAISE NOTICE '  "%": % users', rec.role, rec.cnt;
        END LOOP;
    END IF;
END $$;

-- 2. Erstelle ENUM falls noch nicht vorhanden
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_role') THEN
        CREATE TYPE tenant_role AS ENUM ('owner', 'admin', 'staff', 'member');
        RAISE NOTICE 'Created tenant_role ENUM';
    ELSE
        RAISE NOTICE 'tenant_role ENUM already exists';
    END IF;
END $$;

-- 3. Migration nur wenn role noch TEXT ist
DO $$
DECLARE
    col_type TEXT;
BEGIN
    -- Check aktueller Datentyp
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'role';

    IF col_type = 'USER-DEFINED' THEN
        RAISE NOTICE 'Role column is already ENUM type - skipping migration';
    ELSE
        RAISE NOTICE 'Migrating role from TEXT to ENUM...';

        -- Rename alte Spalte
        ALTER TABLE memberships RENAME COLUMN role TO role_text;

        -- Neue ENUM Spalte
        ALTER TABLE memberships ADD COLUMN role tenant_role;

        -- Migriere Daten mit sicherem CASE
        UPDATE memberships
        SET role = CASE role_text
            WHEN 'owner' THEN 'owner'::tenant_role
            WHEN 'admin' THEN 'admin'::tenant_role
            WHEN 'staff' THEN 'staff'::tenant_role
            WHEN 'mitarbeiter' THEN 'staff'::tenant_role  -- Map mitarbeiter to staff
            WHEN 'member' THEN 'member'::tenant_role
            ELSE 'member'::tenant_role  -- Default fallback
        END;

        -- NOT NULL setzen
        ALTER TABLE memberships ALTER COLUMN role SET NOT NULL;

        -- Alte Spalte droppen (mit CASCADE für abhängige Views/Policies)
        ALTER TABLE memberships DROP COLUMN role_text CASCADE;

        RAISE NOTICE 'Migration complete!';
    END IF;
END $$;

-- 4. Recreate alle gedropten Policies/Views

-- Policies für Services
DROP POLICY IF EXISTS "Users can view services" ON services;
CREATE POLICY "Users can view services" ON services
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services" ON services
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner')
    )
);

-- Policies für Service Categories
DROP POLICY IF EXISTS "Users can view service_categories" ON service_categories;
CREATE POLICY "Users can view service_categories" ON service_categories
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
);

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

-- Policies für Appointments
DROP POLICY IF EXISTS "Users can view appointments" ON appointments;
CREATE POLICY "Users can view appointments" ON appointments
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
);

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

-- Policies für Customers
DROP POLICY IF EXISTS "Users can view customers" ON customers;
CREATE POLICY "Users can view customers" ON customers
FOR SELECT USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Staff can manage customers" ON customers;
CREATE POLICY "Staff can manage customers" ON customers
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'owner', 'staff')
    )
);

-- Policies für Memberships
DROP POLICY IF EXISTS "Users can view own membership" ON memberships;
CREATE POLICY "Users can view own membership" ON memberships
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage memberships" ON memberships;
CREATE POLICY "Admins can manage memberships" ON memberships
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships m2
        WHERE m2.user_id = auth.uid()
          AND m2.role IN ('admin', 'owner')
    )
);

-- Recreate tenant_statistics view
DROP VIEW IF EXISTS tenant_statistics CASCADE;
CREATE VIEW tenant_statistics AS
SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.slug,
    COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = true) as active_staff_count,
    COUNT(DISTINCT s.id) FILTER (WHERE s.is_active = false) as inactive_staff_count,
    COUNT(DISTINCT s.id) as total_staff_count,
    COUNT(DISTINCT m.user_id) as total_members,
    COUNT(DISTINCT m.user_id) FILTER (WHERE m.role = 'admin') as admin_count,
    COUNT(DISTINCT m.user_id) FILTER (WHERE m.role = 'owner') as owner_count,
    MAX(s.updated_at) as last_staff_activity,
    t.created_at,
    t.updated_at
FROM tenants t
LEFT JOIN staff s ON t.id = s.tenant_id
LEFT JOIN memberships m ON t.id = m.tenant_id
GROUP BY t.id, t.name, t.slug, t.created_at, t.updated_at;

-- 5. Final Verification
DO $$
DECLARE
    col_type TEXT;
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== FINAL STATE ===';

    -- Check finaler Datentyp
    SELECT data_type INTO col_type
    FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'role';

    RAISE NOTICE 'Final role column type: %', col_type;

    IF col_type = 'USER-DEFINED' THEN
        RAISE NOTICE '✅ SUCCESS: Role is now ENUM type!';

        -- Zeige finale Verteilung
        RAISE NOTICE '';
        RAISE NOTICE 'Role distribution:';
        FOR rec IN
            SELECT role::text as role_name, COUNT(*) as cnt
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
            RAISE NOTICE '  %: % users', rec.role_name, rec.cnt;
        END LOOP;
    ELSE
        RAISE WARNING '⚠️ Role is still TEXT type';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Ready for next migration step!';
END $$;