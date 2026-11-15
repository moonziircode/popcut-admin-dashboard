import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { initialFrames } from '@/lib/data/mock-data';

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Query frames with category and current version
    const { data: dbFrames, error } = await supabase
      .from('frames')
      .select(`
        id,
        internal_code,
        name,
        category_id,
        dimensions,
        aspect_ratio,
        current_version_id,
        is_archived,
        created_at,
        updated_at,
        frame_categories (
          id,
          name,
          slug
        ),
        frame_versions (
          id,
          version_number,
          asset_path,
          thumbnail_path,
          checksum_sha256,
          file_size_bytes,
          dimensions,
          status,
          published_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error || !dbFrames || dbFrames.length === 0) {
      // Fallback to initial mock frames if DB empty or error
      return NextResponse.json({
        success: true,
        frames: initialFrames,
        source: 'mock',
      });
    }

    // Map DB frames with public asset URLs
    const formattedFrames = dbFrames.map((f: any) => {
      const currentVersion = f.frame_versions?.find((v: any) => v.id === f.current_version_id) || f.frame_versions?.[0];
      let assetUrl = null;
      if (currentVersion?.asset_path) {
        const { data: publicUrlData } = supabase.storage.from('frames').getPublicUrl(currentVersion.asset_path);
        assetUrl = publicUrlData?.publicUrl || null;
      }

      return {
        id: f.id,
        internal_code: f.internal_code,
        name: f.name,
        category_id: f.category_id,
        category_name: f.frame_categories?.name || 'Classic',
        dimensions: f.dimensions,
        aspect_ratio: f.aspect_ratio,
        current_version_id: f.current_version_id,
        current_version_number: currentVersion?.version_number || 1,
        status: currentVersion?.status || 'DRAFT',
        asset_url: assetUrl,
        is_archived: f.is_archived,
        created_at: f.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      frames: formattedFrames,
      source: 'database',
    });
  } catch (err: any) {
    console.error('Error fetching frames:', err);
    return NextResponse.json({
      success: true,
      frames: initialFrames,
      source: 'fallback',
    });
  }
}
