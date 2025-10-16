-- ========================================
-- RESTRUKTURIERUNG DER TABELLEN (FIXED VERSION)
-- ========================================

-- 1. Analysiere aktuelle Struktur
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    RAISE NOTICE '=== ANALYZING CURRENT STRUCTURE ===';

    -- Finde den korrekten Constraint-Namen
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'memberships'::regclass
    AND contype = 'u';  -- Unique constraint

    IF constraint_name IS NOT NULL THEN
        RAISE NOTICE 'Found unique constraint: %', constraint_name;
    END IF;
END $$;

-- 2. Rename memberships zu tenant_members (besserer Name)
ALTER TABLE IF EXISTS memberships RENAME TO tenant_members;

-- 3. Update Constraint-Namen (nur wenn sie existieren)
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Rename alle Constraints der Tabelle
    FOR r IN
        SELECT conname, contype
        FROM pg_constraint
        WHERE conrelid = 'tenant_members'::regclass
    LOOP
        IF r.conname LIKE 'memberships%' THEN
            EXECUTE format('ALTER TABLE tenant_members RENAME CONSTRAINT %I TO %I',
                r.conname,
                replace(r.conname, 'memberships', 'tenant_members')
            );
            RAISE NOTICE 'Renamed constraint % to %',
                r.conname,
                replace(r.conname, 'memberships', 'tenant_members');
        END IF;
    END LOOP;
END $$;

-- 4. Füge ID Spalte zu tenant_members hinzu (falls nicht vorhanden)
ALTER TABLE tenant_members
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Mache ID zum Primary Key wenn noch keiner existiert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'tenant_members'::regclass
        AND contype = 'p'
    ) THEN
        ALTER TABLE tenant_members ADD PRIMARY KEY (id);
        RAISE NOTICE 'Added primary key to tenant_members';
    END IF;
END $$;

-- 5. Erstelle employee_settings Tabelle
DROP TABLE IF EXISTS employee_settings CASCADE;

CREATE TABLE employee_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Arbeitsspezifische Einstellungen
    color TEXT DEFAULT '#3B82F6',
    can_book_appointments BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,

    -- Zeitplanung
    working_hours JSONB DEFAULT '{}',
    breaks JSONB DEFAULT '[]',
    buffer_before INTEGER DEFAULT 0,
    buffer_after INTEGER DEFAULT 0,

    -- Persönliche Einstellungen
    bio TEXT,
    notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "appointment_reminder": true, "appointment_changes": true}',

    -- Meta
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint
    CONSTRAINT employee_settings_unique UNIQUE (tenant_id, user_id)
);

-- 6. Migriere Daten von staff zu employee_settings
DO $$
DECLARE
    migrated_count INTEGER := 0;
BEGIN
    INSERT INTO employee_settings (
        tenant_id,
        user_id,
        color,
        can_book_appointments,
        is_active,
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
        s.can_book_appointments,
        s.is_active,
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

    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % employee settings from staff', migrated_count;
END $$;

-- 7. Synchronisiere Rollen (staff.role → tenant_members.role)
DO $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    UPDATE tenant_members tm
    SET role = s.role,
        updated_at = NOW()
    FROM staff s
    WHERE tm.tenant_id = s.tenant_id
      AND tm.user_id = s.user_id
      AND tm.role IS DISTINCT FROM s.role;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % roles in tenant_members', updated_count;
END $$;

-- 8. Erstelle optimierte Views

-- Hauptview für alle Team-Mitglieder
CREATE OR REPLACE VIEW team_members AS
SELECT
    -- IDs
    tm.tenant_id,
    tm.user_id,
    COALESCE(tm.id, gen_random_uuid()) as membership_id,
    es.id as employee_settings_id,

    -- User Info (from profiles)
    p.full_name,
    p.email,
    p.phone,
    p.avatar_url,

    -- Computed name parts (für API-Kompatibilität)
    COALESCE(SPLIT_PART(p.full_name, ' ', 1), '') as first_name,
    COALESCE(
        CASE
            WHEN POSITION(' ' IN p.full_name) > 0
            THEN SUBSTRING(p.full_name FROM POSITION(' ' IN p.full_name) + 1)
            ELSE ''
        END,
        ''
    ) as last_name,

    -- Rolle
    tm.role,

    -- Employee Settings (optional)
    es.color,
    COALESCE(es.is_active, true) as is_active,
    es.can_book_appointments,
    es.working_hours,
    es.breaks,
    es.buffer_before,
    es.buffer_after,
    es.bio,
    es.notification_preferences,
    es.display_order,

    -- Status flags
    CASE WHEN es.id IS NOT NULL THEN true ELSE false END as is_employee,
    CASE WHEN tm.role = 'admin' THEN true ELSE false END as is_admin,
    CASE WHEN tm.role = 'owner' THEN true ELSE false END as is_owner,

    -- Timestamps
    tm.created_at as joined_at,
    tm.updated_at as membership_updated_at,
    es.created_at as employee_since,
    es.updated_at as settings_updated_at
FROM tenant_members tm
INNER JOIN profiles p ON tm.user_id = p.id
LEFT JOIN employee_settings es ON tm.tenant_id = es.tenant_id AND tm.user_id = es.user_id
ORDER BY
    COALESCE(es.is_active, true) DESC,
    COALESCE(es.display_order, 999),
    p.full_name;

-- View für aktive Mitarbeiter
CREATE OR REPLACE VIEW active_employees AS
SELECT * FROM team_members
WHERE is_employee = true AND is_active = true;

-- View für Admins
CREATE OR REPLACE VIEW tenant_admins AS
SELECT * FROM team_members
WHERE is_admin = true;

-- Backward compatibility view (für alte APIs)
CREATE OR REPLACE VIEW staff_with_profiles AS
SELECT
    COALESCE(es.id, gen_random_uuid()) as id,  -- Fake staff ID für Kompatibilität
    tm.tenant_id,
    tm.user_id,
    tm.user_id as created_by,  -- Fallback
    p.full_name,
    p.email,
    p.phone,
    p.avatar_url,
    COALESCE(SPLIT_PART(p.full_name, ' ', 1), '') as first_name,
    COALESCE(SUBSTRING(p.full_name FROM POSITION(' ' IN p.full_name) + 1), '') as last_name,
    tm.role,
    es.color,
    es.bio,
    es.is_active,
    es.can_book_appointments,
    es.working_hours,
    es.breaks,
    es.buffer_before,
    es.buffer_after,
    es.notification_preferences,
    COALESCE(es.created_at, tm.created_at) as created_at,
    COALESCE(es.updated_at, tm.updated_at) as updated_at
FROM tenant_members tm
INNER JOIN profiles p ON tm.user_id = p.id
LEFT JOIN employee_settings es ON tm.tenant_id = es.tenant_id AND tm.user_id = es.user_id;

-- 9. Helper Functions

-- Funktion: Team-Mitglied hinzufügen
CREATE OR REPLACE FUNCTION add_team_member(
    p_tenant_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'staff',
    p_create_employee_settings BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_member_id UUID;
BEGIN
    -- Füge zu tenant_members hinzu
    INSERT INTO tenant_members (tenant_id, user_id, role)
    VALUES (p_tenant_id, p_user_id, p_role)
    ON CONFLICT (tenant_id, user_id) DO UPDATE
    SET role = EXCLUDED.role, updated_at = NOW()
    RETURNING id INTO v_member_id;

    -- Erstelle employee_settings wenn gewünscht
    IF p_create_employee_settings THEN
        INSERT INTO employee_settings (tenant_id, user_id)
        VALUES (p_tenant_id, p_user_id)
        ON CONFLICT (tenant_id, user_id) DO NOTHING;
    END IF;

    RETURN v_member_id;
END;
$$;

-- 10. Erstelle Indizes
CREATE INDEX IF NOT EXISTS idx_employee_settings_tenant_user
    ON employee_settings(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_employee_settings_active
    ON employee_settings(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user
    ON tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant
    ON tenant_members(tenant_id);

-- 11. RLS Policies
ALTER TABLE employee_settings ENABLE ROW LEVEL SECURITY;

-- Jeder im Tenant kann employee_settings sehen
CREATE POLICY "View employee settings in same tenant"
    ON employee_settings FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid()
        )
    );

-- User können ihre eigenen Settings updaten
CREATE POLICY "Update own employee settings"
    ON employee_settings FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins können alle Settings verwalten
CREATE POLICY "Admins manage all employee settings"
    ON employee_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tenant_members
            WHERE tenant_id = employee_settings.tenant_id
            AND user_id = auth.uid()
            AND role IN ('admin', 'owner')
        )
    );

-- 12. Finale Verifikation
DO $$
DECLARE
    stat RECORD;
    sample RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE '';

    -- Statistiken
    SELECT
        (SELECT COUNT(*) FROM tenant_members) as members,
        (SELECT COUNT(*) FROM employee_settings) as employees,
        (SELECT COUNT(*) FROM tenant_members WHERE role = 'admin') as admins,
        (SELECT COUNT(*) FROM tenant_members WHERE role = 'owner') as owners
    INTO stat;

    RAISE NOTICE '📊 STATISTICS:';
    RAISE NOTICE '  Total members: %', stat.members;
    RAISE NOTICE '  With employee settings: %', stat.employees;
    RAISE NOTICE '  Admins: %', stat.admins;
    RAISE NOTICE '  Owners: %', stat.owners;
    RAISE NOTICE '';

    -- Sample data
    RAISE NOTICE '📋 SAMPLE DATA from team_members:';
    FOR sample IN
        SELECT
            full_name,
            role,
            is_employee,
            is_active
        FROM team_members
        LIMIT 3
    LOOP
        RAISE NOTICE '  % | Role: % | Employee: % | Active: %',
            sample.full_name,
            sample.role,
            sample.is_employee,
            sample.is_active;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '✅ IMPROVEMENTS:';
    RAISE NOTICE '  ✓ memberships → tenant_members (better name)';
    RAISE NOTICE '  ✓ staff settings → employee_settings (clearer)';
    RAISE NOTICE '  ✓ No more role redundancy';
    RAISE NOTICE '  ✓ Clear separation of concerns';
    RAISE NOTICE '  ✓ Backward compatible views';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  OLD staff TABLE:';
    RAISE NOTICE '  Keep for now, drop later with: DROP TABLE staff CASCADE;';
END $$;

-- Comments
COMMENT ON TABLE tenant_members IS 'Mitgliedschaft von Usern in Tenants mit ihrer Rolle';
COMMENT ON TABLE employee_settings IS 'Mitarbeiter-spezifische Einstellungen (Arbeitszeiten, Farbe, etc)';
COMMENT ON VIEW team_members IS 'Kombinierte View aller Team-Mitglieder mit Details';
COMMENT ON VIEW active_employees IS 'Nur aktive Mitarbeiter mit Einstellungen';
COMMENT ON FUNCTION add_team_member IS 'Fügt ein neues Team-Mitglied hinzu mit optionalen Employee-Settings';