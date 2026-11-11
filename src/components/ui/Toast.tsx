'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const variantStyles: Record<
  ToastVariant,
  {
    container: string;
    iconWrap: string;
    progressBar: string;
    icon: React.ReactNode;
  }
> = {
  success: {
    container: 'border-emerald-200 bg-surface-card text-text-primary',
    iconWrap: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    progressBar: 'bg-emerald-500',
    icon: <CheckCircle2 className="w-5 h-5" aria-hidden="true" />,
  },
  error: {
    container: 'border-red-200 bg-surface-card text-text-primary',
    iconWrap: 'bg-red-50 text-red-600 border-red-200',
    progressBar: 'bg-red-500',
    icon: <AlertCircle className="w-5 h-5" aria-hidden="true" />,
  },
  warning: {
    container: 'border-amber-200 bg-surface-card text-text-primary',
    iconWrap: 'bg-amber-50 text-amber-600 border-amber-200',
    progressBar: 'bg-amber-500',
    icon: <AlertTriangle className="w-5 h-5" aria-hidden="true" />,
  },
  info: {
    container: 'border-brand-blue-200 bg-surface-card text-text-primary',
    iconWrap: 'bg-brand-blue-50 text-brand-blue border-brand-blue-100',
    progressBar: 'bg-brand-blue',
    icon: <Info className="w-5 h-5" aria-hidden="true" />,
  },
};

export function ToastCard({ toast, onDismiss }: ToastCardProps) {
  const [paused, setPaused] = useState(false);
  const variant = toast.variant || 'info';
  const duration = toast.duration ?? 4000;
  const style = variantStyles[variant];

  useEffect(() => {
    if (duration <= 0 || paused) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, duration, paused, onDismiss]);

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      className={cn(
        'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border p-3.5 shadow-elev-4 animate-toast-in transition-all',
        style.container
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 animate-pop-in',
            style.iconWrap
          )}
        >
          {style.icon}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          {toast.title && (
            <p className="text-xs font-black text-brand-navy tracking-tight leading-snug">
              {toast.title}
            </p>
          )}
          <p className="text-xs text-slate-700 font-medium leading-relaxed mt-0.5">
            {toast.message}
          </p>

          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className="mt-2 inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-brand-navy text-[11px] font-bold transition micro-tap"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="min-h-[36px] min-w-[36px] -mr-1 -mt-1 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition micro-tap shrink-0"
          aria-label="Tutup notifikasi"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {duration > 0 && (
        <div className="absolute bottom-0 inset-x-0 h-1 bg-slate-100 overflow-hidden">
          <div
            className={cn('h-full w-full animate-toast-progress', style.progressBar)}
            style={{
              animationDuration: `${duration}ms`,
              animationPlayState: paused ? 'paused' : 'running',
            }}
          />
        </div>
      )}
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifikasi sistem"
      className="fixed top-4 right-4 left-4 sm:left-auto z-toast flex flex-col items-end gap-2.5 pointer-events-none"
    >
      {toasts.slice(0, 3).map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

