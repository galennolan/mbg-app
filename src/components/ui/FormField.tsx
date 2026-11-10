'use client';

import React, {
  cloneElement,
  isValidElement,
  useId,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { Label } from './Label';
import { FieldError, FieldHelper } from './FieldMessage';

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
  required?: boolean;
  helperText?: string;
  error?: string;
  badge?: ReactNode;
  children: ReactNode;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  helperText,
  error,
  badge,
  children,
  className,
  ...props
}: FormFieldProps) {
  const reactId = useId();
  const fieldId =
    htmlFor || `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${reactId}`;
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;

  const describedBy = [
    error ? errorId : null,
    helperText && !error ? helperId : null,
  ]
    .filter(Boolean)
    .join(' ') || undefined;

  const enhancedChildren = isValidElement(children)
    ? cloneElement(children as ReactElement<any>, {
        id: (children.props as any).id || fieldId,
        'aria-describedby': (children.props as any)['aria-describedby'] || describedBy,
        'aria-invalid': (children.props as any)['aria-invalid'] ?? (!!error || undefined),
        required: (children.props as any).required ?? required,
        error: (children.props as any).error ?? error,
      })
    : children;

  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      <Label htmlFor={fieldId} required={required} badge={badge}>
        {label}
      </Label>
      {enhancedChildren}
      {error && <FieldError id={errorId} message={error} />}
      {helperText && !error && <FieldHelper id={helperId} text={helperText} />}
    </div>
  );
}

