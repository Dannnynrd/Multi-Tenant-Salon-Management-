-- ========================================
-- UPDATE STAFF VIEWS FOR NEW STRUCTURE
-- ========================================

-- Drop old view if exists
DROP VIEW IF EXISTS staff_with_profiles CASCADE;

-- Create new view that joins with the updated structure
CREATE VIEW staff_with_profiles AS
SELECT
    s.id,
    s.tenant_id,
    s.user_id,
    -- Profile data
    p.email,
    p.full_name,
    p.avatar_url,
    p.phone,
    -- Staff settings
    s.color,
    s.role,
    s.is_active,
    s.can_book_appointments,
    s.display_order,
    -- Use first_name and last_name from staff for backwards compatibility
    s.first_name,
    s.last_name,
    -- Timestamps
    s.created_at,
    s.updated_at
FROM staff s
LEFT JOIN profiles p ON s.user_id = p.id;

-- Grant permissions
GRANT SELECT ON staff_with_profiles TO authenticated;

-- Also ensure tenant_team view exists (from migration)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'tenant_team') THEN
        CREATE VIEW tenant_team AS
        SELECT
            tm.id as membership_id,
            tm.tenant_id,
            tm.user_id,
            tm.role as member_role,
            tm.created_at as joined_at,
            -- Profile data
            p.email,
            p.full_name,
            p.avatar_url,
            p.phone,
            -- Employee settings (if exists)
            es.id as employee_settings_id,
            es.color,
            es.display_order,
            es.is_active,
            es.can_book_appointments,
            es.working_hours,
            es.bio,
            es.specializations,
            es.notification_preferences,
            -- Computed fields
            CASE
                WHEN es.id IS NOT NULL AND es.is_active THEN true
                ELSE false
            END as is_employee,
            CASE
                WHEN tm.role IN ('admin', 'owner') THEN true
                ELSE false
            END as is_admin
        FROM tenant_members tm
        JOIN profiles p ON tm.user_id = p.id
        LEFT JOIN employee_settings es ON es.tenant_id = tm.tenant_id AND es.user_id = tm.user_id
        ORDER BY
            CASE tm.role
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                WHEN 'staff' THEN 3
                WHEN 'member' THEN 4
            END,
            es.display_order,
            p.full_name;

        GRANT SELECT ON tenant_team TO authenticated;
    END IF;
END $$;

-- Create tenant_employees view if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'tenant_employees') THEN
        CREATE VIEW tenant_employees AS
        SELECT
            es.id,
            es.tenant_id,
            es.user_id,
            -- Profile data
            p.email,
            p.full_name,
            p.avatar_url,
            p.phone,
            -- Employee settings
            es.color,
            es.display_order,
            es.is_active,
            es.can_book_appointments,
            es.working_hours,
            es.bio,
            es.specializations,
            es.notification_preferences,
            -- Member role
            tm.role as member_role,
            -- Timestamps
            es.created_at,
            es.updated_at
        FROM employee_settings es
        JOIN profiles p ON es.user_id = p.id
        JOIN tenant_members tm ON tm.tenant_id = es.tenant_id AND tm.user_id = es.user_id
        WHERE es.is_active = true
        ORDER BY es.display_order, p.full_name;

        GRANT SELECT ON tenant_employees TO authenticated;
    END IF;
END $$;

-- Verify views
DO $$
DECLARE
    view_rec RECORD;
BEGIN
    RAISE NOTICE 'Available views:';
    FOR view_rec IN
        SELECT table_name
        FROM information_schema.views
        WHERE table_schema = 'public'
        AND table_name IN ('staff_with_profiles', 'tenant_team', 'tenant_employees')
    LOOP
        RAISE NOTICE '  - %', view_rec.table_name;
    END LOOP;
END $$;