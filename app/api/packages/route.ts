import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data: packages, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_archived', false)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching packages from Supabase:', error);
      return NextResponse.json({ success: true, packages: [] });
    }

    return NextResponse.json({
      success: true,
      packages: packages || [],
    });
  } catch (err: any) {
    console.error('Error in packages GET:', err);
    return NextResponse.json({ success: true, packages: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = createAdminClient();

    const internalCode = body.internal_code || `PKG-${Date.now().toString().slice(-4)}`;
    const newPackage = {
      internal_code: internalCode,
      name: body.name,
      description: body.description || '',
      price: Number(body.price) || 35000,
      photo_count: Number(body.photo_count) || 4,
      included_strips: Number(body.included_strips) || 2,
      include_live_photo: Boolean(body.include_live_photo),
      include_digital_files: Boolean(body.include_digital_files),
      display_order: Number(body.display_order) || 1,
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
      is_archived: false,
    };

    const { data, error } = await supabase
      .from('packages')
      .insert(newPackage)
      .select()
      .single();

    if (error) {
      console.error('Error inserting package into Supabase:', error);
      return NextResponse.json(
        { success: false, message: error.message || 'Gagal menyimpan paket.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      package: data,
    });
  } catch (err: any) {
    console.error('Error in packages POST:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Package ID wajib disertakan.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('packages')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, package: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Package ID wajib disertakan.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err?.message }, { status: 500 });
  }
}
