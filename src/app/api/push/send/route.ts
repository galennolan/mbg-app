import { NextRequest, NextResponse } from 'next/server';
import * as webpush from 'web-push';
import { supabase } from '@/lib/supabase/client';

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@mbg-tracker.id';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const title = body?.title || 'MBG Tiba di Sekolah!';
    const messageBody =
      body?.body ||
      'Distribusi Makan Bergizi Gratis telah dibuka oleh Guru Piket. Silakan scan QR atau masukkan PIN.';
    const url = body?.url || '/';
    const schoolId = typeof body?.schoolId === 'string' && body.schoolId ? body.schoolId : null;

    if (!VAPID_PRIVATE_KEY) {
      return NextResponse.json({
        success: false,
        sent: 0,
        message: 'VAPID_PRIVATE_KEY belum dikonfigurasi di server.',
      });
    }

    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

    let query = supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth, school_id');

    if (schoolId) {
      query = query.or(`school_id.eq.${schoolId},school_id.is.null`);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.warn('Query push_subscriptions notice:', error.message);
      return NextResponse.json({
        success: false,
        sent: 0,
        message: error.message,
      });
    }

    const validSubs = (subscriptions || []).filter(
      (sub) => sub.endpoint && sub.p256dh && sub.auth
    );

    if (validSubs.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        failed: 0,
        total: 0,
        message: 'Belum ada perangkat terdaftar untuk Web Push.',
      });
    }

    const payload = JSON.stringify({
      title,
      body: messageBody,
      url,
    });

    const expiredEndpoints: string[] = [];
    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      validSubs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh!,
                auth: sub.auth!,
              },
            },
            payload
          );
          sent += 1;
        } catch (pushErr: any) {
          failed += 1;
          const statusCode = pushErr?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            expiredEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: validSubs.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Gagal mengirim Web Push.' },
      { status: 500 }
    );
  }
}

