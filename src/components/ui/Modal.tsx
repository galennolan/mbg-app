'use client';

import React, { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  hideCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  initialFocusSelector?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw] sm:max-w-4xl',
};

const FOCUSABLE_SELECTOR =
  'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export function ModalHeader({
  title,
  description,
  titleId,
  descriptionId,
  onClose,
  hideCloseButton,
}: {
  title: string;
  description?: string;
  titleId?: string;
  descriptionId?: string;
  onClose?: () => void;
  hideCloseButton?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
      <div className="min-w-0">
        <h3 id={titleId} className="font-black text-base sm:text-lg text-brand-navy tracking-tight">
          {title}
        </h3>
        {description && (
          <p id={descriptionId} className="text-xs text-slate-600 mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {!hideCloseButton && onClose && (
        <button
          type="button"
          onClick={onClose}
          className="min-h-[44px] min-w-[44px] -mr-1 -mt-1 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition micro-tap shrink-0"
          aria-label="Tutup dialog"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function ModalBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('p-5', className)}>{children}</div>;
}

export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/70 rounded-b-2xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  hideCloseButton = false,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  initialFocusSelector,
}: ModalProps) {
  const reactId = useId();
  const titleId = `modal-title-${reactId}`;
  const descriptionId = `modal-desc-${reactId}`;

  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Focus restoration, initial focus, and scroll lock
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement | null;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      const focusTimer = setTimeout(() => {
        if (!modalRef.current) return;
        const target =
          (initialFocusSelector
            ? modalRef.current.querySelector<HTMLElement>(initialFocusSelector)
            : null) || modalRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
        target?.focus();
      }, 30);

      return () => clearTimeout(focusTimer);
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
        previousActiveElement.current.focus();
      }
    }
  }, [isOpen, initialFocusSelector]);

  // Keyboard Focus Trap (Tab / Shift+Tab) & Escape Key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableNodes = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((el) => el.offsetParent !== null);

        if (focusableNodes.length === 0) {
          e.preventDefault();
          return;
        }

        const firstEl = focusableNodes[0];
        const lastEl = focusableNodes[focusableNodes.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl || !modalRef.current.contains(document.activeElement)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  // Ensure body scroll restored on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-2.5 sm:p-4 bg-slate-950/65 backdrop-blur-sm animate-fade-in"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          'w-full bg-white rounded-2xl sm:rounded-3xl shadow-elev-5 border border-slate-200 animate-sheet-up sm:animate-slide-up max-h-[90vh] overflow-y-auto',
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalHeader
          title={title}
          description={description}
          titleId={titleId}
          descriptionId={descriptionId}
          onClose={onClose}
          hideCloseButton={hideCloseButton}
        />
        <ModalBody>{children}</ModalBody>
        {footer && <ModalFooter>{footer}</ModalFooter>}
      </div>
    </div>,
    document.body
  );
}

export { ModalConfirm, ConfirmModal } from './ModalConfirm';
export type { ModalConfirmProps, ConfirmModalProps } from './ModalConfirm';
