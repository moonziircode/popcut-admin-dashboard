-- ============================================================================
-- POPCUT.ID MIGRATION: 20261118000001_fix_integration_schema.sql
-- Description: Schema alignment for Kiosk Hardware Identification, 
--              Session-Event relations, indexing, and compatibility views
-- ============================================================================

-- 1. Booths: Hardware Machine Identifier
ALTER TABLE public.booths 
ADD COLUMN IF NOT EXISTS device_identifier TEXT UNIQUE;

COMMENT ON COLUMN public.booths.device_identifier IS 'Unique hardware identifier assigned to booth machine (e.g., dev-unit-01-macbook)';

-- Seed device identifiers for known booth codes
UPDATE public.booths 
SET device_identifier = 'dev-unit-01-macbook' 
WHERE booth_code = 'RIG-M1-01' AND (device_identifier IS NULL OR device_identifier = '');

UPDATE public.booths 
SET device_identifier = 'dev-unit-02-imac' 
WHERE booth_code = 'RIG-M1-02' AND (device_identifier IS NULL OR device_identifier = '');

-- 2. Sessions: Event Relationship and Foreign Key
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.sessions.event_id IS 'Direct reference to events table for session contextualization';

-- 3. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON public.sessions(event_id);
CREATE INDEX IF NOT EXISTS idx_sessions_booth_id ON public.sessions(booth_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booth_id ON public.transactions(booth_id);

-- 4. Compatibility Views for Kiosk Desktop Client Sync
-- Customer application legacy code targets 'galleries' and 'gallery_items'
CREATE OR REPLACE VIEW public.galleries AS 
SELECT * FROM public.digital_galleries;

CREATE OR REPLACE VIEW public.gallery_items AS 
SELECT * FROM public.gallery_assets;

-- Grant permissions for views to service_role and authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.galleries TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated, service_role;
