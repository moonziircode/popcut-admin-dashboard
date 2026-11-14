-- =====================================================================
-- POPCUT.ID ADMIN DASHBOARD & CUSTOMER APPLICATION SHARED DATABASE
-- Migration: 20261115000003_atomic_rpc_functions.sql
-- Description: Atomic PostgreSQL Functions/RPC for mission-critical operations
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ATOMIC VOUCHER REDEMPTION
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.redeem_voucher_atomic(
    p_code TEXT,
    p_session_id UUID,
    p_transaction_id UUID,
    p_booth_id UUID,
    p_subtotal BIGINT
)
RETURNS JSONB AS $$
DECLARE
    v_code_rec RECORD;
    v_promo_rec RECORD;
    v_calculated_discount BIGINT := 0;
    v_redemption_id UUID;
BEGIN
    -- 1. Lock and fetch promotion code
    SELECT pc.*, p.id AS promo_id, p.discount_type, p.discount_value, 
           p.start_date, p.end_date, p.min_purchase, p.total_usage_limit, 
           p.is_active AS promo_active, p.is_archived AS promo_archived
    INTO v_code_rec
    FROM public.promotion_codes pc
    JOIN public.promotions p ON p.id = pc.promotion_id
    WHERE UPPER(pc.code) = UPPER(TRIM(p_code))
    FOR UPDATE OF pc;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'CODE_NOT_FOUND', 'message', 'Kode voucher tidak ditemukan.');
    END IF;

    -- 2. Validate states
    IF v_code_rec.is_disabled OR NOT v_code_rec.promo_active OR v_code_rec.promo_archived THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'CODE_DISABLED', 'message', 'Voucher sedang tidak aktif.');
    END IF;

    IF v_code_rec.expires_at IS NOT NULL AND v_code_rec.expires_at < now() THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'CODE_EXPIRED', 'message', 'Voucher telah kedaluwarsa.');
    END IF;

    IF now() < v_code_rec.start_date OR now() > v_code_rec.end_date THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'PROMO_PERIOD_INVALID', 'message', 'Periode promosi belum dimulai atau telah berakhir.');
    END IF;

    IF v_code_rec.usage_count >= v_code_rec.max_uses THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'USAGE_LIMIT_EXCEEDED', 'message', 'Kuota pemakaian voucher telah habis.');
    END IF;

    IF p_subtotal < v_code_rec.min_purchase THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'MIN_PURCHASE_NOT_MET', 'message', 'Minimum nominal transaksi belum terpenuhi.');
    END IF;

    -- 3. Calculate discount amount
    IF v_code_rec.discount_type = 'FREE_100' THEN
        v_calculated_discount := p_subtotal;
    ELSIF v_code_rec.discount_type = 'PERCENTAGE' THEN
        v_calculated_discount := (p_subtotal * v_code_rec.discount_value) / 100;
        IF v_calculated_discount > p_subtotal THEN
            v_calculated_discount := p_subtotal;
        END IF;
    ELSIF v_code_rec.discount_type = 'FIXED_AMOUNT' THEN
        v_calculated_discount := LEAST(v_code_rec.discount_value, p_subtotal);
    END IF;

    -- 4. Increment usage counter
    UPDATE public.promotion_codes
    SET usage_count = usage_count + 1
    WHERE id = v_code_rec.id;

    -- 5. Record redemption
    INSERT INTO public.voucher_redemptions (
        promotion_code_id,
        session_id,
        transaction_id,
        redeemed_amount,
        booth_id
    ) VALUES (
        v_code_rec.id,
        p_session_id,
        p_transaction_id,
        v_calculated_discount,
        p_booth_id
    ) RETURNING id INTO v_redemption_id;

    RETURN jsonb_build_object(
        'success', true,
        'redemption_id', v_redemption_id,
        'discount_amount', v_calculated_discount,
        'discount_type', v_code_rec.discount_type,
        'code', v_code_rec.code
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 2. ATOMIC PREPAID TICKET REDEMPTION
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.redeem_ticket_atomic(
    p_ticket_code TEXT,
    p_session_id UUID,
    p_transaction_id UUID,
    p_booth_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_ticket_rec RECORD;
    v_redemption_id UUID;
BEGIN
    -- 1. Lock and fetch ticket
    SELECT pt.*, pb.package_id, pb.valid_from, pb.valid_until, p.name AS package_name
    INTO v_ticket_rec
    FROM public.prepaid_tickets pt
    JOIN public.prepaid_batches pb ON pb.id = pt.batch_id
    JOIN public.packages p ON p.id = pb.package_id
    WHERE UPPER(pt.ticket_code) = UPPER(TRIM(p_ticket_code))
    FOR UPDATE OF pt;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'TICKET_NOT_FOUND', 'message', 'Kode tiket tidak ditemukan.');
    END IF;

    -- 2. Validate ticket status and dates
    IF v_ticket_rec.status = 'USED' THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'TICKET_ALREADY_USED', 'message', 'Tiket sudah pernah digunakan sebelumnya.');
    END IF;

    IF v_ticket_rec.status = 'DISABLED' THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'TICKET_DISABLED', 'message', 'Tiket telah dinonaktifkan.');
    END IF;

    IF now() < v_ticket_rec.valid_from OR now() > v_ticket_rec.valid_until THEN
        UPDATE public.prepaid_tickets SET status = 'EXPIRED' WHERE id = v_ticket_rec.id;
        RETURN jsonb_build_object('success', false, 'error_code', 'TICKET_EXPIRED', 'message', 'Tiket telah kedaluwarsa.');
    END IF;

    -- 3. Mark ticket as USED
    UPDATE public.prepaid_tickets
    SET status = 'USED',
        claimed_session_id = p_session_id,
        claimed_at = now()
    WHERE id = v_ticket_rec.id;

    -- 4. Record redemption
    INSERT INTO public.prepaid_redemptions (
        ticket_id,
        session_id,
        transaction_id,
        booth_id
    ) VALUES (
        v_ticket_rec.id,
        p_session_id,
        p_transaction_id,
        p_booth_id
    ) RETURNING id INTO v_redemption_id;

    RETURN jsonb_build_object(
        'success', true,
        'redemption_id', v_redemption_id,
        'ticket_code', v_ticket_rec.ticket_code,
        'package_id', v_ticket_rec.package_id,
        'package_name', v_ticket_rec.package_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 3. ATOMIC CONFIGURATION PUBLISHING
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.publish_configuration_version(
    p_version_number TEXT,
    p_manifest JSONB,
    p_checksum TEXT,
    p_target_booth_ids UUID[],
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_config_id UUID;
    v_booth_id UUID;
BEGIN
    -- 1. Create published config version record
    INSERT INTO public.config_versions (
        version_number,
        schema_version,
        manifest_json,
        checksum_sha256,
        status,
        published_at,
        published_by
    ) VALUES (
        p_version_number,
        1,
        p_manifest,
        p_checksum,
        'PUBLISHED',
        now(),
        p_actor_id
    ) RETURNING id INTO v_config_id;

    -- 2. Assign to target booths and set sync status
    FOREACH v_booth_id IN ARRAY p_target_booth_ids
    LOOP
        INSERT INTO public.config_booth_assignments (
            config_version_id,
            booth_id,
            assigned_by
        ) VALUES (
            v_config_id,
            v_booth_id,
            p_actor_id
        ) ON CONFLICT (config_version_id, booth_id) DO NOTHING;

        -- Update booth target config
        UPDATE public.booths
        SET target_config_version_id = v_config_id,
            updated_at = now()
        WHERE id = v_booth_id;

        -- Upsert sync status
        INSERT INTO public.booth_sync_status (
            booth_id,
            config_version_id,
            sync_status,
            download_progress_pct,
            updated_at
        ) VALUES (
            v_booth_id,
            v_config_id,
            'PENDING',
            0,
            now()
        )
        ON CONFLICT (booth_id, config_version_id) DO UPDATE
        SET sync_status = 'PENDING',
            download_progress_pct = 0,
            updated_at = now();
    END LOOP;

    -- 3. Record Audit Log
    INSERT INTO public.activity_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        description,
        after_state
    ) VALUES (
        p_actor_id,
        'PUBLISH_CONFIGURATION',
        'config_versions',
        v_config_id::text,
        format('Menerbitkan konfigurasi versi %s ke %s booth', p_version_number, array_length(p_target_booth_ids, 1)),
        jsonb_build_object('version', p_version_number, 'booths', p_target_booth_ids)
    );

    RETURN jsonb_build_object(
        'success', true,
        'config_version_id', v_config_id,
        'version_number', p_version_number,
        'assigned_booths_count', array_length(p_target_booth_ids, 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 4. AUTHORIZED REPRINT REQUEST
-- ---------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.request_reprint_job(
    p_original_job_id UUID,
    p_reprint_quantity INT,
    p_reprint_reason TEXT,
    p_actor_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_orig_job RECORD;
    v_new_job_id UUID;
    v_new_job_num TEXT;
BEGIN
    SELECT * INTO v_orig_job
    FROM public.print_jobs
    WHERE id = p_original_job_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'JOB_NOT_FOUND', 'message', 'Print job awal tidak ditemukan.');
    END IF;

    IF p_reprint_quantity <= 0 OR p_reprint_quantity > v_orig_job.requested_strips THEN
        RETURN jsonb_build_object('success', false, 'error_code', 'INVALID_QUANTITY', 'message', 'Jumlah cetak ulang harus antara 1 dan kuantitas awal.');
    END IF;

    -- Generate new print job number
    v_new_job_num := 'PJ-RPR-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);

    -- Create linked reprint job
    INSERT INTO public.print_jobs (
        print_job_number,
        session_id,
        booth_id,
        printer_model,
        print_layout,
        requested_strips,
        sheet_count,
        status,
        parent_print_job_id,
        reprint_reason,
        submitted_at
    ) VALUES (
        v_new_job_num,
        v_orig_job.session_id,
        v_orig_job.booth_id,
        v_orig_job.printer_model,
        v_orig_job.print_layout,
        p_reprint_quantity,
        CEIL(p_reprint_quantity::numeric / 2),
        'QUEUED',
        p_original_job_id,
        p_reprint_reason,
        now()
    ) RETURNING id INTO v_new_job_id;

    -- Log print event
    INSERT INTO public.print_job_events (
        print_job_id,
        event_type,
        payload
    ) VALUES (
        v_new_job_id,
        'REPRINT_AUTHORIZED',
        jsonb_build_object('parent_job', p_original_job_id, 'reason', p_reprint_reason, 'authorized_by', p_actor_id)
    );

    -- Record in audit log
    INSERT INTO public.activity_logs (
        actor_id,
        action,
        entity_type,
        entity_id,
        description
    ) VALUES (
        p_actor_id,
        'REQUEST_REPRINT',
        'print_jobs',
        v_new_job_id::text,
        format('Permintaan cetak ulang %s lembar untuk job %s. Alasan: %s', p_reprint_quantity, v_orig_job.print_job_number, p_reprint_reason)
    );

    RETURN jsonb_build_object(
        'success', true,
        'reprint_job_id', v_new_job_id,
        'print_job_number', v_new_job_num,
        'requested_strips', p_reprint_quantity
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
