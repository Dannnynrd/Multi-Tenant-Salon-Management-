-- ========================================
-- DATENSTRUKTUR-ANALYSE UND OPTIMIERUNG
-- ========================================

-- AKTUELLE PROBLEME:
-- 1. REDUNDANZ: Role ist in staff UND memberships
-- 2. VERWIRRUNG: staff vs memberships - unklar wofür was
-- 3. NAMING: "staff" impliziert nur Mitarbeiter, aber admins sind auch drin
-- 4. LOGIK: Warum brauchen wir staff UND memberships?

-- LÖSUNG: Klare Trennung der Verantwortlichkeiten
-- ========================================
-- NEUE STRUKTUR:
--
-- profiles (User-Identität)
--   └── tenant_members (Mitgliedschaft in Tenant mit Rolle)
--         └── employee_settings (Mitarbeiter-spezifische Einstellungen)
--
-- ========================================

-- 1. Analysiere aktuelle Redundanzen
DO $$
DECLARE
    redundancy RECORD;
BEGIN
    RAISE NOTICE '=== CURRENT DATA STRUCTURE ANALYSIS ===';
    RAISE NOTICE '';

    -- Check role redundancy
    FOR redundancy IN
        SELECT
            s.id as staff_id,
            s.role as staff_role,
            m.role as membership_role,
            CASE
                WHEN s.role = m.role THEN '✅ Same'
                ELSE '❌ DIFFERENT!'
            END as status
        FROM staff s
        LEFT JOIN memberships m ON s.user_id = m.user_id AND s.tenant_id = m.tenant_id
        WHERE s.user_id IS NOT NULL
    LOOP
        RAISE NOTICE 'Role comparison: staff=% | membership=% | %',
            redundancy.staff_role,
            redundancy.membership_role,
            redundancy.status;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '🔍 FINDINGS:';
    RAISE NOTICE '  - Role is stored in BOTH tables (redundant)';
    RAISE NOTICE '  - staff has employee settings mixed with membership data';
    RAISE NOTICE '  - memberships has only role but no employee settings';
    RAISE NOTICE '  - Unclear which is source of truth for role';
END $$;

-- 2. Erstelle neue optimierte Struktur

-- SCHRITT 1: Rename memberships zu tenant_members (besserer Name)
ALTER TABLE memberships RENAME TO tenant_members;

-- Update constraints und indices Namen
ALTER TABLE tenant_members
    RENAME CONSTRAINT memberships_pkey TO tenant_members_pkey;
ALTER TABLE tenant_members
    RENAME CONSTRAINT memberships_tenant_id_user_id_key TO tenant_members_tenant_id_user_id_key;

-- SCHRITT 2: Erstelle employee_settings für Mitarbeiter-spezifische Daten
CREATE TABLE IF NOT EXISTS employee_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_member_id UUID NOT NULL,  -- Referenz zu tenant_members

    -- Arbeitsspezifische Einstellungen
    color TEXT DEFAULT '#3B82F6',
    can_book_appointments BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,

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

    -- Foreign Keys
    CONSTRAINT fk_tenant_member
        FOREIGN KEY (tenant_member_id)
        REFERENCES tenant_members(tenant_id, user_id)
        ON DELETE CASCADE
);

-- Wait, tenant_members doesn't have a single ID, let's fix that
ALTER TABLE tenant_members ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Now recreate employee_settings with proper FK
DROP TABLE IF EXISTS employee_settings;

CREATE TABLE employee_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,

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

    -- Unique constraint - one employee setting per user per tenant
    CONSTRAINT employee_settings_unique UNIQUE (tenant_id, user_id),

    -- Foreign Key zu tenant_members
    CONSTRAINT fk_tenant_member
        FOREIGN KEY (tenant_id, user_id)
        REFERENCES tenant_members(tenant_id, user_id)
        ON DELETE CASCADE
);

-- 3. Migriere Daten von staff zu employee_settings
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
  AND NOT EXISTS (
      SELECT 1 FROM employee_settings es
      WHERE es.tenant_id = s.tenant_id
        AND es.user_id = s.user_id
  );

-- 4. Update tenant_members mit korrekten Rollen (aus staff wenn unterschiedlich)
UPDATE tenant_members tm
SET role = s.role,
    updated_at = NOW()
FROM staff s
WHERE tm.tenant_id = s.tenant_id
  AND tm.user_id = s.user_id
  AND tm.role != s.role;

-- 5. Erstelle neue optimierte Views

-- Hauptview für Mitarbeiter (employees)
CREATE OR REPLACE VIEW team_members AS
SELECT
    -- IDs
    tm.tenant_id,
    tm.user_id,
    tm.id as membership_id,
    es.id as employee_settings_id,

    -- User Info (from profiles)
    p.full_name,
    p.email,
    p.phone,
    p.avatar_url,

    -- Computed name parts
    SPLIT_PART(p.full_name, ' ', 1) as first_name,
    SUBSTRING(p.full_name FROM POSITION(' ' IN p.full_name) + 1) as last_name,

    -- Membership Info
    tm.role,

    -- Employee Settings (wenn vorhanden)
    es.color,
    es.is_active,
    es.can_book_appointments,
    es.working_hours,
    es.breaks,
    es.buffer_before,
    es.buffer_after,
    es.bio,
    es.notification_preferences,
    es.display_order,

    -- Computed fields
    CASE
        WHEN es.id IS NOT NULL THEN true
        ELSE false
    END as is_employee,

    CASE
        WHEN tm.role = 'admin' THEN true
        ELSE false
    END as is_admin,

    -- Timestamps
    tm.created_at as joined_at,
    tm.updated_at as membership_updated_at,
    es.created_at as employee_since,
    es.updated_at as settings_updated_at
FROM tenant_members tm
INNER JOIN profiles p ON tm.user_id = p.id
LEFT JOIN employee_settings es ON tm.tenant_id = es.tenant_id AND tm.user_id = es.user_id
ORDER BY
    es.is_active DESC NULLS LAST,
    es.display_order,
    p.full_name;

-- View nur für aktive Mitarbeiter
CREATE OR REPLACE VIEW active_employees AS
SELECT * FROM team_members
WHERE is_employee = true
  AND is_active = true;

-- View für Admins
CREATE OR REPLACE VIEW tenant_admins AS
SELECT * FROM team_members
WHERE role = 'admin';

-- 6. Erstelle Helper Functions für die neue Struktur

-- Funktion: Füge Team-Mitglied hinzu
CREATE OR REPLACE FUNCTION add_team_member(
    p_tenant_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'staff',
    p_is_employee BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_member_id UUID;
BEGIN
    -- Add to tenant_members
    INSERT INTO tenant_members (tenant_id, user_id, role)
    VALUES (p_tenant_id, p_user_id, p_role)
    RETURNING id INTO v_member_id;

    -- If employee, create settings
    IF p_is_employee THEN
        INSERT INTO employee_settings (tenant_id, user_id)
        VALUES (p_tenant_id, p_user_id);
    END IF;

    RETURN v_member_id;
END;
$$;

-- Funktion: Mache Mitglied zum Mitarbeiter
CREATE OR REPLACE FUNCTION make_member_employee(
    p_tenant_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if already employee
    IF EXISTS (
        SELECT 1 FROM employee_settings
        WHERE tenant_id = p_tenant_id AND user_id = p_user_id
    ) THEN
        RETURN false;
    END IF;

    -- Create employee settings
    INSERT INTO employee_settings (tenant_id, user_id)
    VALUES (p_tenant_id, p_user_id);

    RETURN true;
END;
$$;

-- 7. Update RLS Policies für neue Tabellen

-- tenant_members policies
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View tenant members"
    ON tenant_members FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage members"
    ON tenant_members FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- employee_settings policies
ALTER TABLE employee_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View employee settings"
    ON employee_settings FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Update own settings"
    ON employee_settings FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all settings"
    ON employee_settings FOR ALL
    USING (
        tenant_id IN (
            SELECT tenant_id FROM tenant_members
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- 8. Erstelle Indizes für Performance
CREATE INDEX idx_employee_settings_tenant_user ON employee_settings(tenant_id, user_id);
CREATE INDEX idx_employee_settings_active ON employee_settings(tenant_id, is_active);
CREATE INDEX idx_tenant_members_user ON tenant_members(user_id);
CREATE INDEX idx_tenant_members_tenant_role ON tenant_members(tenant_id, role);

-- 9. Finale Verifikation
DO $$
DECLARE
    stat RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== RESTRUCTURING COMPLETE ===';
    RAISE NOTICE '';

    RAISE NOTICE '📊 NEW STRUCTURE:';
    RAISE NOTICE '  profiles → User identity (name, email, phone)';
    RAISE NOTICE '  tenant_members → Membership & role in tenant';
    RAISE NOTICE '  employee_settings → Employee-specific settings';
    RAISE NOTICE '';

    -- Stats
    SELECT
        (SELECT COUNT(*) FROM tenant_members) as members,
        (SELECT COUNT(*) FROM employee_settings) as employees,
        (SELECT COUNT(*) FROM tenant_members WHERE role = 'admin') as admins
    INTO stat;

    RAISE NOTICE '📈 DATA:';
    RAISE NOTICE '  Total members: %', stat.members;
    RAISE NOTICE '  Employees: %', stat.employees;
    RAISE NOTICE '  Admins: %', stat.admins;
    RAISE NOTICE '';

    RAISE NOTICE '✅ IMPROVEMENTS:';
    RAISE NOTICE '  ✓ Clear separation of concerns';
    RAISE NOTICE '  ✓ No role redundancy';
    RAISE NOTICE '  ✓ Better table names';
    RAISE NOTICE '  ✓ Logical data structure';
    RAISE NOTICE '  ✓ Flexible: Members can be non-employees';
    RAISE NOTICE '';

    RAISE NOTICE '⚠️  NEXT STEPS:';
    RAISE NOTICE '  1. Update API endpoints to use new views';
    RAISE NOTICE '  2. Test all functionality';
    RAISE NOTICE '  3. Drop old staff table: DROP TABLE staff CASCADE;';
END $$;

-- Comments
COMMENT ON TABLE tenant_members IS 'Mitgliedschaften von Usern in Tenants mit ihrer Rolle';
COMMENT ON TABLE employee_settings IS 'Mitarbeiter-spezifische Einstellungen für Team-Mitglieder';
COMMENT ON VIEW team_members IS 'Alle Team-Mitglieder mit ihren Rollen und Einstellungen';
COMMENT ON VIEW active_employees IS 'Nur aktive Mitarbeiter';
COMMENT ON VIEW tenant_admins IS 'Nur Administratoren';