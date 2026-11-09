'use client';

import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export { Modal, ConfirmModal } from './Modal';
export type { ModalProps, ConfirmModalProps } from './Modal';

export interface ModalFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children?: React.ReactNode;
  className?: string;
}

export const ModalField = forwardRef<HTMLDivElement, ModalFieldProps>(
  ({ label, required, helperText, error, children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-1.5', className)} {...props}>
        <label className="block font-semibold text-slate-800 text-sm">
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
        {children}
        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
        {helperText && !error && <p className="text-xs text-slate-500">{helperText}</p>}
      </div>
    );
  }
);
ModalField.displayName = 'ModalField';

export interface ModalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
}

export const ModalInput = forwardRef<HTMLInputElement, ModalInputProps>(
  ({ label, required, helperText, error, icon, leftIcon, className, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <ModalField label={label} required={required} helperText={helperText} error={error}>
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full bg-white border border-slate-300 rounded-2xl text-base text-slate-900 placeholder-slate-400',
              'focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue',
              'transition-all duration-200',
              leftIcon ? 'pl-11 pr-4 py-3.5' : 'p-4',
              error && 'border-red-400 focus:ring-red-200 focus:border-red-400',
              className
            )}
            {...props}
          />
          {icon && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              {icon}
            </div>
          )}
        </div>
      </ModalField>
    );
  }
);
ModalInput.displayName = 'ModalInput';

export interface ModalSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const ModalSelect = forwardRef<HTMLSelectElement, ModalSelectProps>(
  ({ label, required, helperText, error, options, placeholder, className, id, ...props }, ref) => {
    const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <ModalField label={label} required={required} helperText={helperText} error={error}>
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full bg-white border border-slate-300 rounded-2xl text-base text-slate-900 py-3.5 px-4 appearance-none',
            'focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue',
            'transition-all duration-200 bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%2394a3b8%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpolyline points=%276 9 12 15 18 9%27%3E%3C/polyline%3E%3C/svg%3E")] bg-right-4 bg-no-repeat pr-10',
            error && 'border-red-400 focus:ring-red-200 focus:border-red-400',
            className
          )}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </ModalField>
    );
  }
);
ModalSelect.displayName = 'ModalSelect';

export interface ModalCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
  error?: string;
}

export function ModalCheckbox({ label, checked, onChange, id, className, error }: ModalCheckboxProps) {
  const checkboxId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          'w-5 h-5 rounded border-2 border-slate-300 text-brand-blue',
          'focus:outline-none focus:ring-4 focus:ring-brand-blue/20 focus:ring-offset-2',
          'transition-all duration-200 cursor-pointer',
          'checked:border-brand-blue checked:bg-brand-blue',
          error && 'border-red-400'
        )}
        aria-describedby={error ? `${checkboxId}-error` : undefined}
      />
      <label htmlFor={checkboxId} className="font-medium text-slate-800 text-base cursor-pointer">
        {label}
      </label>
      {error && <p id={`${checkboxId}-error`} className="text-xs text-red-600 ml-8" role="alert">{error}</p>}
    </div>
  );
}

export interface ModalTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
}

export const ModalTextarea = forwardRef<HTMLTextAreaElement, ModalTextareaProps>(
  ({ label, required, helperText, error, className, id, ...props }, ref) => {
    const textareaId = id || label.toLowerCase().replace(/\s+/g, '-');
    return (
      <ModalField label={label} required={required} helperText={helperText} error={error}>
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full bg-white border border-slate-300 rounded-2xl text-base text-slate-900 placeholder-slate-400 p-4',
            'focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue',
            'transition-all duration-200 resize-y min-h-[100px]',
            error && 'border-red-400 focus:ring-red-200 focus:border-red-400',
            className
          )}
          {...props}
        />
      </ModalField>
    );
  }
);
ModalTextarea.displayName = 'ModalTextarea';

export interface ModalActionsProps {
  onCancel: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  submitDisabled?: boolean;
  variant?: 'primary' | 'danger';
  submitType?: 'submit' | 'button';
}

export function ModalActions({
  onCancel,
  onSubmit,
  submitLabel = 'Simpan',
  cancelLabel = 'Batal',
  submitting = false,
  submitDisabled = false,
  variant = 'primary',
  submitType = 'submit',
}: ModalActionsProps) {
  const submitClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-brand-blue hover:bg-brand-blue-700';

  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      <button
        type={submitType}
        onClick={submitType === 'button' ? onSubmit : undefined}
        disabled={submitting || submitDisabled}
        className={cn(
          'flex-1 py-3.5 text-white font-bold rounded-2xl transition shadow-md disabled:opacity-50',
          submitClass
        )}
      >
        {submitting ? 'Memproses...' : submitLabel}
      </button>
    </div>
  );
}