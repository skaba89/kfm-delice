"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius)] border border-dashed border-kfm-border bg-kfm-surface py-12 px-6 text-center",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-kfm-surface-2 text-kfm-text-3">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-kfm-text">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-kfm-text-2">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
