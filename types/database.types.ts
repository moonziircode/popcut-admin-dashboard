// =====================================================================
// POPCUT.ID ADMIN DASHBOARD & CUSTOMER APPLICATION SHARED DATABASE
// TypeScript Type Definitions for Supabase Database
// =====================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRoleType = 'owner' | 'admin' | 'staff';
export type BoothStatusType = 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'NEEDS_ATTENTION' | 'DISABLED';
export type FrameStatusType = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type FitModeType = 'cover' | 'contain';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_100';
export type PrepaidTicketStatusType = 'AVAILABLE' | 'USED' | 'EXPIRED' | 'DISABLED';
export type ConfigStatusType = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type SyncStatusType = 'PENDING' | 'DOWNLOADING' | 'VERIFYING' | 'APPLIED' | 'FAILED' | 'OUTDATED';
export type PaymentMethodType = 'QRIS' | 'CASH' | 'PREPAID_TICKET' | 'VOUCHER_100';
export type PaymentStatusType = 'CREATED' | 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED';
export type SessionStatusType =
  | 'CREATED'
  | 'AWAITING_PAYMENT'
  | 'READY'
  | 'IN_PROGRESS'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
  | 'RECOVERY_REQUIRED';
export type PrintJobStatusType =
  | 'QUEUED'
  | 'PREPARING'
  | 'SUBMITTING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'UNKNOWN'
  | 'CANCELLED';
export type GalleryUploadStatusType =
  | 'LOCAL_ONLY'
  | 'UPLOAD_PENDING'
  | 'UPLOADING'
  | 'AVAILABLE'
  | 'UPLOAD_FAILED'
  | 'EXPIRED'
  | 'DELETED';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  phone?: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED';
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: UserRoleType;
  name: string;
  description?: string | null;
  created_at: string;
}

export interface Permission {
  id: string;
  module: string;
  name: string;
  description?: string | null;
}

export interface PhotoboothEvent {
  id: string;
  internal_code: string;
  name: string; // e.g. "Popcut Wedding — The Ritz-Carlton"
  client_name: string; // e.g. "Bima & Sarah Wedding"
  event_type: 'WEDDING' | 'CORPORATE' | 'BIRTHDAY' | 'GRADUATION' | 'COMMUNITY' | 'POPUP';
  venue: string; // e.g. "Grand Ballroom, The Ritz-Carlton Jakarta"
  start_date: string;
  end_date: string;
  is_active: boolean; // currently running event on booth
  status: 'DRAFT' | 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ARCHIVED';
  logo_url?: string | null;
  welcome_greeting?: string | null;
  custom_theme_color?: string | null;
  allowed_package_ids: string[];
  allowed_frame_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Booth {
  id: string;
  booth_code: string;
  name: string;
  location: string;
  status: BoothStatusType;
  current_config_version_id?: string | null;
  target_config_version_id?: string | null;
  active_event_id?: string | null;
  active_event_name?: string | null;
  hardware_rig_name?: string | null;
  app_version?: string | null;
  last_seen_at?: string | null;
  camera_status: string;
  printer_status: string;
  storage_health: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  active_event?: PhotoboothEvent;
}

export interface Package {
  id: string;
  internal_code: string;
  name: string;
  description?: string | null;
  price: number; // in IDR
  photo_count: number;
  included_strips: number;
  include_live_photo: boolean;
  include_digital_files: boolean;
  allowed_categories: string[];
  display_order: number;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdditionalPrintPricing {
  id: string;
  price_per_unit: number;
  min_quantity: number;
  quantity_increment: number;
  max_quantity: number;
  eligible_packages: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FrameCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Frame {
  id: string;
  internal_code: string;
  name: string;
  category_id: string;
  dimensions: string;
  aspect_ratio: string;
  current_version_id?: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  category?: FrameCategory;
  current_version?: FrameVersion;
}

export interface FrameVersion {
  id: string;
  frame_id: string;
  version_number: number;
  asset_path: string;
  thumbnail_path?: string | null;
  checksum_sha256: string;
  file_size_bytes: number;
  dimensions: { width: number; height: number; dpi: number };
  status: FrameStatusType;
  published_at?: string | null;
  created_by?: string | null;
  created_at: string;
  slots?: FrameSlot[];
}

export interface FrameSlot {
  id: string;
  frame_version_id: string;
  slot_index: number;
  x_coord: number;
  y_coord: number;
  width: number;
  height: number;
  rotation: number;
  fit_mode: FitModeType;
  crop_config?: Record<string, any>;
  created_at: string;
}

export interface Promotion {
  id: string;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  start_date: string;
  end_date: string;
  total_usage_limit?: number | null;
  per_customer_limit: number;
  min_purchase: number;
  allow_stacking: boolean;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromotionCode {
  id: string;
  promotion_id: string;
  code: string;
  batch_id?: string | null;
  usage_count: number;
  max_uses: number;
  expires_at?: string | null;
  is_disabled: boolean;
  created_at: string;
  promotion?: Promotion;
}

export interface PrepaidBatch {
  id: string;
  batch_name: string;
  package_id: string;
  total_quantity: number;
  valid_from: string;
  valid_until: string;
  created_at: string;
  created_by?: string | null;
  package?: Package;
}

export interface PrepaidTicket {
  id: string;
  batch_id: string;
  ticket_code: string;
  status: PrepaidTicketStatusType;
  claimed_session_id?: string | null;
  claimed_at?: string | null;
  created_at: string;
  batch?: PrepaidBatch;
}

export interface ConfigVersion {
  id: string;
  version_number: string;
  schema_version: number;
  manifest_json: Record<string, any>;
  checksum_sha256: string;
  status: ConfigStatusType;
  published_at?: string | null;
  published_by?: string | null;
  created_at: string;
}

export interface BoothSyncStatus {
  id: string;
  booth_id: string;
  config_version_id: string;
  sync_status: SyncStatusType;
  download_progress_pct: number;
  last_error?: string | null;
  acknowledged_at?: string | null;
  updated_at: string;
  booth?: Booth;
  config_version?: ConfigVersion;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  booth_id: string;
  customer_ref?: string | null;
  original_amount: number;
  discount_amount: number;
  additional_print_amount: number;
  payable_amount: number;
  payment_method: PaymentMethodType;
  payment_status: PaymentStatusType;
  provider_ref?: string | null;
  paid_at?: string | null;
  verified_by?: string | null;
  correction_reason?: string | null;
  created_at: string;
  updated_at: string;
  booth?: Booth;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  item_type: 'PACKAGE' | 'ADDITIONAL_PRINT' | 'DISCOUNT';
  item_name: string;
  unit_price: number;
  quantity: number;
  total_amount: number;
  metadata?: Record<string, any>;
}

export interface Session {
  id: string;
  session_number: string;
  booth_id: string;
  transaction_id?: string | null;
  package_id: string;
  package_snapshot: Record<string, any>;
  frame_version_id?: string | null;
  session_status: SessionStatusType;
  payment_status: string;
  print_status?: string | null;
  gallery_status?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  booth?: Booth;
  transaction?: Transaction;
  events?: SessionEvent[];
}

export interface SessionEvent {
  id: string;
  session_id: string;
  event_type: string;
  payload?: Record<string, any>;
  event_timestamp: string;
}

export interface DigitalGallery {
  id: string;
  session_id: string;
  booth_id: string;
  access_token_hash: string;
  qr_route: string;
  upload_status: GalleryUploadStatusType;
  file_count: number;
  expires_at?: string | null;
  available_at?: string | null;
  download_count: number;
  last_upload_error?: string | null;
  created_at: string;
  updated_at: string;
  session?: Session;
}

export interface PrintJob {
  id: string;
  print_job_number: string;
  session_id: string;
  booth_id: string;
  printer_model?: string | null;
  print_layout: string;
  requested_strips: number;
  sheet_count: number;
  status: PrintJobStatusType;
  parent_print_job_id?: string | null;
  reprint_reason?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  submitted_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  booth?: Booth;
  session?: Session;
}

export interface ActivityLog {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  description?: string | null;
  before_state?: Record<string, any> | null;
  after_state?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AppSetting {
  id: string;
  section: string;
  key: string;
  value: Record<string, any>;
  updated_by?: string | null;
  updated_at: string;
}
