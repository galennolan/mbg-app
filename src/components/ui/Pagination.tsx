'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

function getVisiblePages(current: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);

  if (start > 2) pages.push('ellipsis');
  for (let p = start; p <= end; p++) {
    pages.push(p);
  }
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);

  return pages;
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  itemLabel = 'data',
}: PaginationProps) {
  if (totalItems === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, safePage * pageSize);
  const pages = getVisiblePages(safePage, totalPages);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/70 text-xs">
      <div className="flex flex-wrap items-center gap-3 text-slate-600">
        <span>
          Menampilkan <strong className="text-slate-900">{startIdx}–{endIdx}</strong> dari{' '}
          <strong className="text-slate-900">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <label className="inline-flex items-center gap-1.5">
            <span className="text-slate-500">Per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label={`Jumlah ${itemLabel} per halaman`}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-blue"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Navigasi halaman">
          <button
            type="button"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1}
            aria-label="Halaman sebelumnya"
            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {pages.map((p, idx) =>
            p === 'ellipsis' ? (
              <span key={`e-${idx}`} className="px-1.5 text-slate-400 select-none">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === safePage ? 'page' : undefined}
                className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg px-2.5 font-bold transition ${
                  p === safePage
                    ? 'bg-brand-blue text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            aria-label="Halaman berikutnya"
            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
