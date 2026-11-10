'use client';

import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useId,
  type ReactNode,
} from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from './Label';
import { FieldError, FieldHelper } from './FieldMessage';
import type { BaseFieldProps } from './Input';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
  description?: string;
}

export interface SelectProps extends BaseFieldProps {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  name?: string;
  className?: string;
  containerClassName?: string;
  leftIcon?: ReactNode;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      required,
      helperText,
      error,
      options,
      value,
      defaultValue = '',
      onChange,
      onValueChange,
      placeholder = 'Pilih opsi...',
      searchable = false,
      clearable = false,
      disabled = false,
      id,
      name,
      className,
      containerClassName,
      leftIcon,
      'aria-describedby': externalDescribedBy,
    },
    ref
  ) => {
    const reactId = useId();
    const selectId =
      id ||
      (label ? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : `select-${reactId}`);
    const listboxId = `${selectId}-listbox`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const [internalValue, setInternalValue] = useState(defaultValue);
    const currentValue = value !== undefined ? value : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState<number>(-1);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === currentValue);

    const filteredOptions =
      searchable && searchQuery.trim()
        ? options.filter(
            (opt) =>
              opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
              opt.value.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : options;

    const emitChange = (nextVal: string) => {
      if (value === undefined) {
        setInternalValue(nextVal);
      }
      onValueChange?.(nextVal);
      onChange?.({ target: { value: nextVal, name } });
    };

    const handleSelectOption = (opt: SelectOption) => {
      if (opt.disabled) return;
      emitChange(opt.value);
      setIsOpen(false);
      setSearchQuery('');
    };

    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
          setIsOpen(false);
          setSearchQuery('');
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
      if (isOpen) {
        const selectedIdx = filteredOptions.findIndex((o) => o.value === currentValue);
        setActiveIndex(selectedIdx >= 0 ? selectedIdx : 0);
        if (searchable) {
          setTimeout(() => searchInputRef.current?.focus(), 20);
        }
      }
    }, [isOpen]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) =>
          filteredOptions.length > 0 ? (prev + 1) % filteredOptions.length : -1
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) =>
          filteredOptions.length > 0
            ? (prev - 1 + filteredOptions.length) % filteredOptions.length
            : -1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = filteredOptions[activeIndex];
        if (target && !target.disabled) {
          handleSelectOption(target);
        }
      }
    };

    const describedByParts = [
      externalDescribedBy,
      error ? errorId : null,
      helperText && !error ? helperId : null,
    ].filter(Boolean);
    const ariaDescribedBy = describedByParts.length > 0 ? describedByParts.join(' ') : undefined;

    const comboboxControl = (
      <div ref={wrapperRef} className="relative" onKeyDown={handleKeyDown}>
        {name && <input type="hidden" name={name} value={currentValue} />}
        <button
          ref={ref}
          id={selectId}
          type="button"
          role="combobox"
          disabled={disabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-invalid={!!error || undefined}
          aria-required={required || undefined}
          aria-describedby={ariaDescribedBy}
          aria-label={label || placeholder}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={cn(
            'w-full min-h-[44px] bg-white border border-slate-300 rounded-xl text-left text-sm sm:text-base text-slate-900',
            'px-3.5 py-2.5 shadow-elev-1 transition-all duration-150 flex items-center justify-between gap-2 micro-tap',
            'focus:bg-white focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 focus:outline-none',
            'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
            isOpen && 'border-brand-blue ring-4 ring-brand-blue/15',
            error && 'border-red-500 focus:border-red-600 focus:ring-red-500/15',
            className
          )}
        >
          <span className="flex items-center gap-2 min-w-0 flex-1">
            {leftIcon && (
              <span className="text-slate-400 shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            <span
              className={cn(
                'truncate font-semibold',
                selectedOption ? 'text-slate-900' : 'text-slate-400 font-normal'
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>

          <span className="flex items-center gap-1 shrink-0">
            {clearable && currentValue && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Hapus pilihan"
                onClick={(e) => {
                  e.stopPropagation();
                  emitChange('');
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-500 transition-transform duration-200',
                isOpen && 'rotate-180 text-brand-blue'
              )}
              aria-hidden="true"
            />
          </span>
        </button>

        {isOpen && (
          <div
            id={listboxId}
            role="listbox"
            aria-label={label || placeholder}
            className="absolute left-0 right-0 z-dropdown mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-elev-4 overflow-hidden animate-slide-up"
          >
            {(searchable || options.length > 6) && (
              <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                <div className="relative">
                  <Search
                    className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setActiveIndex(0);
                    }}
                    placeholder="Ketik untuk mencari..."
                    aria-label="Cari opsi"
                    className="w-full min-h-[38px] pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-brand-blue focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="py-6 px-3 text-center text-xs text-slate-500">
                  Tidak ada opsi yang cocok.
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === currentValue;
                  const isHighlighted = idx === activeIndex;
                  return (
                    <div
                      key={opt.value}
                      id={`${selectId}-option-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={opt.disabled || undefined}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelectOption(opt)}
                      className={cn(
                        'min-h-[44px] px-3 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-between gap-2 cursor-pointer select-none transition-colors',
                        opt.disabled && 'opacity-50 cursor-not-allowed',
                        isSelected
                          ? 'bg-brand-blue-50 text-brand-blue font-bold'
                          : isHighlighted
                          ? 'bg-slate-100 text-slate-900 font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <div className="min-w-0">
                        <span className="block truncate">{opt.label}</span>
                        {opt.description && (
                          <span className="block text-[11px] text-slate-500 font-normal truncate">
                            {opt.description}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-brand-blue shrink-0" aria-hidden="true" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );

    if (!label && !error && !helperText) {
      return comboboxControl;
    }

    return (
      <div className={cn('space-y-1.5', containerClassName)}>
        {label && (
          <Label htmlFor={selectId} required={required}>
            {label}
          </Label>
        )}
        {comboboxControl}
        {error && <FieldError id={errorId} message={error} />}
        {helperText && !error && <FieldHelper id={helperId} text={helperText} />}
      </div>
    );
  }
);

Select.displayName = 'Select';

