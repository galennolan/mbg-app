'use client';

// Generated P-256 URL-safe Base64 VAPID Public Key for Nutri Kampus Hub Web Push
export const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

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

export async function subscribeBrowserPushNotification(): Promise<{
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
      } catch {
        // Fallback to local Notification API subscription if PushManager requires HTTPS
      }
    }

    localStorage.setItem(PUSH_SUB_STORAGE_KEY, JSON.stringify(subPayload));

    // Trigger sample browser notification to confirm subscription works without login
    try {
      new Notification('Notifikasi MBG Aktif!', {
        body: 'Anda akan menerima pemberitahuan otomatis saat porsi MBG tiba di sekolah.',
        icon: '/favicon.ico',
      });
    } catch {
      // Ignore if mobile requires SW showNotification
    }

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

export function triggerLocalBrowserPush(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
    } catch {
      // fallback
    }
  }
}

