'use client';

import React, {
  forwardRef,
  useId,
  useRef,
  useEffect,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';
import { Label } from './Label';
import { FieldError, FieldHelper } from './FieldMessage';
import type { BaseFieldProps } from './Input';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      required,
      helperText,
      error,
      autoResize = true,
      minRows = 3,
      maxRows = 8,
      className,
      containerClassName,
      id,
      disabled,
      onChange,
      value,
      'aria-describedby': externalDescribedBy,
      ...props
    },
    ref
  ) => {
    const reactId = useId();
    const textareaId =
      id ||
      (label ? `textarea-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : `textarea-${reactId}`);
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const internalRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const adjustHeight = () => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      el.style.height = 'auto';
      const lineHeight = 22;
      const minHeight = minRows * lineHeight + 20;
      const maxHeight = maxRows * lineHeight + 20;
      const nextHeight = Math.min(maxHeight, Math.max(minHeight, el.scrollHeight));
      el.style.height = `${nextHeight}px`;
    };

    useEffect(() => {
      adjustHeight();
    }, [value, autoResize]);

    const describedByParts = [
      externalDescribedBy,
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ].filter(Boolean);
    const ariaDescribedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    const textareaElement = (
      <textarea
        ref={setRefs}
        id={textareaId}
        rows={minRows}
        disabled={disabled}
        value={value}
        onChange={(e) => {
          adjustHeight();
          onChange?.(e);
        }}
        aria-invalid={!!error || undefined}
        aria-required={required || undefined}
        aria-describedby={ariaDescribedBy}
        className={cn(
          'w-full bg-surface-card border border-slate-300 rounded-xl text-sm sm:text-base text-text-primary placeholder-slate-400',
          'p-3.5 shadow-elev-1 transition-all duration-150 resize-y',
          'focus:bg-surface-card focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 focus:outline-none',
          'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:border-red-600 focus:ring-red-500/15',
          className
        )}
        {...props}
      />
    );

    if (!label && !error && !helperText) {
      return textareaElement;
    }

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <Label htmlFor={textareaId} required={required}>
            {label}
          </Label>
        )}
        {textareaElement}
        {error && <FieldError id={errorId} message={error} />}
        {helperText && !error && <FieldHelper id={helperId} text={helperText} />}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

