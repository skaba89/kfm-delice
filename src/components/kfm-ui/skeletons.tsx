"use client";

export function SkeletonStatCard() {
  return (
    <div className="rounded-[var(--radius)] border border-kfm-border bg-kfm-surface p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="kfm-skeleton h-4 w-28" />
          <div className="kfm-skeleton mt-3 h-8 w-40" />
          <div className="kfm-skeleton mt-3 h-4 w-24" />
        </div>
        <div className="kfm-skeleton h-10 w-10 rounded-[var(--radius)]" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="rounded-[var(--radius)] border border-kfm-border bg-kfm-surface overflow-hidden">
      <div className="border-b border-kfm-border px-5 py-3 flex gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="kfm-skeleton h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="border-b border-kfm-border px-5 py-4 flex gap-4 last:border-0"
        >
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="kfm-skeleton h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="rounded-[var(--radius)] border border-kfm-border bg-kfm-surface p-5">
      <div className="flex items-center justify-between">
        <div className="kfm-skeleton h-5 w-36" />
        <div className="kfm-skeleton h-8 w-24" />
      </div>
      <div className="kfm-skeleton mt-6 h-[240px] w-full" />
    </div>
  );
}
