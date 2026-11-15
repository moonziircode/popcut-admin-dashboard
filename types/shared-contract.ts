// =====================================================================
// POPCUT.ID — SHARED INTEGRATION CONTRACT
// Contract types shared between Admin Dashboard and Customer Application
// =====================================================================

import { 
  Package, 
  Frame, 
  FrameSlot, 
  Promotion, 
  Booth, 
  ConfigVersion, 
  SessionStatusType, 
  PrintJobStatusType,
  GalleryUploadStatusType 
} from './database.types';

export interface BoothProvisionRequest {
  booth_code: string;
  provisioning_token: string;
  hardware_fingerprint: string;
  app_version: string;
  os_version: string;
}

export interface BoothProvisionResponse {
  success: boolean;
  booth_id: string;
  booth_name: string;
  device_secret: string;
  initial_config_version?: string;
}

export interface BoothHeartbeatPayload {
  booth_id: string;
  camera_state: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  printer_state: 'READY' | 'PRINTING' | 'LOW_PAPER' | 'LOW_INK' | 'ERROR' | 'DISCONNECTED';
  storage_free_bytes: number;
  pending_uploads: number;
  pending_prints: number;
  app_version: string;
  current_config_version_id: string;
  local_timestamp: string;
}

export interface AssetManifestEntry {
  asset_type: 'FRAME_MASTER' | 'FRAME_THUMBNAIL' | 'STICKER' | 'AUDIO';
  asset_id: string;
  version_number: number;
  download_url: string;
  file_size_bytes: number;
  checksum_sha256: string;
  target_relative_path: string;
}

export interface BoothConfigDeliveryResponse {
  schema_version: number;
  config_version_id: string;
  version_number: string;
  booth_id: string;
  published_at: string;
  packages: Package[];
  additional_print_pricing: {
    price_per_unit: number;
    min_quantity: number;
    quantity_increment: number;
    max_quantity: number;
  };
  frames: Array<Frame & { slots: FrameSlot[]; asset_entry: AssetManifestEntry }>;
  promotions: Promotion[];
  kiosk_settings: {
    welcome_title: string;
    idle_timeout_seconds: number;
    payment_timeout_seconds: number;
    session_duration_minutes: number;
    allow_retakes: boolean;
    max_retakes_per_pose: number;
    enable_live_photo: boolean;
    event_name?: string;
    event_venue?: string;
  };
  event_info?: {
    event_id: string;
    event_name: string;
    client_name: string;
    venue: string;
    theme_color?: string | null;
    welcome_greeting?: string | null;
  };
  assets_manifest: AssetManifestEntry[];
}

export interface BoothAckConfigPayload {
  booth_id: string;
  config_version_id: string;
  status: 'APPLIED' | 'FAILED';
  error_details?: string;
  applied_at: string;
}

export interface CustomerSessionCreatePayload {
  idempotency_key: string;
  booth_id: string;
  package_id: string;
  config_version_id: string;
  payment_method: 'QRIS' | 'CASH' | 'PREPAID_TICKET' | 'VOUCHER_100';
  additional_strips_count?: number;
  voucher_code?: string;
  ticket_code?: string;
}

export interface CustomerSessionCreateResponse {
  session_id: string;
  session_number: string;
  transaction_id: string;
  transaction_number: string;
  payable_amount: number;
  payment_status: 'PAID' | 'PENDING';
  qris_payload?: string;
  qris_expires_at?: string;
}

export interface SessionTimelineUpdatePayload {
  session_id: string;
  event_type:
    | 'SESSION_STARTED'
    | 'PAYMENT_CONFIRMED'
    | 'FRAME_SELECTED'
    | 'PHOTO_CAPTURED'
    | 'PHOTO_RETAKEN'
    | 'EDITING_COMPLETED'
    | 'PRINT_SUBMITTED'
    | 'PRINT_COMPLETED'
    | 'GALLERY_UPLOADED'
    | 'SESSION_COMPLETED'
    | 'SESSION_FAILED';
  payload?: Record<string, any>;
  occurred_at: string;
}

export interface PrintJobCreatePayload {
  session_id: string;
  booth_id: string;
  printer_model: string;
  print_layout: string;
  requested_strips: number;
  sheet_count: number;
}

export interface PrintJobStatusUpdatePayload {
  print_job_id: string;
  status: PrintJobStatusType;
  error_code?: string;
  error_message?: string;
  completed_at?: string;
}

export interface DigitalGalleryRegisterPayload {
  session_id: string;
  booth_id: string;
  access_token: string;
  file_count: number;
}

export interface DigitalGalleryRegisterResponse {
  gallery_id: string;
  qr_view_url: string;
  upload_target_urls: Array<{
    asset_type: 'ORIGINAL' | 'RENDERED_STRIP' | 'LIVE_PHOTO_VIDEO';
    signed_upload_url: string;
    object_path: string;
  }>;
}

export interface StandardApiError {
  code: string;
  message: string;
  retryable: boolean;
  request_id: string;
  details?: Record<string, any>;
}
