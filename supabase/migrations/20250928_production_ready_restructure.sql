-- ========================================
-- PRODUCTION-READY RESTRUKTURIERUNG MIT ALLEN FIXES
-- ========================================
-- Implementiert alle kritischen Sicherheits-Fixes von ChatGPT

-- 1. Helper Function für updated_at Timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- 2. Erstelle ENUM für Rollen (Type-Safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_role') THEN
        CREATE TYPE tenant_role AS ENUM ('owner', 'admin', 'staff', 'member');
    END IF;
END $$;

-- 3. Timestamped Backups (nicht überschreibbar)
DO $$
DECLARE
    backup_suffix TEXT := to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS');
BEGIN
    RAISE NOTICE '=== CREATING TIMESTAMPED BACKUPS ===';

    -- Backup staff
    EXECUTE format('CREATE TABLE _backup_staff_%s AS SELECT * FROM staff', backup_suffix);

    -- Backup memberships
    EXECUTE format('CREATE TABLE _backup_memberships_%s AS SELECT * FROM memberships', backup_suffix);

    RAISE NOTICE 'Backups created: _backup_staff_%, _backup_memberships_%', backup_suffix, backup_suffix;
END $$;

-- 4. Drop alte Views und Funktionen (Clean Slate)
DROP VIEW IF EXISTS staff_with_profiles CASCADE;
DROP VIEW IF EXISTS staff_full CASCADE;
DROP VIEW IF EXISTS user_complete_profile CASCADE;
DROP VIEW IF EXISTS user_profiles CASCADE;
DROP VIEW IF EXISTS users_without_staff CASCADE;
DROP VIEW IF EXISTS team_members CASCADE;
DROP VIEW IF EXISTS active_employees CASCADE;
DROP VIEW IF EXISTS tenant_admins CASCADE;

-- Drop alte unsichere Funktionen
DROP FUNCTION IF EXISTS get_staff_by_user CASCADE;
DROP FUNCTION IF EXISTS get_staff_for_tenant CASCADE;
DROP FUNCTION IF EXISTS get_staff_display_name CASCADE;
DROP FUNCTION IF EXISTS get_staff_by_user_id CASCADE;
DROP FUNCTION IF EXISTS create_staff_with_name CASCADE;
DROP FUNCTION IF EXISTS create_staff_complete CASCADE;
DROP FUNCTION IF EXISTS update_staff_with_profile CASCADE;
DROP FUNCTION IF EXISTS delete_staff_complete CASCADE;
DROP FUNCTION IF EXISTS add_tenant_member CASCADE;
DROP FUNCTION IF EXISTS set_employee_active_status CASCADE;

-- 5. Rename memberships → tenant_members
ALTER TABLE IF EXISTS memberships RENAME TO tenant_members;

-- 6. Erweitere tenant_members mit fehlenden Spalten und Constraints
ALTER TABLE tenant_members
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ändere role zu ENUM (wenn möglich)
DO $$
BEGIN
    -- Temporär role umbenennen für Migration
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'tenant_members' AND column_name = 'role') THEN
        ALTER TABLE tenant_members RENAME COLUMN role TO role_old;
        ALTER TABLE tenant_members ADD COLUMN role tenant_role;

        -- Migriere Daten mit Mapping
        UPDATE tenant_members SET role =
            CASE role_old
                WHEN 'owner' THEN 'owner'::tenant_role
                WHEN 'admin' THEN 'admin'::tenant_role
                WHEN 'mitarbeiter' THEN 'staff'::tenant_role
                WHEN 'staff' THEN 'staff'::tenant_role
                ELSE 'member'::tenant_role
            END;

        ALTER TABLE tenant_members DROP COLUMN role_old;
        ALTER TABLE tenant_members ALTER COLUMN role SET NOT NULL;
    END IF;
END $$;

-- Primary Key und Unique Constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'tenant_members'::regclass AND contype = 'p'
    ) THEN
        ALTER TABLE tenant_members ADD PRIMARY KEY (id);
    END IF;
END $$;

ALTER TABLE tenant_members
    DROP CONSTRAINT IF EXISTS tenant_members_tenant_user_unique;
ALTER TABLE tenant_members
    ADD CONSTRAINT tenant_members_tenant_user_unique UNIQUE (tenant_id, user_id);

-- 7. Erstelle employee_settings mit Check Constraints
DROP TABLE IF EXISTS employee_settings CASCADE;

CREATE TABLE employee_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- UI/Display mit Check Constraints
    color TEXT DEFAULT '#3B82F6' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    display_order INTEGER DEFAULT 0 CHECK (display_order >= 0),

    -- Arbeitsstatus
    is_active BOOLEAN DEFAULT true NOT NULL,
    can_book_appointments BOOLEAN DEFAULT true NOT NULL,

    -- Arbeitszeiten (mit Basic JSON Struktur Check)
    working_hours JSONB DEFAULT '{}' NOT NULL CHECK (jsonb_typeof(working_hours) = 'object'),
    breaks JSONB DEFAULT '[]' NOT NULL CHECK (jsonb_typeof(breaks) = 'array'),
    buffer_before INTEGER DEFAULT 0 CHECK (buffer_before >= 0 AND buffer_before <= 120),
    buffer_after INTEGER DEFAULT 0 CHECK (buffer_after >= 0 AND buffer_after <= 120),

    -- Persönliche Info
    bio TEXT,
    notification_preferences JSONB DEFAULT '{
        "email": true,
        "sms": false,
        "appointment_reminder": true,
        "appointment_changes": true
    }' NOT NULL CHECK (jsonb_typeof(notification_preferences) = 'object'),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT employee_settings_unique UNIQUE (tenant_id, user_id)
);

-- 8. Migriere Daten von staff → employee_settings
INSERT INTO employee_settings (
    tenant_id,
    user_id,
    color,
    is_active,
    can_book_appointments,
    working_hours,
    breaks,
    buffer_before,
    buffer_after,
    bio,
    notification_preferences,
    created_at,
    updated_at
)
SELECT
    s.tenant_id,
    s.user_id,
    CASE
        WHEN s.color ~ '^#[0-9A-Fa-f]{6}$' THEN s.color
        ELSE '#3B82F6'
    END,
    COALESCE(s.is_active, true),
    COALESCE(s.can_book_appointments, true),
    COALESCE(s.working_hours, '{}'),
    COALESCE(s.breaks, '[]'),
    LEAST(COALESCE(s.buffer_before, 0), 120),
    LEAST(COALESCE(s.buffer_after, 0), 120),
    s.bio,
    COALESCE(s.notification_preferences, '{"email": true, "sms": false}'),
    s.created_at,
    s.updated_at
FROM staff s
WHERE s.user_id IS NOT NULL
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 9. Synchronisiere Rollen (staff.role → tenant_members.role)
UPDATE tenant_members tm
SET
    role = CASE
        WHEN s.role = 'admin' THEN 'admin'::tenant_role
        WHEN s.role = 'owner' THEN 'owner'::tenant_role
        WHEN s.role IN ('mitarbeiter', 'staff') THEN 'staff'::tenant_role
        ELSE 'member'::tenant_role
    END,
    updated_at = NOW()
FROM staff s
WHERE tm.tenant_id = s.tenant_id
  AND tm.user_id = s.user_id;

-- 10. Erstelle Views mit korrekter Rollen-Sortierung

CREATE OR REPLACE VIEW tenant_team AS
SELECT
    -- IDs (stabil)
    tm.id as member_id,
    tm.tenant_id,
    tm.user_id,
    es.id as settings_id,

    -- User Info
    p.full_name,
    p.email,
    p.phone,
    p.avatar_url,

    -- Rolle & Status
    tm.role,
    CASE
        WHEN es.id IS NOT NULL THEN true
        ELSE false
    END as has_employee_access,
    COALESCE(es.is_active, true) as is_active,

    -- Employee Settings
    es.color,
    es.can_book_appointments,
    es.working_hours,
    es.breaks,
    es.buffer_before,
    es.buffer_after,
    es.bio,
    es.notification_preferences,
    es.display_order,

    -- Timestamps
    tm.created_at as joined_at,
    tm.updated_at as role_updated_at,
    es.created_at as employee_since,
    es.updated_at as settings_updated_at
FROM tenant_members tm
INNER JOIN profiles p ON tm.user_id = p.id
LEFT JOIN employee_settings es ON (
    tm.tenant_id = es.tenant_id
    AND tm.user_id = es.user_id
)
ORDER BY
    -- Korrekte Rollen-Priorität
    CASE tm.role
        WHEN 'owner' THEN 3
        WHEN 'admin' THEN 2
        WHEN 'staff' THEN 1
        ELSE 0
    END DESC,
    COALESCE(es.is_active, true) DESC,
    COALESCE(es.display_order, 999),
    p.full_name;

-- Weitere Views
CREATE VIEW tenant_employees AS
SELECT * FROM tenant_team
WHERE has_employee_access = true;

CREATE VIEW tenant_active_employees AS
SELECT * FROM tenant_team
WHERE has_employee_access = true AND is_active = true;

CREATE VIEW tenant_administrators AS
SELECT * FROM tenant_team
WHERE role IN ('admin', 'owner');

-- 11. Erstelle Updated-At Trigger
CREATE TRIGGER update_tenant_members_updated_at
BEFORE UPDATE ON tenant_members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_employee_settings_updated_at
BEFORE UPDATE ON employee_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 12. RLS Policies mit korreliertem EXISTS und WITH CHECK

-- tenant_members
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View members in same tenant" ON tenant_members;
CREATE POLICY "View members in same tenant"
    ON tenant_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm2
            WHERE tm2.tenant_id = tenant_members.tenant_id
              AND tm2.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins manage members" ON tenant_members;
CREATE POLICY "Admins manage members"
    ON tenant_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm2
            WHERE tm2.tenant_id = tenant_members.tenant_id
              AND tm2.user_id = auth.uid()
              AND tm2.role IN ('admin', 'owner')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tenant_members tm2
            WHERE tm2.tenant_id = tenant_members.tenant_id
              AND tm2.user_id = auth.uid()
              AND tm2.role IN ('admin', 'owner')
        )
    );

-- employee_settings
ALTER TABLE employee_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View settings in same tenant" ON employee_settings;
CREATE POLICY "View settings in same tenant"
    ON employee_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = employee_settings.tenant_id
              AND tm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users update own settings" ON employee_settings;
CREATE POLICY "Users update own settings"
    ON employee_settings FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own settings" ON employee_settings;
CREATE POLICY "Users insert own settings"
    ON employee_settings FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = employee_settings.tenant_id
              AND tm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins manage all settings" ON employee_settings;
CREATE POLICY "Admins manage all settings"
    ON employee_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = employee_settings.tenant_id
              AND tm.user_id = auth.uid()
              AND tm.role IN ('admin', 'owner')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tenant_members tm
            WHERE tm.tenant_id = employee_settings.tenant_id
              AND tm.user_id = auth.uid()
              AND tm.role IN ('admin', 'owner')
        )
    );

-- 13. SICHERE Helper Functions mit Authorization Checks

-- Füge Team-Mitglied hinzu (MIT SICHERHEITS-CHECK!)
CREATE OR REPLACE FUNCTION add_tenant_member(
    p_tenant_id UUID,
    p_user_id UUID,
    p_role tenant_role DEFAULT 'staff',
    p_with_employee_access BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_member_id UUID;
BEGIN
    -- SICHERHEITS-CHECK: Ist der Aufrufer Admin/Owner?
    IF NOT EXISTS (
        SELECT 1 FROM tenant_members tm
        WHERE tm.tenant_id = p_tenant_id
          AND tm.user_id = auth.uid()
          AND tm.role IN ('admin', 'owner')
    ) THEN
        RAISE EXCEPTION 'Not authorized to add members to this tenant';
    END IF;

    -- Füge Mitglied hinzu oder update Rolle
    INSERT INTO tenant_members (tenant_id, user_id, role)
    VALUES (p_tenant_id, p_user_id, p_role)
    ON CONFLICT (tenant_id, user_id)
    DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW()
    RETURNING id INTO v_member_id;

    -- Erstelle Employee Settings wenn gewünscht
    IF p_with_employee_access THEN
        INSERT INTO employee_settings (tenant_id, user_id)
        VALUES (p_tenant_id, p_user_id)
        ON CONFLICT (tenant_id, user_id) DO NOTHING;
    END IF;

    RETURN v_member_id;
END;
$$;

-- Aktiviere/Deaktiviere Mitarbeiter (MIT SICHERHEITS-CHECK!)
CREATE OR REPLACE FUNCTION set_employee_active_status(
    p_tenant_id UUID,
    p_user_id UUID,
    p_is_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- SICHERHEITS-CHECK: Ist der Aufrufer Admin/Owner oder der User selbst?
    IF NOT EXISTS (
        SELECT 1 FROM tenant_members tm
        WHERE tm.tenant_id = p_tenant_id
          AND tm.user_id = auth.uid()
          AND (tm.role IN ('admin', 'owner') OR tm.user_id = p_user_id)
    ) THEN
        RAISE EXCEPTION 'Not authorized to change employee status';
    END IF;

    UPDATE employee_settings
    SET is_active = p_is_active
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id;

    RETURN FOUND;
END;
$$;

-- Grant execute permissions nur an authenticated users
GRANT EXECUTE ON FUNCTION add_tenant_member TO authenticated;
GRANT EXECUTE ON FUNCTION set_employee_active_status TO authenticated;

-- 14. Performance Indizes (mit IF NOT EXISTS für re-entrancy)
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_role ON tenant_members(tenant_id, role);

CREATE INDEX IF NOT EXISTS idx_employee_settings_tenant_user ON employee_settings(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_employee_settings_active ON employee_settings(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_employee_settings_display ON employee_settings(tenant_id, display_order);

-- 15. Blockiere neue Writes auf staff
CREATE OR REPLACE FUNCTION block_staff_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Table "staff" is deprecated! Use tenant_members and employee_settings instead.';
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'block_staff_insert') THEN
        CREATE TRIGGER block_staff_insert
        BEFORE INSERT ON staff
        FOR EACH ROW EXECUTE FUNCTION block_staff_writes();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'block_staff_update') THEN
        CREATE TRIGGER block_staff_update
        BEFORE UPDATE ON staff
        FOR EACH ROW EXECUTE FUNCTION block_staff_writes();
    END IF;
END $$;

-- Mark as deprecated
COMMENT ON TABLE staff IS 'DEPRECATED - Use tenant_members + employee_settings. DO NOT DROP until appointments.staff_id is migrated!';

-- 16. Finale Verifikation
DO $$
DECLARE
    stat RECORD;
    check_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== PRODUCTION-READY MIGRATION COMPLETE ===';
    RAISE NOTICE '';

    -- Stats
    SELECT
        (SELECT COUNT(*) FROM tenant_members) as members,
        (SELECT COUNT(*) FROM employee_settings) as employees,
        (SELECT COUNT(*) FROM tenant_members WHERE role = 'admin') as admins,
        (SELECT COUNT(*) FROM tenant_members WHERE role = 'owner') as owners
    INTO stat;

    RAISE NOTICE '📊 DATA MIGRATED:';
    RAISE NOTICE '  Total members: %', stat.members;
    RAISE NOTICE '  With employee settings: %', stat.employees;
    RAISE NOTICE '  Admins: %', stat.admins;
    RAISE NOTICE '  Owners: %', stat.owners;
    RAISE NOTICE '';

    -- Check for role migration issues
    FOR check_rec IN
        SELECT COUNT(*) as cnt, role::text
        FROM tenant_members
        GROUP BY role
    LOOP
        RAISE NOTICE '  Role %: % members', check_rec.role, check_rec.cnt;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '✅ SECURITY FIXES APPLIED:';
    RAISE NOTICE '  ✓ SECURITY DEFINER functions with auth checks';
    RAISE NOTICE '  ✓ Correlated EXISTS in RLS policies';
    RAISE NOTICE '  ✓ All policies have WITH CHECK clauses';
    RAISE NOTICE '  ✓ Role ENUM for type safety';
    RAISE NOTICE '  ✓ Check constraints on employee_settings';
    RAISE NOTICE '';

    RAISE NOTICE '✅ IMPROVEMENTS:';
    RAISE NOTICE '  ✓ Timestamped backups (not overwritable)';
    RAISE NOTICE '  ✓ Proper role sorting (owner > admin > staff)';
    RAISE NOTICE '  ✓ Re-entrant indexes (IF NOT EXISTS)';
    RAISE NOTICE '  ✓ Auto-updating timestamps';
    RAISE NOTICE '';

    RAISE NOTICE '⚠️  REQUIRED API CHANGES:';
    RAISE NOTICE '  - Use tenant_team instead of staff/staff_with_profiles';
    RAISE NOTICE '  - Role is now ENUM: owner|admin|staff|member';
    RAISE NOTICE '  - Employee settings via employee_settings table';
    RAISE NOTICE '';

    RAISE NOTICE '⚠️  DO NOT DROP staff TABLE YET:';
    RAISE NOTICE '  - appointments.staff_id still references it';
    RAISE NOTICE '  - Migrate appointments first, then:';
    RAISE NOTICE '    DROP TABLE staff CASCADE;';
END $$;

-- Comments
COMMENT ON TABLE tenant_members IS 'User memberships in tenants with typed roles (owner|admin|staff|member)';
COMMENT ON TABLE employee_settings IS 'Work and display settings for employees';
COMMENT ON VIEW tenant_team IS 'All team members with their roles and settings';
COMMENT ON VIEW tenant_employees IS 'Only members with employee settings';
COMMENT ON VIEW tenant_active_employees IS 'Only active employees';
COMMENT ON VIEW tenant_administrators IS 'Only admins and owners';
COMMENT ON FUNCTION add_tenant_member IS 'SECURE: Add member to tenant (requires admin/owner role)';
COMMENT ON FUNCTION set_employee_active_status IS 'SECURE: Set employee active status (requires admin/owner or self)';