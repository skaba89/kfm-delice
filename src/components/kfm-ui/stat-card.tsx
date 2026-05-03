"use client";

import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border border-kfm-border bg-kfm-surface p-5 shadow-[var(--kfm-shadow-sm)]",
        "animate-kfm-fade-in",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-kfm-text-2">{label}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-kfm-text truncate sm:text-3xl">
            {value}
          </h3>
          {change && (
            <p
              className={cn("mt-2 text-sm font-medium", {
                "text-kfm-success": changeType === "positive",
                "text-kfm-danger": changeType === "negative",
                "text-kfm-text-3": changeType === "neutral",
              })}
            >
              {change}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 rounded-[var(--radius)] bg-kfm-secondary/10 p-2.5 text-kfm-secondary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
