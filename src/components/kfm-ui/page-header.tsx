"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-kfm-secondary/10 text-kfm-secondary">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-kfm-text sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-kfm-text-2">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="mt-3 flex items-center gap-2 sm:mt-0">{actions}</div>}
    </div>
  );
}
