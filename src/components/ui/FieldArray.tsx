'use client';

import React, { type ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from './Label';
import { Button } from './Button';
import { FieldError, FieldHelper } from './FieldMessage';

export interface FieldArrayProps<T> {
  label: string;
  items: T[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  renderItem: (item: T, index: number) => ReactNode;
  addLabel?: string;
  maxItems?: number;
  minItems?: number;
  helperText?: string;
  error?: string;
  className?: string;
}

export function FieldArray<T>({
  label,
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel = 'Tambah Baris',
  maxItems = 10,
  minItems = 0,
  helperText,
  error,
  className,
}: FieldArrayProps<T>) {
  const canAdd = items.length < maxItems;
  const canRemove = items.length > minItems;

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label as="span">{label}</Label>
        {canAdd && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAdd}
            leftIcon={<Plus className="w-3.5 h-3.5 text-brand-blue" />}
          >
            {addLabel}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 animate-slide-up bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/80"
          >
            <div className="flex-1 min-w-0">{renderItem(item, idx)}</div>
            {canRemove && (
              <button
                type="button"
                onClick={() => onRemove(idx)}
                aria-label={`Hapus item ke-${idx + 1}`}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition micro-tap shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {error && <FieldError message={error} />}
      {helperText && !error && <FieldHelper text={helperText} />}
    </div>
  );
}

