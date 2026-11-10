'use client';

import React, {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';
import { Input } from './Input';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { Textarea } from './Textarea';
import { Button } from './Button';
import { Label } from './Label';
import { FieldError, FieldHelper } from './FieldMessage';

export { Modal, ModalConfirm, ConfirmModal, ModalHeader, ModalBody, ModalFooter } from './Modal';
export type { ModalProps, ModalConfirmProps, ConfirmModalProps } from './Modal';

export interface ModalFieldProps {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  children?: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export const ModalField = forwardRef<HTMLDivElement, ModalFieldProps>(
  ({ label, required, helperText, error, children, className, htmlFor, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-1.5', className)} {...props}>
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
        {children}
        {error && <FieldError message={error} />}
        {helperText && !error && <FieldHelper text={helperText} />}
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
  showPasswordToggle?: boolean;
}

export const ModalInput = forwardRef<HTMLInputElement, ModalInputProps>(
  (
    {
      label,
      required,
      helperText,
      error,
      icon,
      leftIcon,
      showPasswordToggle,
      className,
      id,
      ...props
    },
    ref
  ) => {
    return (
      <Input
        ref={ref}
        id={id}
        label={label}
        required={required}
        helperText={helperText}
        error={error}
        leftIcon={leftIcon}
        rightIcon={icon}
        showPasswordToggle={showPasswordToggle}
        className={className}
        {...props}
      />
    );
  }
);
ModalInput.displayName = 'ModalInput';

export interface ModalSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  searchable?: boolean;
}

export const ModalSelect = forwardRef<HTMLButtonElement, ModalSelectProps>(
  (
    {
      label,
      required,
      helperText,
      error,
      options,
      placeholder,
      className,
      id,
      value,
      defaultValue,
      disabled,
      name,
      onChange,
      onValueChange,
      searchable,
    },
    ref
  ) => {
    return (
      <Select
        ref={ref}
        id={id}
        name={name}
        label={label}
        required={required}
        helperText={helperText}
        error={error}
        options={options}
        placeholder={placeholder}
        value={value !== undefined ? String(value) : undefined}
        defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
        disabled={disabled}
        onChange={onChange}
        onValueChange={onValueChange}
        searchable={searchable}
        className={className}
      />
    );
  }
);
ModalSelect.displayName = 'ModalSelect';

export interface ModalCheckboxProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

export function ModalCheckbox({
  label,
  description,
  checked,
  onChange,
  id,
  className,
  error,
  disabled,
}: ModalCheckboxProps) {
  return (
    <Checkbox
      id={id}
      label={label}
      description={description}
      checked={checked}
      onChange={onChange}
      error={error}
      disabled={disabled}
      className={className}
    />
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
    return (
      <Textarea
        ref={ref}
        id={id}
        label={label}
        required={required}
        helperText={helperText}
        error={error}
        className={className}
        {...props}
      />
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
  return (
    <div className="flex gap-3 pt-3">
      <Button
        type="button"
        variant="secondary"
        fullWidth
        onClick={onCancel}
        disabled={submitting}
      >
        {cancelLabel}
      </Button>
      <Button
        type={submitType}
        variant={variant === 'danger' ? 'danger' : 'primary'}
        fullWidth
        onClick={submitType === 'button' ? onSubmit : undefined}
        loading={submitting}
        loadingText="Memproses..."
        disabled={submitDisabled}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
