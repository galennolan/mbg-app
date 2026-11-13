'use client';

// Generated P-256 URL-safe Base64 VAPID Public Key for Nutri Kampus Hub Web Push
export const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BG6R7rp7tvLEqyuUwainZh2d09LLHbzeAbM_ZedotcsnOdwFgKtTovkBjUxjd8sdCGgTnPK7PAVOB0v6mtQCfRE';

const PUSH_SUB_STORAGE_KEY = 'mbg_browser_push_subscription';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = typeof window !== 'undefined' ? window.atob(base64) : '';
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export interface BrowserPushState {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  endpoint?: string;
}

export function getBrowserPushState(): BrowserPushState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      supported: false,
      permission: 'unsupported',
      subscribed: false,
    };
  }

  const savedSub = localStorage.getItem(PUSH_SUB_STORAGE_KEY);
  let endpoint: string | undefined;
  if (savedSub) {
    try {
      endpoint = JSON.parse(savedSub)?.endpoint;
    } catch {
      // ignore
    }
  }

  return {
    supported: true,
    permission: Notification.permission,
    subscribed: !!savedSub && Notification.permission === 'granted',
    endpoint,
  };
}

async function showBrowserNotification(title: string, body: string, url = '/') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: { url },
        });
        return;
      }
    } catch {
      // Fallback to window Notification API
    }
  }

  try {
    const notif = new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
    notif.onclick = () => {
      window.focus();
      if (url && window.location.pathname !== url) {
        window.location.href = url;
      }
    };
  } catch {
    // Ignore if blocked by browser policy
  }
}

export async function subscribeBrowserPushNotification(options?: {
  schoolId?: string;
  role?: string;
}): Promise<{
  success: boolean;
  message: string;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      success: false,
      message: 'Browser perangkat ini belum mendukung fitur Web Push Notification.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        message: 'Izin notifikasi ditolak pada pengaturan browser.',
      };
    }

    let subPayload: Record<string, unknown> = {
      endpoint: `browser-local-push://${window.location.host}/${Date.now()}`,
      subscribed_at: new Date().toISOString(),
      mode: 'guest-ready-web-push',
    };

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const existingReg = await navigator.serviceWorker.getRegistration();
        if (existingReg) {
          const reg = await navigator.serviceWorker.ready;
          const existingSub = await reg.pushManager.getSubscription();
          if (existingSub) {
            subPayload = existingSub.toJSON() as Record<string, unknown>;
          } else {
            const applicationServerKey = urlBase64ToUint8Array(DEFAULT_VAPID_PUBLIC_KEY);
            const newSub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey as unknown as BufferSource,
            });
            subPayload = newSub.toJSON() as Record<string, unknown>;
          }
        }
      } catch {
        // Fallback to local Notification API subscription if PushManager requires HTTPS or SW is disabled in dev
      }
    }

    localStorage.setItem(PUSH_SUB_STORAGE_KEY, JSON.stringify(subPayload));

    // Persist subscription to backend API (non-blocking if offline)
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subPayload,
          schoolId: options?.schoolId,
          role: options?.role || 'guest',
        }),
      });
    } catch {
      // Offline-first fallback: keep localStorage subscription
    }

    await showBrowserNotification(
      'Notifikasi MBG Aktif!',
      'Anda akan menerima pemberitahuan otomatis saat porsi MBG tiba di sekolah.'
    );

    return {
      success: true,
      message: 'Langganan Web Push berhasil diaktifkan (tanpa perlu login).',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal mengaktifkan langganan notifikasi.',
    };
  }
}

export function triggerLocalBrowserPush(title: string, body: string, url = '/') {
  void showBrowserNotification(title, body, url);
}

export async function sendWebPushBroadcast(params: {
  title: string;
  body: string;
  url?: string;
  schoolId?: string;
}): Promise<void> {
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch {
    // Non-blocking broadcast
  }
}
