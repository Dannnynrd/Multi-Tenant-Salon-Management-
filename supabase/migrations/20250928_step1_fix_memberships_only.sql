-- ========================================
-- STEP 1: NUR MEMBERSHIPS ROLE FIXEN
-- ========================================
-- Diese Migration arbeitet NUR mit der existierenden memberships Tabelle

-- 1. Check ob wir die richtige Tabelle haben
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memberships') THEN
        RAISE EXCEPTION 'Table memberships not found! Wrong migration order?';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_members') THEN
        RAISE NOTICE 'Table tenant_members already exists - skipping migration';
        RETURN;
    END IF;
END $$;

-- 2. Erstelle Role ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_role') THEN
        CREATE TYPE tenant_role AS ENUM ('owner', 'admin', 'staff', 'member');
        RAISE NOTICE 'Created tenant_role ENUM type';
    END IF;
END $$;

-- 3. Füge role_typed Spalte zu memberships hinzu (temporär)
ALTER TABLE memberships
ADD COLUMN IF NOT EXISTS role_typed tenant_role;

-- 4. Migriere role Daten mit korrektem Mapping
UPDATE memberships
SET role_typed =
    CASE
        WHEN role = 'owner' THEN 'owner'::tenant_role
        WHEN role = 'admin' THEN 'admin'::tenant_role
        WHEN role IN ('mitarbeiter', 'staff') THEN 'staff'::tenant_role
        WHEN role = 'member' THEN 'member'::tenant_role
        -- Fallback für unbekannte Werte
        ELSE 'member'::tenant_role
    END
WHERE role_typed IS NULL;

-- 5. Zeige Migration Status
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Role migration mapping:';
    FOR rec IN
        SELECT role as old_role, role_typed::text as new_role, COUNT(*) as count
        FROM memberships
        GROUP BY role, role_typed
        ORDER BY count DESC
    LOOP
        RAISE NOTICE '  % → % (%  users)', rec.old_role, rec.new_role, rec.count;
    END LOOP;
END $$;

-- 6. Setze role_typed als NOT NULL
ALTER TABLE memberships
ALTER COLUMN role_typed SET NOT NULL;

-- 7. Update alle Policies um role_typed zu nutzen (temporär)

-- Service categories
DROP POLICY IF EXISTS service_categories_delete ON service_categories;
CREATE POLICY service_categories_delete ON service_categories
FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role_typed IN ('admin', 'owner')
    )
);

DROP POLICY IF EXISTS "Admins can manage service_categories" ON service_categories;
CREATE POLICY "Admins can manage service_categories" ON service_categories
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role_typed IN ('admin', 'owner')
    )
);

-- Services
DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services" ON services
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role_typed IN ('admin', 'owner')
    )
);

-- Appointments
DROP POLICY IF EXISTS appointments_delete ON appointments;
CREATE POLICY appointments_delete ON appointments
FOR DELETE USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role_typed IN ('admin', 'owner')
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
          AND role_typed IN ('admin', 'owner')
    )
);

-- Customers
DROP POLICY IF EXISTS "Staff can manage customers" ON customers;
CREATE POLICY "Staff can manage customers" ON customers
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships
        WHERE user_id = auth.uid()
          AND role_typed IN ('admin', 'owner', 'staff')
    )
);

-- Memberships selbst
DROP POLICY IF EXISTS "Users can view own membership" ON memberships;
CREATE POLICY "Users can view own membership" ON memberships
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage memberships" ON memberships;
CREATE POLICY "Admins can manage memberships" ON memberships
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships m2
        WHERE m2.user_id = auth.uid()
          AND m2.role_typed IN ('admin', 'owner')
    )
);

-- 8. Recreate tenant_statistics mit role_typed
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
    COUNT(DISTINCT m.user_id) FILTER (WHERE m.role_typed = 'admin') as admin_count,
    COUNT(DISTINCT m.user_id) FILTER (WHERE m.role_typed = 'owner') as owner_count,
    MAX(s.updated_at) as last_staff_activity,
    t.created_at,
    t.updated_at
FROM tenants t
LEFT JOIN staff s ON t.id = s.tenant_id
LEFT JOIN memberships m ON t.id = m.tenant_id
GROUP BY t.id, t.name, t.slug, t.created_at, t.updated_at;

-- 9. Entferne alte role Spalte und rename role_typed zu role
ALTER TABLE memberships DROP COLUMN role CASCADE;
ALTER TABLE memberships RENAME COLUMN role_typed TO role;

-- 10. Final Update aller Policies mit der neuen role Spalte

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

-- Memberships
DROP POLICY IF EXISTS "Admins can manage memberships" ON memberships;
CREATE POLICY "Admins can manage memberships" ON memberships
FOR ALL USING (
    tenant_id IN (
        SELECT tenant_id FROM memberships m2
        WHERE m2.user_id = auth.uid()
          AND m2.role IN ('admin', 'owner')
    )
);

-- 11. Final tenant_statistics mit korrekter role
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

-- 12. Verifikation
DO $$
DECLARE
    check_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== STEP 1 COMPLETE: MEMBERSHIPS ROLE IS NOW ENUM ===';
    RAISE NOTICE '';

    -- Zeige finale Role-Verteilung
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

    -- Check Datentyp
    SELECT data_type INTO check_rec
    FROM information_schema.columns
    WHERE table_name = 'memberships' AND column_name = 'role';

    RAISE NOTICE '';
    RAISE NOTICE '  Column type: %', check_rec.data_type;

    IF check_rec.data_type = 'USER-DEFINED' THEN
        RAISE NOTICE '  ✅ SUCCESS: Role is now ENUM type!';
        RAISE NOTICE '';
        RAISE NOTICE '  Ready for Step 2: Rename to tenant_members';
    ELSE
        RAISE WARNING '  ⚠️ FAILED: Role is still %', check_rec.data_type;
    END IF;
END $$;