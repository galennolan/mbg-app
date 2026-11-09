'use client';

import { useEffect } from 'react';

export default function PwaRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // In development mode, actively unregister any service worker to avoid stale chunk caching & blank screens
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('PWA service worker registration notice:', error);
    });
  }, []);

  return null;
}
