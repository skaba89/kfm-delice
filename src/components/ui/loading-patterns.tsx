"use client";

import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────
   MenuCardSkeleton
   Matches the customer menu item card layout:
   image placeholder, text lines, price, add button
   ────────────────────────────────────────────── */
export function MenuCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius)] border border-kfm-border bg-surface p-4"
        >
          {/* Image + text row (mobile: stacked, sm: side-by-side) */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Image placeholder */}
            <div className="relative flex-shrink-0 aspect-square w-full sm:w-28 md:w-32 rounded-xl overflow-hidden">
              <div className="h-full w-full kfm-skeleton" />
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Name line + button */}
              <div className="flex items-start justify-between gap-2">
                <div className="kfm-skeleton h-4 w-3/4" />
                <div className="kfm-skeleton h-8 w-8 flex-shrink-0 rounded-full" />
              </div>
              {/* Description */}
              <div className="mt-2 space-y-1.5">
                <div className="kfm-skeleton h-3 w-full" />
                <div className="kfm-skeleton h-3 w-2/3" />
              </div>
              {/* Dietary badges */}
              <div className="mt-2 flex gap-1.5">
                <div className="kfm-skeleton h-5 w-14 rounded-md" />
                <div className="kfm-skeleton h-5 w-10 rounded-md" />
              </div>
              {/* Price + prep time */}
              <div className="mt-auto pt-3 flex items-center gap-3">
                <div className="kfm-skeleton h-4 w-20" />
                <div className="kfm-skeleton h-3 w-14" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   OrderRowSkeleton
   Matches the customer order card row layout:
   order number, status, details, price
   ────────────────────────────────────────────── */
export function OrderRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius)] border border-kfm-border bg-surface p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 space-y-2">
              {/* Order number + status badge */}
              <div className="flex items-center gap-2">
                <div className="kfm-skeleton h-5 w-28" />
                <div className="kfm-skeleton h-5 w-16 rounded-full" />
              </div>
              {/* Details */}
              <div className="kfm-skeleton h-4 w-48" />
              <div className="kfm-skeleton h-4 w-32" />
              {/* Items preview */}
              <div className="kfm-skeleton h-4 w-64" />
            </div>
            {/* Price + chevron */}
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <div className="kfm-skeleton h-4 w-16" />
              <div className="kfm-skeleton h-4 w-4 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   DashboardKPISkeleton
   Matches the StatCard layout used in the admin
   dashboard: icon, label, value, trend
   ────────────────────────────────────────────── */
export function DashboardKPISkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius)] border border-kfm-border bg-surface p-5 shadow-sm"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Label */}
              <div className="kfm-skeleton h-4 w-32" />
              {/* Value */}
              <div className="kfm-skeleton h-8 w-28" />
              {/* Trend */}
              <div className="kfm-skeleton h-4 w-20" />
            </div>
            {/* Icon */}
            <div className="kfm-skeleton h-10 w-10 rounded-[var(--radius)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   TableSkeleton
   A generic table skeleton with header + rows.
   ────────────────────────────────────────────── */
export function TableSkeleton({
  columns = 5,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="rounded-[var(--radius)] border border-kfm-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="border-b border-kfm-border px-5 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="kfm-skeleton h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "px-5 py-4 flex gap-4",
            i < rows - 1 && "border-b border-kfm-border"
          )}
        >
          {Array.from({ length: columns }).map((_, j) => (
            <div key={j} className="kfm-skeleton h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
