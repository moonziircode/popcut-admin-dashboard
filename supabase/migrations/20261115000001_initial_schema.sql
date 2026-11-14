-- =====================================================================
-- POPCUT.ID ADMIN DASHBOARD & CUSTOMER APPLICATION SHARED DATABASE
-- Migration: 20261115000001_initial_schema.sql
-- Description: Core relational schema for Popcut.id photobooth platform
-- =====================================================================

-- 0. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. AUTH & ROLES
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INVITED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY CHECK (id IN ('owner', 'admin', 'staff')),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.permissions (
    id TEXT PRIMARY KEY,
    module TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id TEXT NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ---------------------------------------------------------------------
-- 2. BOOTHS (FLEET DEVICES)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.booths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'DEGRADED', 'NEEDS_ATTENTION', 'DISABLED')),
    current_config_version_id UUID,
    target_config_version_id UUID,
    app_version TEXT,
    last_seen_at TIMESTAMPTZ,
    camera_status TEXT DEFAULT 'DISCONNECTED',
    printer_status TEXT DEFAULT 'DISCONNECTED',
    storage_health JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.booth_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    key_hint TEXT NOT NULL,
    revoked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.booth_heartbeats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
    camera_state TEXT NOT NULL,
    printer_state TEXT NOT NULL,
    storage_free_bytes BIGINT,
    pending_uploads INT NOT NULL DEFAULT 0,
    pending_prints INT NOT NULL DEFAULT 0,
    app_version TEXT,
    local_timestamp TIMESTAMPTZ,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------
-- 3. PACKAGES & PRICING
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    price BIGINT NOT NULL CHECK (price >= 0),
    photo_count INT NOT NULL CHECK (photo_count > 0),
    included_strips INT NOT NULL CHECK (included_strips > 0),
    include_live_photo BOOLEAN NOT NULL DEFAULT false,
    include_digital_files BOOLEAN NOT NULL DEFAULT true,
    allowed_categories TEXT[] DEFAULT '{}',
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.package_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    snapshot JSONB NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE (package_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.additional_print_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    price_per_unit BIGINT NOT NULL CHECK (price_per_unit >= 0),
    min_quantity INT NOT NULL DEFAULT 1 CHECK (min_quantity >= 1),
    quantity_increment INT NOT NULL DEFAULT 1 CHECK (quantity_increment >= 1),
    max_quantity INT NOT NULL DEFAULT 10 CHECK (max_quantity >= min_quantity),
    eligible_packages UUID[] DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------
-- 4. FRAMES & VISUAL SLOTS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.frame_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.frames (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    internal_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.frame_categories(id) ON DELETE RESTRICT,
    dimensions TEXT NOT NULL DEFAULT '2x6',
    aspect_ratio TEXT NOT NULL DEFAULT '1:3',
    current_version_id UUID,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.frame_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frame_id UUID NOT NULL REFERENCES public.frames(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    asset_path TEXT NOT NULL,
    thumbnail_path TEXT,
    checksum_sha256 TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    dimensions JSONB NOT NULL DEFAULT '{"width": 1200, "height": 3600, "dpi": 300}'::jsonb,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (frame_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.frame_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    frame_version_id UUID NOT NULL REFERENCES public.frame_versions(id) ON DELETE CASCADE,
    slot_index INT NOT NULL,
    x_coord NUMERIC(8,2) NOT NULL,
    y_coord NUMERIC(8,2) NOT NULL,
    width NUMERIC(8,2) NOT NULL CHECK (width > 0),
    height NUMERIC(8,2) NOT NULL CHECK (height > 0),
    rotation NUMERIC(5,2) NOT NULL DEFAULT 0,
    fit_mode TEXT NOT NULL DEFAULT 'cover' CHECK (fit_mode IN ('cover', 'contain')),
    crop_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (frame_version_id, slot_index)
);

-- ---------------------------------------------------------------------
-- 5. PROMOTIONS & VOUCHERS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_100')),
    discount_value BIGINT NOT NULL CHECK (discount_value >= 0),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL CHECK (end_date >= start_date),
    total_usage_limit INT,
    per_customer_limit INT NOT NULL DEFAULT 1,
    min_purchase BIGINT NOT NULL DEFAULT 0,
    allow_stacking BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.promotion_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_id UUID NOT NULL REFERENCES public.promotions(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    batch_id UUID,
    usage_count INT NOT NULL DEFAULT 0,
    max_uses INT NOT NULL DEFAULT 1,
    expires_at TIMESTAMPTZ,
    is_disabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.voucher_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promotion_code_id UUID NOT NULL REFERENCES public.promotion_codes(id) ON DELETE RESTRICT,
    session_id UUID,
    transaction_id UUID,
    redeemed_amount BIGINT NOT NULL CHECK (redeemed_amount >= 0),
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    booth_id UUID REFERENCES public.booths(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 6. PREPAID TICKETS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.prepaid_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name TEXT NOT NULL,
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
    total_quantity INT NOT NULL CHECK (total_quantity > 0),
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL CHECK (valid_until >= valid_from),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.prepaid_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.prepaid_batches(id) ON DELETE CASCADE,
    ticket_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'USED', 'EXPIRED', 'DISABLED')),
    claimed_session_id UUID,
    claimed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.prepaid_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.prepaid_tickets(id) ON DELETE RESTRICT,
    session_id UUID,
    transaction_id UUID,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    booth_id UUID REFERENCES public.booths(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 7. CONFIGURATION MANAGEMENT & BOOTH SYNC
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.config_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number TEXT NOT NULL UNIQUE,
    schema_version INT NOT NULL DEFAULT 1,
    manifest_json JSONB NOT NULL,
    checksum_sha256 TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.config_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_version_id UUID NOT NULL REFERENCES public.config_versions(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_id UUID NOT NULL,
    snapshot JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS public.config_booth_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_version_id UUID NOT NULL REFERENCES public.config_versions(id) ON DELETE CASCADE,
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE (config_version_id, booth_id)
);

CREATE TABLE IF NOT EXISTS public.booth_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE CASCADE,
    config_version_id UUID NOT NULL REFERENCES public.config_versions(id) ON DELETE CASCADE,
    sync_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'DOWNLOADING', 'VERIFYING', 'APPLIED', 'FAILED', 'OUTDATED')),
    download_progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    last_error TEXT,
    acknowledged_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (booth_id, config_version_id)
);

-- ---------------------------------------------------------------------
-- 8. TRANSACTIONS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number TEXT NOT NULL UNIQUE,
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE RESTRICT,
    customer_ref TEXT,
    original_amount BIGINT NOT NULL CHECK (original_amount >= 0),
    discount_amount BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    additional_print_amount BIGINT NOT NULL DEFAULT 0 CHECK (additional_print_amount >= 0),
    payable_amount BIGINT NOT NULL CHECK (payable_amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('QRIS', 'CASH', 'PREPAID_TICKET', 'VOUCHER_100')),
    payment_status TEXT NOT NULL DEFAULT 'CREATED' CHECK (payment_status IN ('CREATED', 'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED')),
    provider_ref TEXT,
    paid_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    correction_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('PACKAGE', 'ADDITIONAL_PRINT', 'DISCOUNT')),
    item_name TEXT NOT NULL,
    unit_price BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_amount BIGINT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------
-- 9. SESSIONS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_number TEXT NOT NULL UNIQUE,
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE RESTRICT,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
    package_snapshot JSONB NOT NULL,
    frame_version_id UUID REFERENCES public.frame_versions(id) ON DELETE RESTRICT,
    session_status TEXT NOT NULL DEFAULT 'CREATED' CHECK (session_status IN ('CREATED', 'AWAITING_PAYMENT', 'READY', 'IN_PROGRESS', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED', 'RECOVERY_REQUIRED')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    print_status TEXT DEFAULT 'NOT_REQUESTED',
    gallery_status TEXT DEFAULT 'LOCAL_ONLY',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.session_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.session_config_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    config_version_id UUID NOT NULL REFERENCES public.config_versions(id) ON DELETE RESTRICT,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    photo_index INT NOT NULL,
    storage_path TEXT NOT NULL,
    is_retake BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (session_id, photo_index, is_retake)
);

-- ---------------------------------------------------------------------
-- 10. DIGITAL GALLERIES
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.digital_galleries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE RESTRICT,
    access_token_hash TEXT NOT NULL,
    qr_route TEXT NOT NULL,
    upload_status TEXT NOT NULL DEFAULT 'LOCAL_ONLY' CHECK (upload_status IN ('LOCAL_ONLY', 'UPLOAD_PENDING', 'UPLOADING', 'AVAILABLE', 'UPLOAD_FAILED', 'EXPIRED', 'DELETED')),
    file_count INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    available_at TIMESTAMPTZ,
    download_count INT NOT NULL DEFAULT 0,
    last_upload_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.gallery_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gallery_id UUID NOT NULL REFERENCES public.digital_galleries(id) ON DELETE CASCADE,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('ORIGINAL', 'RENDERED_STRIP', 'LIVE_PHOTO_VIDEO')),
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT NOT NULL,
    checksum_sha256 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------
-- 11. PRINT JOBS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.print_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    print_job_number TEXT NOT NULL UNIQUE,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    booth_id UUID NOT NULL REFERENCES public.booths(id) ON DELETE RESTRICT,
    printer_model TEXT,
    print_layout TEXT NOT NULL DEFAULT '2x6',
    requested_strips INT NOT NULL DEFAULT 2 CHECK (requested_strips > 0),
    sheet_count INT NOT NULL DEFAULT 1 CHECK (sheet_count > 0),
    status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PREPARING', 'SUBMITTING', 'PROCESSING', 'COMPLETED', 'FAILED', 'UNKNOWN', 'CANCELLED')),
    parent_print_job_id UUID REFERENCES public.print_jobs(id) ON DELETE SET NULL,
    reprint_reason TEXT,
    error_code TEXT,
    error_message TEXT,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.print_job_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    print_job_id UUID NOT NULL REFERENCES public.print_jobs(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------
-- 12. AUDIT TRAIL, SETTINGS & STORAGE ASSETS
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    description TEXT,
    before_state JSONB,
    after_state JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.storage_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id TEXT NOT NULL,
    object_path TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum_sha256 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ---------------------------------------------------------------------
-- 13. INDEXES FOR PERFORMANCE
-- ---------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_booths_status ON public.booths(status);
CREATE INDEX IF NOT EXISTS idx_booth_heartbeats_booth ON public.booth_heartbeats(booth_id, reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_packages_active ON public.packages(is_active, is_archived);
CREATE INDEX IF NOT EXISTS idx_frames_category ON public.frames(category_id);
CREATE INDEX IF NOT EXISTS idx_frame_versions_frame ON public.frame_versions(frame_id, status);
CREATE INDEX IF NOT EXISTS idx_promotion_codes_code ON public.promotion_codes(code);
CREATE INDEX IF NOT EXISTS idx_prepaid_tickets_code ON public.prepaid_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_prepaid_tickets_status ON public.prepaid_tickets(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_booth ON public.transactions(booth_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(payment_status);
CREATE INDEX IF NOT EXISTS idx_sessions_booth ON public.sessions(booth_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(session_status);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON public.sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_print_jobs_booth ON public.print_jobs(booth_id);
CREATE INDEX IF NOT EXISTS idx_print_jobs_status ON public.print_jobs(status);
CREATE INDEX IF NOT EXISTS idx_digital_galleries_session ON public.digital_galleries(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
