import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';
    const p256dh = body?.keys?.p256dh || null;
    const auth = body?.keys?.auth || null;
    const schoolId = typeof body?.schoolId === 'string' && body.schoolId ? body.schoolId : null;
    const role = typeof body?.role === 'string' && body.role ? body.role : 'guest';
    const userAgent = req.headers.get('user-agent') || null;

    if (!endpoint) {
      return NextResponse.json(
        { success: false, message: 'Endpoint subscription tidak valid.' },
        { status: 400 }
      );
    }

    // Local/fallback endpoints do not need Push Service delivery, but we can acknowledge gracefully
    if (endpoint.startsWith('browser-local-push://')) {
      return NextResponse.json({
        success: true,
        persisted: 'local-only',
        message: 'Subscription lokal dicatat.',
      });
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint,
        p256dh,
        auth,
        school_id: schoolId,
        role,
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      console.warn('Supabase push_subscriptions upsert notice:', error.message);
      return NextResponse.json({
        success: true,
        persisted: 'local-only',
        warning: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      persisted: 'supabase',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal menyimpan subscription.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const endpoint = typeof body?.endpoint === 'string' ? body.endpoint.trim() : '';

    if (!endpoint) {
      return NextResponse.json(
        { success: false, message: 'Endpoint wajib diisi.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.warn('Supabase push_subscriptions delete notice:', error.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal menghapus subscription.' },
      { status: 500 }
    );
  }
}

