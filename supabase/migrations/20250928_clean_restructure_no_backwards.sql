-- ========================================
-- SAUBERE RESTRUKTURIERUNG OHNE BACKWARDS-KOMPATIBILITÄT
-- ========================================
-- Implementiert ChatGPT's Feedback und macht einen sauberen Schnitt

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

-- 2. Backup kritische Daten vor der Migration
DO $$
BEGIN
    RAISE NOTICE '=== BACKING UP CRITICAL DATA ===';

    -- Erstelle Backup-Tabellen
    CREATE TABLE IF NOT EXISTS _backup_staff AS
    SELECT * FROM staff;

    CREATE TABLE IF NOT EXISTS _backup_memberships AS
    SELECT * FROM memberships;

    RAISE NOTICE 'Backup complete. Tables: _backup_staff, _backup_memberships';
END $$;

-- 3. Drop alte Views und Funktionen (Clean Slate)
DROP VIEW IF EXISTS staff_with_profiles CASCADE;
DROP VIEW IF EXISTS staff_full CASCADE;
DROP VIEW IF EXISTS user_complete_profile CASCADE;
DROP VIEW IF EXISTS user_profiles CASCADE;
DROP VIEW IF EXISTS users_without_staff CASCADE;
DROP VIEW IF EXISTS team_members CASCADE;
DROP VIEW IF EXISTS active_employees CASCADE;
DROP VIEW IF EXISTS tenant_admins CASCADE;

-- Drop alte Funktionen
DROP FUNCTION IF EXISTS get_staff_by_user CASCADE;
DROP FUNCTION IF EXISTS get_staff_for_tenant CASCADE;
DROP FUNCTION IF EXISTS get_staff_display_name CASCADE;
DROP FUNCTION IF EXISTS get_staff_by_user_id CASCADE;
DROP FUNCTION IF EXISTS create_staff_with_name CASCADE;
DROP FUNCTION IF EXISTS create_staff_complete CASCADE;
DROP FUNCTION IF EXISTS update_staff_with_profile CASCADE;
DROP FUNCTION IF EXISTS delete_staff_complete CASCADE;

-- 4. Rename memberships → tenant_members
ALTER TABLE IF EXISTS memberships RENAME TO tenant_members;

-- 5. Erweitere tenant_members mit fehlenden Spalten
ALTER TABLE tenant_members
    ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Setze ID als Primary Key falls nicht vorhanden
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'tenant_members'::regclass AND contype = 'p'
    ) THEN
        ALTER TABLE tenant_members ADD PRIMARY KEY (id);
    END IF;
END $$;

-- Füge Unique Constraint für ON CONFLICT hinzu
ALTER TABLE tenant_members
    DROP CONSTRAINT IF EXISTS tenant_members_tenant_user_unique;
ALTER TABLE tenant_members
    ADD CONSTRAINT tenant_members_tenant_user_unique UNIQUE (tenant_id, user_id);

-- 6. Erstelle employee_settings Tabelle
DROP TABLE IF EXISTS employee_settings CASCADE;

CREATE TABLE employee_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- UI/Display Einstellungen
    color TEXT DEFAULT '#3B82F6',
    display_order INTEGER DEFAULT 0,

    -- Arbeitsstatus
    is_active BOOLEAN DEFAULT true,
    can_book_appointments BOOLEAN DEFAULT true,

    -- Arbeitszeiten
    working_hours JSONB DEFAULT '{}',
    breaks JSONB DEFAULT '[]',
    buffer_before INTEGER DEFAULT 0,
    buffer_after INTEGER DEFAULT 0,

    -- Persönliche Info
    bio TEXT,
    notification_preferences JSONB DEFAULT '{
        "email": true,
        "sms": false,
        "appointment_reminder": true,
        "appointment_changes": true
    }',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT employee_settings_unique UNIQUE (tenant_id, user_id)
);

-- 7. Migriere Daten von staff → employee_settings
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
    s.color,
    s.is_active,
    s.can_book_appointments,
    s.working_hours,
    s.breaks,
    s.buffer_before,
    s.buffer_after,
    s.bio,
    s.notification_preferences,
    s.created_at,
    s.updated_at
FROM staff s
WHERE s.user_id IS NOT NULL
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- 8. Synchronisiere Rollen (staff.role → tenant_members.role)
UPDATE tenant_members tm
SET
    role = s.role,
    updated_at = NOW()
FROM staff s
WHERE tm.tenant_id = s.tenant_id
  AND tm.user_id = s.user_id
  AND tm.role IS DISTINCT FROM s.role;

-- 9. Erstelle NEUE Views mit besseren Namen

-- Hauptview: Alle Mitglieder eines Tenants
CREATE VIEW tenant_team AS
SELECT
    -- IDs (stabil, keine gen_random_uuid()!)
    tm.id as member_id,
    tm.tenant_id,
    tm.user_id,
    es.id as settings_id,

    -- User Info (aus profiles)
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

    -- Employee Settings (wenn vorhanden)
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
    tm.role DESC, -- owners/admins first
    COALESCE(es.is_active, true) DESC,
    COALESCE(es.display_order, 999),
    p.full_name;

-- View: Nur Mitarbeiter (mit Settings)
CREATE VIEW tenant_employees AS
SELECT * FROM tenant_team
WHERE has_employee_access = true;

-- View: Nur aktive Mitarbeiter
CREATE VIEW tenant_active_employees AS
SELECT * FROM tenant_team
WHERE has_employee_access = true AND is_active = true;

-- View: Nur Administratoren
CREATE VIEW tenant_administrators AS
SELECT * FROM tenant_team
WHERE role IN ('admin', 'owner');

-- 10. Erstelle Updated-At Trigger
CREATE TRIGGER update_tenant_members_updated_at
BEFORE UPDATE ON tenant_members
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER update_employee_settings_updated_at
BEFORE UPDATE ON employee_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 11. RLS Policies (mit WITH CHECK!)

-- tenant_members
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View members in same tenant" ON tenant_members;
CREATE POLICY "View members in same tenant"
    ON tenant_members FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid()
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
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid()
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
        AND tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins manage all settings" ON employee_settings;
CREATE POLICY "Admins manage all settings"
    ON employee_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_id = employee_settings.tenant_id
              AND user_id = auth.uid()
              AND role IN ('admin', 'owner')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_id = employee_settings.tenant_id
              AND user_id = auth.uid()
              AND role IN ('admin', 'owner')
        )
    );

-- 12. Neue Helper Functions

-- Füge Team-Mitglied hinzu
CREATE OR REPLACE FUNCTION add_tenant_member(
    p_tenant_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'member',
    p_with_employee_access BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_member_id UUID;
BEGIN
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

-- Aktiviere/Deaktiviere Mitarbeiter
CREATE OR REPLACE FUNCTION set_employee_active_status(
    p_tenant_id UUID,
    p_user_id UUID,
    p_is_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE employee_settings
    SET is_active = p_is_active
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id;

    RETURN FOUND;
END;
$$;

-- 13. Performance Indizes
CREATE INDEX idx_tenant_members_tenant ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX idx_tenant_members_role ON tenant_members(tenant_id, role);

CREATE INDEX idx_employee_settings_tenant_user ON employee_settings(tenant_id, user_id);
CREATE INDEX idx_employee_settings_active ON employee_settings(tenant_id, is_active);
CREATE INDEX idx_employee_settings_display ON employee_settings(tenant_id, display_order);

-- 14. Update Referenzen in anderen Tabellen
-- WICHTIG: Diese müssen auf die neuen Strukturen zeigen!

-- Update appointments staff_id Referenzen (falls nötig)
-- Das bleibt erstmal, da appointments auf staff.id referenziert
-- Später kann das auf tenant_members.id oder employee_settings.id migriert werden

-- 15. Markiere staff Tabelle als DEPRECATED
COMMENT ON TABLE staff IS 'DEPRECATED - Wird entfernt! Nutze tenant_members + employee_settings';

-- Blockiere neue Writes auf staff
CREATE OR REPLACE FUNCTION block_staff_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Table "staff" is deprecated! Use tenant_members and employee_settings instead.';
END;
$$;

CREATE TRIGGER block_staff_insert
BEFORE INSERT ON staff
FOR EACH ROW EXECUTE FUNCTION block_staff_writes();

CREATE TRIGGER block_staff_update
BEFORE UPDATE ON staff
FOR EACH ROW EXECUTE FUNCTION block_staff_writes();

-- 16. Finale Verifikation
DO $$
DECLARE
    stat RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION COMPLETE (NO BACKWARDS COMPATIBILITY) ===';
    RAISE NOTICE '';

    -- Stats
    SELECT
        (SELECT COUNT(*) FROM tenant_members) as members,
        (SELECT COUNT(*) FROM employee_settings) as employees,
        (SELECT COUNT(*) FROM tenant_members WHERE role = 'admin') as admins,
        (SELECT COUNT(*) FROM tenant_members WHERE role = 'owner') as owners
    INTO stat;

    RAISE NOTICE '📊 DATA MIGRATED:';
    RAISE NOTICE '  Members: %', stat.members;
    RAISE NOTICE '  Employees: %', stat.employees;
    RAISE NOTICE '  Admins: %', stat.admins;
    RAISE NOTICE '  Owners: %', stat.owners;
    RAISE NOTICE '';

    RAISE NOTICE '✅ CHANGES APPLIED:';
    RAISE NOTICE '  ✓ memberships → tenant_members';
    RAISE NOTICE '  ✓ staff data → employee_settings';
    RAISE NOTICE '  ✓ New views: tenant_team, tenant_employees, etc.';
    RAISE NOTICE '  ✓ RLS with proper WITH CHECK clauses';
    RAISE NOTICE '  ✓ Auto-updating timestamps';
    RAISE NOTICE '  ✓ Stable IDs (no gen_random_uuid in views)';
    RAISE NOTICE '  ✓ staff table BLOCKED for writes';
    RAISE NOTICE '';

    RAISE NOTICE '⚠️  REQUIRED API CHANGES:';
    RAISE NOTICE '  - Replace staff queries with tenant_team';
    RAISE NOTICE '  - Replace staff_with_profiles with tenant_team';
    RAISE NOTICE '  - Update role checks to use tenant_members';
    RAISE NOTICE '  - Update employee settings via employee_settings table';
    RAISE NOTICE '';

    RAISE NOTICE '🔥 TO DROP OLD TABLE (after API migration):';
    RAISE NOTICE '  DROP TABLE staff CASCADE;';
    RAISE NOTICE '  DROP TABLE _backup_staff;';
    RAISE NOTICE '  DROP TABLE _backup_memberships;';
END $$;

-- Comments
COMMENT ON TABLE tenant_members IS 'Mitgliedschaften und Rollen von Usern in Tenants';
COMMENT ON TABLE employee_settings IS 'Arbeits- und Display-Einstellungen für Mitarbeiter';
COMMENT ON VIEW tenant_team IS 'Alle Team-Mitglieder eines Tenants mit Details';
COMMENT ON VIEW tenant_employees IS 'Nur Mitarbeiter (mit employee_settings)';
COMMENT ON VIEW tenant_active_employees IS 'Nur aktive Mitarbeiter';
COMMENT ON VIEW tenant_administrators IS 'Nur Admins und Owner';
COMMENT ON FUNCTION add_tenant_member IS 'Fügt Mitglied zu Tenant hinzu mit optionalen Employee-Settings';
COMMENT ON FUNCTION set_employee_active_status IS 'Aktiviert/Deaktiviert einen Mitarbeiter';