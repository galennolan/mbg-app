'use client';

import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export type SweetAlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question';

export interface SweetAlertDetailItem {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface SweetAlertOptions {
  title: string;
  text?: string;
  icon?: SweetAlertIcon;
  badgeText?: string;
  details?: SweetAlertDetailItem[];
  confirmText?: string;
  cancelText?: string;
  showCancelButton?: boolean;
  confirmVariant?: 'primary' | 'danger' | 'success' | 'warning' | 'navy';
  variant?: 'primary' | 'danger' | 'success' | 'warning' | 'navy';
  timer?: number;
}

export interface SweetAlertResult {
  isConfirmed: boolean;
  isDismissed: boolean;
}

function AnimatedSvgIcon({ icon }: { icon: SweetAlertIcon }) {
  if (icon === 'success') {
    return (
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center animate-pop-in">
        <svg className="w-9 h-9 text-emerald-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M5 13l4 4L19 7"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-svg-draw"
          />
        </svg>
      </div>
    );
  }

  if (icon === 'error') {
    return (
      <div className="w-16 h-16 mx-auto rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center animate-pop-in">
        <svg className="w-9 h-9 text-red-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-svg-draw"
          />
        </svg>
      </div>
    );
  }

  if (icon === 'warning') {
    return (
      <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center animate-pop-in">
        <svg className="w-9 h-9 text-amber-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 8v5m0 3.5h.01"
            stroke="currentColor"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-svg-draw"
          />
        </svg>
      </div>
    );
  }

  if (icon === 'question') {
    return (
      <div className="w-16 h-16 mx-auto rounded-full bg-brand-blue-50 border-2 border-brand-blue-200 flex items-center justify-center animate-pop-in">
        <svg className="w-9 h-9 text-brand-blue" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-svg-draw"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-16 h-16 mx-auto rounded-full bg-brand-blue-50 border-2 border-brand-blue-200 flex items-center justify-center animate-pop-in">
      <svg className="w-9 h-9 text-brand-blue" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 16v-4m0-4h.01"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-svg-draw"
        />
      </svg>
    </div>
  );
}

interface SweetAlertModalProps {
  options: SweetAlertOptions | null;
  onResolve: (result: SweetAlertResult) => void;
}

export function SweetAlertModal({ options, onResolve }: SweetAlertModalProps) {
  const reactId = useId();
  const titleId = `swal-title-${reactId}`;
  const descId = `swal-desc-${reactId}`;
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!options) return;
    const focusTimer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 30);

    let autoTimer: NodeJS.Timeout | undefined;
    if (options.timer && options.timer > 0) {
      autoTimer = setTimeout(() => {
        onResolve({ isConfirmed: true, isDismissed: false });
      }, options.timer);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onResolve({ isConfirmed: false, isDismissed: true });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      if (autoTimer) clearTimeout(autoTimer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [options, onResolve]);

  if (!options || typeof document === 'undefined') return null;

  const icon = options.icon || 'info';
  const defaultConfirmVariant =
    options.confirmVariant ||
    (icon === 'error'
      ? 'danger'
      : icon === 'success'
      ? 'success'
      : icon === 'warning'
      ? 'warning'
      : 'primary');

  return createPortal(
    <div
      className="fixed inset-0 z-sweetalert flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in"
      onClick={() => onResolve({ isConfirmed: false, isDismissed: true })}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={options.text ? descId : undefined}
    >
      <div
        className="w-full max-w-sm bg-surface-card rounded-3xl border border-slate-200 shadow-elev-5 p-6 text-center space-y-4 animate-pop-in"
        onClick={(e) => e.stopPropagation()}
      >
        <AnimatedSvgIcon icon={icon} />

        {options.badgeText && (
          <div className="inline-block px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-brand-navy">
            {options.badgeText}
          </div>
        )}

        <div className="space-y-1.5">
          <h3 id={titleId} className="text-lg font-black text-brand-navy tracking-tight">
            {options.title}
          </h3>
          {options.text && (
            <p id={descId} className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {options.text}
            </p>
          )}
        </div>

        {options.details && options.details.length > 0 && (
          <div className="rounded-2xl bg-surface-canvas border border-slate-200/80 p-3.5 text-left space-y-2">
            {options.details.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                <span className="text-text-secondary font-medium">{item.label}</span>
                <span
                  className={cn(
                    'font-bold font-mono',
                    item.highlight ? 'text-emerald-700' : 'text-text-primary'
                  )}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className={cn('flex gap-2.5 pt-2', !options.showCancelButton && 'justify-center')}>
          {options.showCancelButton && (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => onResolve({ isConfirmed: false, isDismissed: true })}
            >
              {options.cancelText || 'Batal'}
            </Button>
          )}
          <Button
            ref={confirmBtnRef}
            type="button"
            variant={defaultConfirmVariant}
            fullWidth
            onClick={() => onResolve({ isConfirmed: true, isDismissed: false })}
          >
            {options.confirmText || 'Mengerti'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

