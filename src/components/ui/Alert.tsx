'use client';

import React, { type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  variant?: AlertVariant;
  tone?: AlertVariant;
  type?: AlertVariant;
  title?: string;
  message?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const variantConfig: Record<
  AlertVariant,
  {
    wrapper: string;
    iconColor: string;
    defaultIcon: ReactNode;
  }
> = {
  success: {
    wrapper: 'border-emerald-200 bg-emerald-50/90 text-emerald-950',
    iconColor: 'text-emerald-600',
    defaultIcon: <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />,
  },
  error: {
    wrapper: 'border-red-200 bg-red-50/90 text-red-950',
    iconColor: 'text-red-600',
    defaultIcon: <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />,
  },
  warning: {
    wrapper: 'border-amber-200 bg-amber-50/90 text-amber-950',
    iconColor: 'text-amber-600',
    defaultIcon: <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />,
  },
  info: {
    wrapper: 'border-brand-blue-200 bg-brand-blue-50/90 text-brand-navy',
    iconColor: 'text-brand-blue',
    defaultIcon: <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />,
  },
};

export function Alert({
  variant,
  tone,
  type,
  title,
  message,
  children,
  icon,
  onDismiss,
  className,
}: AlertProps) {
  const activeVariant: AlertVariant = type || variant || tone || 'info';
  const content = children || message;

  if (!content && !title) return null;

  const cfg = variantConfig[activeVariant];
  const isAssertive = activeVariant === 'error' || activeVariant === 'warning';

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      className={cn(
        'flex items-start justify-between gap-3 rounded-2xl border p-4 text-xs sm:text-sm shadow-elev-1 animate-slide-up',
        cfg.wrapper,
        className
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span className={cfg.iconColor}>{icon || cfg.defaultIcon}</span>
        <div className="min-w-0">
          {title && <p className="font-black leading-snug mb-0.5">{title}</p>}
          {content && <div className="font-medium leading-relaxed">{content}</div>}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-[36px] min-w-[36px] -mr-1 -my-1 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-black/5 rounded-xl transition micro-tap shrink-0"
          aria-label="Tutup pesan"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

