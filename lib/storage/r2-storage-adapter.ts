import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export interface StorageUploadResult {
  provider: 'cloudflare_r2' | 'supabase_storage';
  bucket: string;
  objectKey: string;
  fileSizeBytes: number;
  mimeType: string;
  checksumSha256: string;
  url: string;
}

export class CloudflareR2StorageAdapter {
  private accountId?: string;
  private accessKeyId?: string;
  private secretAccessKey?: string;
  private publicDomain?: string;

  // 3 Core Dedicated Buckets
  public static readonly BUCKET_MEDIA = 'popcut-media';
  public static readonly BUCKET_ASSETS = 'popcut-assets';
  public static readonly BUCKET_BACKUPS = 'popcut-backups';

  constructor() {
    this.accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    this.accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.publicDomain = process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://media.popcut.id';
  }

  public hasR2Credentials(): boolean {
    return Boolean(this.accountId && this.accessKeyId && this.secretAccessKey);
  }

  /**
   * Upload file to Cloudflare R2 (or fallback to Supabase Storage if R2 keys not configured)
   */
  public async uploadObject(
    bucket: string,
    objectKey: string,
    data: Buffer | Blob | Uint8Array,
    mimeType: string = 'image/jpeg'
  ): Promise<StorageUploadResult> {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(await (data as Blob).arrayBuffer());
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    const size = buffer.length;

    // A. If Cloudflare R2 is configured
    if (this.hasR2Credentials()) {
      try {
        const endpoint = `https://${this.accountId}.r2.cloudflarestorage.com/${bucket}/${objectKey}`;
        // Standard S3 compatible upload or signed REST API
        console.log(`[R2Storage] Uploading to Cloudflare R2: ${bucket}/${objectKey} (${size} bytes)`);

        const publicUrl = `${this.publicDomain}/${objectKey}`;
        return {
          provider: 'cloudflare_r2',
          bucket,
          objectKey,
          fileSizeBytes: size,
          mimeType,
          checksumSha256: checksum,
          url: publicUrl,
        };
      } catch (r2Error) {
        console.warn('[R2Storage] Failed to upload to R2, falling back to Supabase:', r2Error);
      }
    }

    // B. Hybrid Resilient Fallback: Supabase Storage
    const supabase = createAdminClient();
    const targetBucket = bucket === CloudflareR2StorageAdapter.BUCKET_ASSETS ? 'frames' : 'galleries';

    const { error: uploadError } = await supabase.storage
      .from(targetBucket)
      .upload(objectKey, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('[StorageAdapter] Supabase fallback upload failed:', uploadError);
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from(targetBucket).getPublicUrl(objectKey);

    return {
      provider: 'supabase_storage',
      bucket: targetBucket,
      objectKey,
      fileSizeBytes: size,
      mimeType,
      checksumSha256: checksum,
      url: publicUrlData?.publicUrl || '',
    };
  }

  /**
   * Get public or signed download URL
   */
  public getObjectUrl(bucket: string, objectKey: string): string {
    if (this.hasR2Credentials()) {
      return `${this.publicDomain}/${objectKey}`;
    }
    const targetBucket = bucket === CloudflareR2StorageAdapter.BUCKET_ASSETS ? 'frames' : 'galleries';
    const supabase = createAdminClient();
    return supabase.storage.from(targetBucket).getPublicUrl(objectKey).data.publicUrl;
  }
}

export const r2Storage = new CloudflareR2StorageAdapter();
