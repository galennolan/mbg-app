'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ToastContainer, type ToastItem, type ToastVariant } from './Toast';
import {
  SweetAlertModal,
  type SweetAlertOptions,
  type SweetAlertResult,
} from './SweetAlert';

export interface NotifyContextValue {
  toast: (options: Omit<ToastItem, 'id'> | string, variant?: ToastVariant) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  fire: (options: SweetAlertOptions) => Promise<SweetAlertResult>;
  confirm: (options: SweetAlertOptions) => Promise<boolean>;
}

const NotifyContext = createContext<NotifyContextValue | null>(null);

// Imperative bridge so non-hook callers or quick handlers can also invoke notifications
let imperativeNotify: NotifyContextValue | null = null;

export const swal = {
  fire: (options: SweetAlertOptions): Promise<SweetAlertResult> => {
    if (imperativeNotify) {
      return imperativeNotify.fire(options);
    }
    return Promise.resolve({ isConfirmed: true, isDismissed: false });
  },
  confirm: (options: SweetAlertOptions): Promise<boolean> => {
    if (imperativeNotify) {
      return imperativeNotify.confirm(options);
    }
    return Promise.resolve(true);
  },
  toast: (message: string, variant: ToastVariant = 'info', title?: string) => {
    imperativeNotify?.toast({ message, variant, title });
  },
};

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [swalOptions, setSwalOptions] = useState<SweetAlertOptions | null>(null);
  const swalResolverRef = useRef<((res: SweetAlertResult) => void) | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback(
    (options: Omit<ToastItem, 'id'> | string, variant: ToastVariant = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem =
        typeof options === 'string'
          ? { id, message: options, variant }
          : { id, variant: options.variant || variant, ...options };

      setToasts((prev) => [item, ...prev.slice(0, 4)]);
    },
    []
  );

  const fire = useCallback((options: SweetAlertOptions): Promise<SweetAlertResult> => {
    return new Promise<SweetAlertResult>((resolve) => {
      swalResolverRef.current = resolve;
      setSwalOptions(options);
    });
  }, []);

  const confirm = useCallback(
    async (options: SweetAlertOptions): Promise<boolean> => {
      const res = await fire({
        showCancelButton: true,
        confirmText: options.confirmText || 'Ya, Lanjutkan',
        cancelText: options.cancelText || 'Batal',
        icon: options.icon || 'question',
        ...options,
      });
      return res.isConfirmed;
    },
    [fire]
  );

  const handleResolveSwal = useCallback((result: SweetAlertResult) => {
    setSwalOptions(null);
    if (swalResolverRef.current) {
      swalResolverRef.current(result);
      swalResolverRef.current = null;
    }
  }, []);

  const contextValue: NotifyContextValue = {
    toast: addToast,
    success: (message, title) => addToast({ message, title, variant: 'success' }),
    error: (message, title) => addToast({ message, title, variant: 'error', duration: 5000 }),
    warning: (message, title) => addToast({ message, title, variant: 'warning', duration: 4500 }),
    info: (message, title) => addToast({ message, title, variant: 'info' }),
    fire,
    confirm,
  };

  useEffect(() => {
    imperativeNotify = contextValue;
    return () => {
      imperativeNotify = null;
    };
  });

  return (
    <NotifyContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <SweetAlertModal options={swalOptions} onResolve={handleResolveSwal} />
    </NotifyContext.Provider>
  );
}

export function useNotify(): NotifyContextValue {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      fire: async () => ({ isConfirmed: true, isDismissed: false }),
      confirm: async () => true,
    };
  }
  return ctx;
}

