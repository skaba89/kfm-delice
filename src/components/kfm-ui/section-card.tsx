"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-kfm-border bg-kfm-surface shadow-[var(--kfm-shadow-sm)]",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-kfm-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <Icon className="h-4 w-4 text-kfm-text-2" />
            )}
            <div>
              {title && (
                <h3 className="text-sm font-semibold text-kfm-text">{title}</h3>
              )}
              {description && (
                <p className="text-xs text-kfm-text-3 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
