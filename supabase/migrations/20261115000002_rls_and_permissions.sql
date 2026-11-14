-- =====================================================================
-- POPCUT.ID ADMIN DASHBOARD & CUSTOMER APPLICATION SHARED DATABASE
-- Migration: 20261115000002_rls_and_permissions.sql
-- Description: Row Level Security (RLS) policies and RBAC functions
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. HELPER FUNCTIONS FOR AUTHORIZATION
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role_id = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.current_user_has_role('owner');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role_id IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_permission(required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Owner has all permissions implicitly
    IF public.is_owner() THEN
        RETURN true;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON rp.role_id = ur.role_id
        WHERE ur.user_id = auth.uid()
          AND rp.permission_id = required_permission
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------
-- 2. ENABLE RLS ON ALL TABLES
-- ---------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.booths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_heartbeats ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_print_pricing ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.frame_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_slots ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher_redemptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.prepaid_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepaid_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prepaid_redemptions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_booth_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booth_sync_status ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_config_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.digital_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_assets ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_job_events ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_assets ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 3. RLS POLICIES FOR AUTH & PROFILES
-- ---------------------------------------------------------------------

-- Profiles: Users can read their own profile, Admins/Owners can read all
CREATE POLICY "Users can view own profile or admins view all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin_or_owner());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Owners can manage profiles"
    ON public.profiles FOR ALL
    USING (public.is_owner());

-- Roles and permissions: Read access to authenticated staff/admins
CREATE POLICY "Staff can view roles and permissions"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can view permissions list"
    ON public.permissions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Staff can view user roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Owners can manage user roles"
    ON public.user_roles FOR ALL
    USING (public.is_owner());

-- ---------------------------------------------------------------------
-- 4. RLS POLICIES FOR BUSINESS DATA (PACKAGES, FRAMES, BOOTHS, CONFIGS)
-- ---------------------------------------------------------------------

-- Packages: Read access to all authenticated, write to Admins/Owners
CREATE POLICY "Authenticated users can view packages"
    ON public.packages FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage packages"
    ON public.packages FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view package versions"
    ON public.package_versions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage package versions"
    ON public.package_versions FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view add-on print pricing"
    ON public.additional_print_pricing FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage add-on print pricing"
    ON public.additional_print_pricing FOR ALL
    USING (public.is_admin_or_owner());

-- Frames & Visual Slots
CREATE POLICY "Authenticated users can view frame categories"
    ON public.frame_categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage frame categories"
    ON public.frame_categories FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view frames"
    ON public.frames FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage frames"
    ON public.frames FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view frame versions"
    ON public.frame_versions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage frame versions"
    ON public.frame_versions FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view frame slots"
    ON public.frame_slots FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage frame slots"
    ON public.frame_slots FOR ALL
    USING (public.is_admin_or_owner());

-- Booths & Telemetry
CREATE POLICY "Authenticated users can view booths"
    ON public.booths FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage booths"
    ON public.booths FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view heartbeats"
    ON public.booth_heartbeats FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can view booth credentials"
    ON public.booth_credentials FOR SELECT
    USING (public.is_admin_or_owner());

-- Config Publishing & Sync
CREATE POLICY "Authenticated users can view config versions"
    ON public.config_versions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage config versions"
    ON public.config_versions FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view config items"
    ON public.config_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view booth config assignments"
    ON public.config_booth_assignments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage booth config assignments"
    ON public.config_booth_assignments FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view booth sync status"
    ON public.booth_sync_status FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage booth sync status"
    ON public.booth_sync_status FOR ALL
    USING (public.is_admin_or_owner());

-- ---------------------------------------------------------------------
-- 5. RLS POLICIES FOR TRANSACTIONS, SESSIONS, AND OPERATIONS
-- ---------------------------------------------------------------------

-- Transactions
CREATE POLICY "Authenticated users can view transactions"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins or Supervisors can update transactions"
    ON public.transactions FOR UPDATE
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view transaction items"
    ON public.transaction_items FOR SELECT
    TO authenticated
    USING (true);

-- Sessions & Timeline
CREATE POLICY "Authenticated users can view sessions"
    ON public.sessions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view session events"
    ON public.session_events FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view session config snapshots"
    ON public.session_config_snapshots FOR SELECT
    TO authenticated
    USING (true);

-- Customer Photos (Privacy protection: Restricted access)
CREATE POLICY "Restricted access to customer photos"
    ON public.photos FOR SELECT
    TO authenticated
    USING (public.is_admin_or_owner());

-- Print Jobs
CREATE POLICY "Authenticated users can view print jobs"
    ON public.print_jobs FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can update print jobs"
    ON public.print_jobs FOR UPDATE
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view print job events"
    ON public.print_job_events FOR SELECT
    TO authenticated
    USING (true);

-- Digital Galleries
CREATE POLICY "Authenticated users can view digital galleries"
    ON public.digital_galleries FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view gallery assets"
    ON public.gallery_assets FOR SELECT
    TO authenticated
    USING (true);

-- Promotions & Vouchers
CREATE POLICY "Authenticated users can view promotions"
    ON public.promotions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage promotions"
    ON public.promotions FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view promotion codes"
    ON public.promotion_codes FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage promotion codes"
    ON public.promotion_codes FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view voucher redemptions"
    ON public.voucher_redemptions FOR SELECT
    TO authenticated
    USING (true);

-- Prepaid Tickets
CREATE POLICY "Authenticated users can view prepaid batches"
    ON public.prepaid_batches FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage prepaid batches"
    ON public.prepaid_batches FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view prepaid tickets"
    ON public.prepaid_tickets FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage prepaid tickets"
    ON public.prepaid_tickets FOR ALL
    USING (public.is_admin_or_owner());

CREATE POLICY "Authenticated users can view prepaid redemptions"
    ON public.prepaid_redemptions FOR SELECT
    TO authenticated
    USING (true);

-- Audit Logs (Read-only for Admins/Owners)
CREATE POLICY "Admins can view audit activity logs"
    ON public.activity_logs FOR SELECT
    USING (public.is_admin_or_owner());

-- App Settings
CREATE POLICY "Authenticated users can view settings"
    ON public.app_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only Owners can modify app settings"
    ON public.app_settings FOR ALL
    USING (public.is_owner());

-- Storage Assets
CREATE POLICY "Authenticated users can view storage assets metadata"
    ON public.storage_assets FOR SELECT
    TO authenticated
    USING (true);
