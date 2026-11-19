import crypto from 'crypto';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
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
  private publicDomain: string;
  private s3Client?: S3Client;

  // 3 Core Dedicated Buckets
  public static readonly BUCKET_MEDIA = 'popcut-media';
  public static readonly BUCKET_ASSETS = 'popcut-assets';
  public static readonly BUCKET_BACKUPS = 'popcut-backups';

  constructor() {
    this.accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || process.env.R2_ACCOUNT_ID;
    this.accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    this.secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    this.publicDomain = (
      process.env.CLOUDFLARE_R2_PUBLIC_URL ||
      process.env.R2_PUBLIC_URL ||
      'https://pub-f19eb9a811cc4ae192a7a8411dd1204b.r2.dev'
    ).replace(/\/+$/, '');

    if (this.hasR2Credentials()) {
      try {
        this.s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: this.accessKeyId!,
            secretAccessKey: this.secretAccessKey!,
          },
        });
      } catch (e) {
        console.warn('[R2StorageAdapter] Failed to initialize S3Client:', e);
      }
    }
  }

  public hasR2Credentials(): boolean {
    const acc = this.accountId || '';
    const key = this.accessKeyId || '';
    const sec = this.secretAccessKey || '';
    if (!acc || !key || !sec) return false;
    const dummy = ['your_', 'placeholder', 'dummy', '1234567890abcdef'];
    if (dummy.some((d) => key.includes(d) || sec.includes(d) || acc.includes(d))) {
      return false;
    }
    return true;
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

    // A. If Cloudflare R2 is configured and client ready
    if (this.hasR2Credentials() && this.s3Client) {
      try {
        console.log(`[R2Storage] Uploading to Cloudflare R2: ${bucket}/${objectKey} (${size} bytes)`);

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: objectKey,
            Body: buffer,
            ContentType: mimeType,
            Metadata: {
              'x-checksum-sha256': checksum,
            },
          })
        );

        const publicUrl = `${this.publicDomain}/${objectKey}`;
        console.log(`[R2Storage] Sukses upload ke Cloudflare R2: ${publicUrl}`);
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

  /**
   * Delete object from storage (R2 primary, Supabase fallback)
   */
  public async deleteObject(bucket: string, objectKey: string): Promise<boolean> {
    if (this.hasR2Credentials() && this.s3Client) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: objectKey,
          })
        );
        return true;
      } catch (e) {
        console.warn('[R2StorageAdapter] Failed to delete from R2:', e);
      }
    }
    const targetBucket = bucket === CloudflareR2StorageAdapter.BUCKET_ASSETS ? 'frames' : 'galleries';
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(targetBucket).remove([objectKey]);
    return !error;
  }
}

export const r2Storage = new CloudflareR2StorageAdapter();
