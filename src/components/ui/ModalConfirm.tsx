'use client';

import React from 'react';
import { AlertTriangle, HelpCircle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ModalConfirmProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  loading?: boolean;
}

export type ConfirmModalProps = ModalConfirmProps;

export function ModalConfirm({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger',
  loading = false,
}: ModalConfirmProps) {
  const handleCancel = () => {
    onCancel?.();
    onClose?.();
  };

  const iconConfig = {
    danger: {
      bg: 'bg-red-50 border-red-200 text-brand-red',
      icon: <Trash2 className="w-6 h-6" aria-hidden="true" />,
      btnVariant: 'danger' as const,
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-600',
      icon: <AlertTriangle className="w-6 h-6" aria-hidden="true" />,
      btnVariant: 'warning' as const,
    },
    primary: {
      bg: 'bg-brand-blue-50 border-brand-blue-100 text-brand-blue',
      icon: <HelpCircle className="w-6 h-6" aria-hidden="true" />,
      btnVariant: 'primary' as const,
    },
  }[variant];

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={title} size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 animate-pop-in ${iconConfig.bg}`}
          >
            {iconConfig.icon}
          </div>
          <p className="text-sm text-slate-700 leading-relaxed pt-1">{message}</p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={handleCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={iconConfig.btnVariant}
            fullWidth
            onClick={onConfirm}
            loading={loading}
            loadingText="Memproses..."
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export const ConfirmModal = ModalConfirm;

